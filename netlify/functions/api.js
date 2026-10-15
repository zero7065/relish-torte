// Relish Torte API — one Netlify Function behind /api/*.
//
//   GET    /api/state                 public shared site state (content, menu, images,
//                                     approved reviews/ratings, like counts)
//   POST   /api/review|order|rating|like|feedback    visitor submissions (rate-limited)
//   POST   /api/admin/login           email + password -> signed 12h session token
//   GET    /api/admin/state           private state for the dashboard (token required)
//   PATCH  /api/admin/orders|reviews|ratings          pipeline + moderation
//   PUT    /api/admin/content|menu|image              content / menu / image-slot writes
//   POST   /api/admin/upload          store an image in Blobs, returns a public URL
//   POST   /api/admin/account         change admin email and/or password
//   GET    /api/img/<id>.<ext>        serve a stored image (immutable cache)
//
import crypto from 'node:crypto';
import { connectLambda } from '@netlify/blobs';
import { readJSON, writeJSON, readBytes, writeBytes, removeKey } from './lib/store.js';

/* ------------------------------------------------------------------ helpers */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

function json(status, data, extra = {}) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...extra },
    body: JSON.stringify(data),
  };
}

const bad = (status, error, fields) => json(status, fields ? { error, fields } : { error });

/** `/api/x`, `/.netlify/functions/api/x` and direct invocation all resolve to `/x`. */
function route(event) {
  let p = event.path || '/';
  p = p.replace(/^\/\.netlify\/functions\/api/i, '');
  p = p.replace(/^\/api/i, '');
  p = p.split('?')[0];
  p = p.replace(/\/+$/, '');
  return p || '/state';
}

function bodyOf(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function clientIp(event) {
  const h = event.headers || {};
  return h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
}

function bearer(event) {
  const h = event.headers || {};
  const a = h.authorization || h.Authorization || '';
  return a.startsWith('Bearer ') ? a.slice(7) : '';
}

/* ------------------------------------------------- rate limiting (best effort) */

const buckets = new Map();

function overLimit(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { n: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.n += 1;
  return b.n > max;
}

const MIN15 = 15 * 60 * 1000;

/* ------------------------------------------------------------- admin account */

const DEFAULT_EMAIL = 'admin@gmail.com';
const DEFAULT_PASSWORD = '1234';

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const calc = crypto.scryptSync(String(pw), salt, 64);
  return expected.length === calc.length && crypto.timingSafeEqual(expected, calc);
}

async function ensureAdmin() {
  let admin = await readJSON('admin', null);
  if (!admin || !admin.passwordHash || !admin.email) {
    admin = {
      email: process.env.ADMIN_EMAIL || DEFAULT_EMAIL,
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD),
    };
    await writeJSON('admin', admin);
  }
  return admin;
}

/** Session secret is derived from the password hash, so changing the password
 *  (or any tampering) instantly invalidates every outstanding session. */
function sessionSecret(admin) {
  return crypto.createHmac('sha256', 'relish-torte-session-v1').update(admin.passwordHash).digest();
}

