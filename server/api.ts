import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from './db';
import { orderSchema, reviewSchema, fieldErrors, type Cake, type Review } from './schema';

export const apiRouter = Router();

const ordersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many orders from this device. Please try again shortly or WhatsApp us.' },
});

const reviewsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many review submissions. Please try again later.' },
});

const uploadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please try again later.' },
});

interface CakeRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  price_from: number | null;
  sizes: string;
  flavors: string;
  image: string;
  available: number;
  featured: number;
}

function parseCake(row: CakeRow): Cake {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as Cake['category'],
    description: row.description,
    price_from: row.price_from,
    sizes: JSON.parse(row.sizes || '[]'),
    flavors: JSON.parse(row.flavors || '[]'),
    image: row.image,
    available: row.available === 1,
    featured: row.featured === 1,
  };
}

function parseReview(row: {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  approved: number;
  created_at: string;
}): Review {
  return { ...row, approved: row.approved === 1 };
}

apiRouter.get('/menu', (req, res) => {
  const { category, featured } = req.query;
  let sql = 'SELECT * FROM cakes';
  const where: string[] = [];
  const params: unknown[] = [];
  if (typeof category === 'string' && category !== 'all') {
    where.push('category = ?');
    params.push(category);
  }
  if (featured === '1') where.push('featured = 1');
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY sort_order ASC, id ASC';
  const rows = db.prepare(sql).all(...params) as CakeRow[];
  res.json(rows.map(parseCake));
});

apiRouter.get('/menu/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM cakes WHERE slug = ?').get(req.params.slug) as
    | CakeRow
    | undefined;
  if (!row) return res.status(404).json({ error: 'Item not found' });
  res.json(parseCake(row));
});

apiRouter.get('/reviews', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM reviews WHERE approved = 1 ORDER BY id DESC')
    .all() as Parameters<typeof parseReview>[0][];
  res.json(rows.map(parseReview));
});

apiRouter.post('/reviews', reviewsLimiter, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the form', fields: fieldErrors(parsed.error) });
  }
  const { name, location, rating, text } = parsed.data;
  const info = db
    .prepare('INSERT INTO reviews (name, location, rating, text, approved) VALUES (?, ?, ?, ?, 0)')
    .run(name, location, rating, text);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Thank you! Your review will appear after a quick check.' });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif)$/i.test(path.extname(file.originalname));
    if (ok) cb(null, true);
    else cb(new Error('Only images are allowed (jpg, png, webp, gif)'));
  },
});

apiRouter.post('/upload', uploadsLimiter, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      const code = (err as { code?: string }).code;
      let msg = 'Upload failed';
      if (err.message.includes('Only images')) msg = err.message;
      else if (code === 'LIMIT_FILE_SIZE' || err.message.toLowerCase().includes('too large'))
        msg = 'Image must be 2MB or smaller';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No image received' });
    res.status(201).json({ filename: req.file.filename });
  });
});

function makeRef(): string {
  for (let i = 0; i < 10; i++) {
    const n = crypto.randomInt(1000, 9999);
    const ref = `RT-${n}`;
    const existing = db.prepare('SELECT 1 FROM orders WHERE ref = ?').get(ref);
    if (!existing) return ref;
  }
  return `RT-${Date.now().toString().slice(-6)}`;
}

apiRouter.post('/orders', ordersLimiter, (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the highlighted fields', fields: fieldErrors(parsed.error) });
  }
  const d = parsed.data;
  const ref = makeRef();
  db.prepare(
    `INSERT INTO orders (ref, name, phone, email, type, item, flavor, size, qty, inscription, needed_date, delivery, area, address, notes, photo)
     VALUES (@ref, @name, @phone, @email, @type, @item, @flavor, @size, @qty, @inscription, @neededDate, @delivery, @area, @address, @notes, @photo)`
  ).run({ ...d, ref, photo: d.photo || null });
  res.status(201).json({ ref, message: 'Order received! We will call you to confirm.' });
});