function signToken(admin) {
  const payload = { email: admin.email, exp: Date.now() + 12 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret(admin)).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function tokenValid(token, admin) {
  if (!token || token.indexOf('.') < 1) return false;
  const dot = token.indexOf('.');
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = crypto.createHmac('sha256', sessionSecret(admin)).update(body).digest('base64url');
  if (sig.length !== expect.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return !!p && typeof p.exp === 'number' && p.exp > Date.now();
  } catch {
    return false;
  }
}

async function requireAdmin(event) {
  const admin = await ensureAdmin();
  const token = bearer(event);
  if (!token || !tokenValid(token, admin)) return null;
  return admin;
}

/* ------------------------------------------------------------------ state */

const CONTENT_KEYS = ['RT_ABOUT', 'RT_WHY', 'RT_HOW', 'RT_PROCESS', 'RT_GALLERY', 'RT_SPACE', 'RT_HERO_SLIDES'];
const ORDER_STATUSES = ['new', 'confirmed', 'baking', 'ready', 'delivered'];
const MAX_BODY = 5 * 1024 * 1024;

async function publicState() {
  const [content, menu, images, uploads, reviews, ratings, likes] = await Promise.all([
    readJSON('content', {}),
    readJSON('menu', {}),
    readJSON('images', {}),
    readJSON('uploads', {}),
    readJSON('reviews', []),
    readJSON('ratings', { approved: {}, pending: [] }),
    readJSON('likes', {}),
  ]);
  return {
    updatedAt: new Date().toISOString(),
    content,
    menu,
    images,
    uploads,
    reviews: (Array.isArray(reviews) ? reviews : []).filter((r) => r && r.approved),
    ratings: { approved: (ratings && ratings.approved) || {} },
    likes: likes && typeof likes === 'object' ? likes : {},
  };
}

async function adminState() {
  const [content, menu, images, uploads, orders, reviews, ratings, feedback, admin] = await Promise.all([
    readJSON('content', {}),
    readJSON('menu', {}),
    readJSON('images', {}),
    readJSON('uploads', {}),
    readJSON('orders', []),
    readJSON('reviews', []),
    readJSON('ratings', { approved: {}, pending: [] }),
    readJSON('feedback', []),
    ensureAdmin(),
  ]);
  return {
    content,
    menu,
    images,
    uploads,
    orders,
    reviews,
    ratings: {
      approved: (ratings && ratings.approved) || {},
      pending: (ratings && ratings.pending) || [],
    },
    feedback,
    adminEmail: admin.email,
  };
}

/* ------------------------------------------------------- public submissions */

async function submitReview(event, body) {
  const name = String(body.name || '').trim().slice(0, 80);
  const text = String(body.text || '').trim().slice(0, 1200);
  const location = String(body.location || '').trim().slice(0, 80);
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  if (!name || !text) return bad(400, 'Please add your name and a few words.');

  const reviews = await readJSON('reviews', []);
  const entry = {
    // keep the id the client generated so moderation hits the same record
    id: Number(body.id) || Date.now() + Math.floor(Math.random() * 1000),
    name,
    location,
    rating,
    text,
    approved: false,
    createdAt: body.createdAt || new Date().toISOString(),
  };
  const dup = reviews.find((r) => r && r.id === entry.id);
  if (dup) {
    dup.name = entry.name;
    dup.location = entry.location;
    dup.rating = entry.rating;
    dup.text = entry.text;
  } else {
    reviews.unshift(entry);
  }
  await writeJSON('reviews', reviews.slice(0, 500));
  return json(201, { ok: true, id: entry.id, message: 'Thank you! Your review appears after a quick check.' });
}

async function submitOrder(event, body) {
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim().slice(0, 40);
  if (!name || !phone) return bad(400, 'Name and phone are required.');

  const orders = await readJSON('orders', []);
  const order = { ...body };
  order.name = name;
  order.phone = phone;
  order.ref = String(order.ref || '').trim().slice(0, 24) || 'RT-' + Date.now().toString().slice(-6);
  order.createdAt = order.createdAt || new Date().toISOString();
  // keep it small and sane
  Object.keys(order).forEach((k) => {
    if (typeof order[k] === 'string') order[k] = order[k].slice(0, 800);
  });

  const idx = orders.findIndex((o) => o && o.ref === order.ref);
  if (idx >= 0) {
    // Re-push (outbox retry): refresh the details but never roll the pipeline
    // back — status only ever changes through PATCH /admin/orders.
    const prev = orders[idx];
    order.status = prev.status || 'new';
    order.createdAt = prev.createdAt || order.createdAt;
    order.updatedAt = new Date().toISOString();
    orders.splice(idx, 1);
    orders.unshift(order);
    await writeJSON('orders', orders.slice(0, 500));
    return json(200, { ok: true, ref: order.ref, status: order.status });
  }

  order.status = 'new';
  orders.unshift(order);
  await writeJSON('orders', orders.slice(0, 500));
  return json(201, { ok: true, ref: order.ref, message: 'Order received! We will call you to confirm.' });
}

async function submitRating(event, body) {
  const slug = String(body.slug || '').trim().slice(0, 80);
  const stars = Math.min(5, Math.max(1, Number(body.stars) || 0));
  if (!slug || !stars) return bad(400, 'Please pick a star rating.');

  const ratings = await readJSON('ratings', { approved: {}, pending: [] });
  if (!ratings.approved) ratings.approved = {};
  if (!ratings.pending) ratings.pending = [];
  ratings.pending = ratings.pending.filter((p) => p && p.slug !== slug);
  ratings.pending.unshift({
    id: Number(body.id) || Date.now() + Math.floor(Math.random() * 1000),
    slug,
    stars,
    ts: body.ts || new Date().toISOString(),
  });
  await writeJSON('ratings', ratings);
  return json(201, { ok: true, message: 'Thanks! Your rating shows once approved.' });
}

async function submitLike(event, body) {
  const slug = String(body.slug || '').trim().slice(0, 80);
  const delta = Number(body.delta) === -1 ? -1 : 1;
  if (!slug) return bad(400, 'Missing item.');

  const likes = await readJSON('likes', {});
  const next = Math.max(0, (Number(likes[slug]) || 0) + delta);
  likes[slug] = next;
  await writeJSON('likes', likes);
  return json(200, { ok: true, count: next });
}

async function submitFeedback(event, body) {
  const stars = (v) => Math.min(5, Math.max(1, Number(v) || 0)) || null;
  const id = Number(body.id) || Date.now() + Math.floor(Math.random() * 1000);
  const entry = {
    id,
    ref: String(body.ref || '').slice(0, 24),
    overall: stars(body.overall),
    taste: stars(body.taste),
    packaging: stars(body.packaging),
    delivery: stars(body.delivery),
    quality: stars(body.quality), // older payload shape
    comment: String(body.comment || body.note || '').slice(0, 800),
    note: String(body.note || '').slice(0, 500),
    ts: body.ts || new Date().toISOString(),
  };
  const list = await readJSON('feedback', []);
  const idx = list.findIndex((f) => f && f.id === id);
  if (idx >= 0) list.splice(idx, 1); // outbox retries must not duplicate
  list.unshift(entry);
  await writeJSON('feedback', list.slice(0, 500));
  return json(201, { ok: true, message: 'Thank you — noted by the kitchen.' });
}

/* ------------------------------------------------------------------ admin */

async function adminLogin(event, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return bad(400, 'Email and password are required.');

  const admin = await ensureAdmin();
  if (email !== String(admin.email).toLowerCase() || !verifyPassword(password, admin.passwordHash)) {
    return bad(401, 'Invalid email or password.');
  }
  return json(200, { ok: true, token: signToken(admin), email: admin.email });
}

async function adminAccount(event, body) {
  const admin = await ensureAdmin();
  const current = String(body.currentPassword || '');
  // The caller already proved who they are via the session token; checking the
  // password again is optional and only enforced when one is supplied.
  if (current && !verifyPassword(current, admin.passwordHash)) return bad(403, 'Current password is incorrect.');

  const next = { email: admin.email, passwordHash: admin.passwordHash };
  const newEmail = body.email != null ? String(body.email).trim() : '';
  const newPassword = body.password != null ? String(body.password) : '';

  if (newEmail) {
    if (newEmail.indexOf('@') < 1 || newEmail.length > 120) return bad(400, 'Enter a valid email address.');
    next.email = newEmail;
  }
  if (newPassword) {
    if (newPassword.length < 6) return bad(400, 'New password must be at least 6 characters.');
    next.passwordHash = hashPassword(newPassword);
  }
  if (next.email === admin.email && next.passwordHash === admin.passwordHash) {
    return bad(400, 'Nothing to change.');
  }

  await writeJSON('admin', next);
  // secret is derived from passwordHash -> old sessions die automatically
  return json(200, { ok: true, email: next.email, token: signToken(next), message: 'Account updated.' });
}

async function adminPutContent(event, body) {
  const key = String(body.key || '');
  if (!CONTENT_KEYS.includes(key)) return bad(400, 'Unknown content block.');
  if (body.value === undefined) return bad(400, 'Missing value.');

  const content = await readJSON('content', {});
  content[key] = body.value;
  await writeJSON('content', content);
  return json(200, { ok: true, key });
}

async function adminPutMenu(event, body) {
  const slug = String(body.slug || '').trim();
  const patch = body.patch && typeof body.patch === 'object' ? body.patch : {};
  if (!slug) return bad(400, 'Missing item.');

  const menu = await readJSON('menu', {});
  const cur = menu[slug] || {};
  if (patch.price_from !== undefined) cur.price_from = Number(patch.price_from) || 0;
  if (patch.available !== undefined) cur.available = !!patch.available;
  if (patch.featured !== undefined) cur.featured = !!patch.featured;
  menu[slug] = cur;
  await writeJSON('menu', menu);
  return json(200, { ok: true, slug, patch: cur });
}

async function adminPutImage(event, body) {
  const slug = String(body.slug || '').trim();
  if (!slug) return bad(400, 'Missing item.');
  const value = body.value == null ? null : String(body.value).slice(0, 300);

  const images = await readJSON('images', {});
  if (value) images[slug] = value;
  else delete images[slug];
  await writeJSON('images', images);
  return json(200, { ok: true, slug, value: value || null });
}

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const EXT_TYPE = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

async function adminUpload(event, body) {
  const dataUrl = String(body.dataUrl || '');
  const name = String(body.name || 'image').slice(0, 120);
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return bad(400, 'Send the image as a base64 data URL.');
  if (m[2].length > 6 * 1024 * 1024) return bad(413, 'Image is too large — resize it first.');

  const ext = MIME_EXT[m[1]];
  if (!ext) return bad(400, 'Only jpg, png, webp or gif images are allowed.');

  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length > 4 * 1024 * 1024) return bad(413, 'Image must be under 4MB.');
  if (!bytes.length) return bad(400, 'Empty image.');

  const id = crypto.randomBytes(8).toString('hex');
  const filename = `${id}.${ext}`;
  await writeBytes(`images/${filename}`, bytes);

  const uploads = await readJSON('uploads', {});
  uploads[filename] = {
    id,
    file: filename,
    name,
    bytes: bytes.length,
    type: EXT_TYPE[ext],
    createdAt: new Date().toISOString(),
  };
  await writeJSON('uploads', uploads);

  return json(201, { ok: true, file: filename, url: `/api/img/${filename}`, bytes: bytes.length, type: EXT_TYPE[ext] });
}

async function adminDeleteUpload(event) {
  const file = String((event.queryStringParameters || {}).file || '').slice(0, 60);
  if (!/^[a-f0-9]{16}\.[a-z0-9]{1,5}$/.test(file)) return bad(400, 'Bad filename.');
  await removeKey(`images/${file}`);
  const uploads = await readJSON('uploads', {});
  delete uploads[file];
  await writeJSON('uploads', uploads);
  return json(200, { ok: true });
}

async function patchOrders(event, body) {
  const ref = String(body.ref || '');
  const status = String(body.status || '');
  if (!ORDER_STATUSES.includes(status)) return bad(400, 'Invalid status.');
  const orders = await readJSON('orders', []);
  const order = orders.find((o) => o && o.ref === ref);
  if (!order) return bad(404, 'Order not found.');
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await writeJSON('orders', orders);
  return json(200, { ok: true, ref, status });
}

async function patchReviews(event, body) {
  const id = Number(body.id);
  const approved = !!body.approved;
  const reviews = await readJSON('reviews', []);
  const review = reviews.find((r) => r && r.id === id);
  if (!review) return bad(404, 'Review not found.');
  review.approved = approved;
  review.reviewedAt = new Date().toISOString();
  await writeJSON('reviews', reviews);
  return json(200, { ok: true, id, approved });
}

async function patchRatings(event, body) {
  const action = String(body.action || '');
  const ratings = await readJSON('ratings', { approved: {}, pending: [] });
  if (!ratings.approved) ratings.approved = {};
  if (!ratings.pending) ratings.pending = [];

  // undo of an approval, clearing a published average, and restoring one
  if (action === 'unapprove' || action === 'reset' || action === 'restore') {
    const slug = String(body.slug || '');
    if (action === 'restore') {
      const sum = Math.max(0, Number(body.sum) || 0);
      const n = Math.max(0, Number(body.n) || 0);
      if (!n) return bad(400, 'Nothing to restore.');
      ratings.approved[slug] = { sum, n };
      await writeJSON('ratings', ratings);
      return json(200, { ok: true, action, slug });
    }
    const cur = ratings.approved[slug];
    if (!cur) return bad(404, 'Nothing published for that item.');
    if (action === 'reset') {
      delete ratings.approved[slug];
    } else {
      const n = Math.max(0, (cur.n || 0) - 1);
      if (n <= 0) delete ratings.approved[slug];
      else ratings.approved[slug] = { sum: Math.max(0, (cur.sum || 0) - (Number(body.stars) || 0)), n };
    }
    await writeJSON('ratings', ratings);
    return json(200, { ok: true, action, slug });
  }

  if (action !== 'approve' && action !== 'reject') return bad(400, 'Invalid action.');

  const id = Number(body.id);
  const idx = ratings.pending.findIndex((p) => p && p.id === id);
  if (idx < 0) return bad(404, 'Rating not found.');
  const entry = ratings.pending[idx];

  if (action === 'approve') {
    const cur = ratings.approved[entry.slug] || { sum: 0, n: 0 };
    ratings.approved[entry.slug] = { sum: cur.sum + entry.stars, n: cur.n + 1 };
  }
  ratings.pending.splice(idx, 1);
  await writeJSON('ratings', ratings);
  return json(200, { ok: true, id, action });
}

async function deleteById(event, which) {
  const id = Number((event.queryStringParameters || {}).id);
  if (!id) return bad(400, 'Missing id.');
  const map = { reviews: 'reviews', feedback: 'feedback' };
  const key = map[which];
  if (!key) return bad(404, 'Not found.');
  const list = await readJSON(key, []);
  const next = list.filter((r) => r && r.id !== id);
  if (next.length === list.length) return bad(404, 'Not found.');
  await writeJSON(key, next);
  return json(200, { ok: true, id });
}

/* ------------------------------------------------------------------ images */

async function serveImage(event) {
  const file = decodeURIComponent(((event.path || '').split('/img/')[1] || '')).split('?')[0];
  if (!/^[a-f0-9]{16}\.[a-z0-9]{1,5}$/.test(file)) return bad(400, 'Bad image reference.');
  const ext = file.split('.').pop().toLowerCase();
  const type = EXT_TYPE[ext];
  if (!type) return bad(404, 'Unsupported image type.');

  const bytes = await readBytes(`images/${file}`);
  if (!bytes) return bad(404, 'Image not found.');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ...CORS,
    },
    body: Buffer.from(bytes).toString('base64'),
    isBase64Encoded: true,
  };
}

/* ------------------------------------------------------------------ router */

export const handler = async (event) => {
  // In the Lambda (v1) runtime Netlify hands Blobs its credentials on the
  // event payload instead of the environment, so the store cannot be used
  // until this is wired up. Must run before any readJSON/writeJSON.
  try {
    if (event && event.blobs) connectLambda(event);
  } catch (err) {
    console.error('blobs init failed', err);
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const path = route(event);
  const method = (event.httpMethod || 'GET').toUpperCase();
  const ip = clientIp(event);
  const body = bodyOf(event);

  try {
    if (method === 'GET' && path === '/state') {
      return json(200, await publicState(), {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      });
    }
    if (path.startsWith('/img/')) return await serveImage(event);

    /* ---- visitor submissions (rate-limited, no auth) ---- */
    if (method === 'POST') {
      if (overLimit('w:' + ip, 40, MIN15)) return bad(429, 'Too many requests. Please try again shortly.');

      if (path === '/review') return await submitReview(event, body);
      if (path === '/order') return await submitOrder(event, body);
      if (path === '/rating') return await submitRating(event, body);
      if (path === '/like') return await submitLike(event, body);
      if (path === '/feedback') return await submitFeedback(event, body);

      if (path === '/admin/login') {
        if (overLimit('l:' + ip, 10, MIN15)) return bad(429, 'Too many login attempts. Try again later.');
        return await adminLogin(event, body);
      }
    }

    /* ---- everything below needs a valid admin session ---- */
    if (path.startsWith('/admin/')) {
      const admin = await requireAdmin(event);
      if (!admin) return bad(401, 'Admin login required.');
      if (overLimit('a:' + ip, 300, MIN15)) return bad(429, 'Too many requests.');

      const sub = path.slice('/admin/'.length);

      if (method === 'GET' && sub === '/state') {
        return json(200, await adminState(), { 'Cache-Control': 'no-store' });
      }
      if (method === 'POST' && sub === '/account') return await adminAccount(event, body);
      if (method === 'POST' && sub === '/upload') return await adminUpload(event, body);
      if (method === 'DELETE' && sub === '/upload') return await adminDeleteUpload(event);
      if (method === 'PUT' && sub === '/content') return await adminPutContent(event, body);
      if (method === 'PUT' && sub === '/menu') return await adminPutMenu(event, body);
      if (method === 'PUT' && sub === '/image') return await adminPutImage(event, body);
      if (method === 'PATCH' && sub === '/orders') return await patchOrders(event, body);
      if (method === 'PATCH' && sub === '/reviews') return await patchReviews(event, body);
      if (method === 'PATCH' && sub === '/ratings') return await patchRatings(event, body);
      if (method === 'DELETE' && (sub === '/reviews' || sub === '/feedback')) return await deleteById(event, sub.split('/')[1]);

      return bad(404, 'Unknown admin endpoint.');
    }

    return bad(404, 'Unknown endpoint.');
  } catch (err) {
    console.error('api error', method, path, err);
    // Keep the message short but real — a generic 500 is impossible to debug
    // from the outside, and these are storage/config errors, not secrets.
    const detail = err && err.message ? String(err.message).slice(0, 180) : '';
    return bad(500, detail ? 'Server error: ' + detail : 'Server error. Please try again.');
  }
};
