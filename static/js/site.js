// Relish Torte — static site shared logic
(function () {
  'use strict';

  // ---------- helpers ----------
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function naira(v) {
    if (v === null || v === undefined) return 'Custom quote';
    return '₦' + Number(v).toLocaleString('en-NG');
  }

  function waLink(msg) {
    return 'https://wa.me/' + RT_PHONE_INTL + '?text=' + encodeURIComponent(msg);
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function minOrderDate() {
    var d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  function prettyDate(v) {
    if (!v) return '—';
    var d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- shared sync layer ----------
  // localStorage stays the working store (fast, offline, works from file://).
  // The server behind /api is the shared mirror: its payload is merged into
  // localStorage on load, and every edit is posted back to it — so a change
  // made in the dashboard reaches every visitor, and nothing breaks offline.
  var API_BASE = '/api';
  var STATE_KEY = 'rt_state_cache'; // "we have synced at least once"
  var DIRTY_KEY = 'rt_dirty';       // keys edited here but not on the server yet
  var STATE_TIMEOUT = 2000;

  var statePromise = null;

  function remoteKeys() {
    return {
      content: CONTENT_KEY,
      images: IMG_KEY,
      menu: MENU_KEY,
      reviews: LOCAL_REVIEWS_KEY,
      ratings: RATINGS_KEY,
      likes: LIKES_KEY,
      feedback: FEEDBACK_KEY,
      orders: ORDERS_KEY,
    };
  }

  function dirty() {
    var d = load(DIRTY_KEY, []);
    return Array.isArray(d) ? d : [];
  }

  function markDirty(key) {
    var d = dirty();
    if (d.indexOf(key) === -1) {
      d.push(key);
      save(DIRTY_KEY, d);
    }
  }

  function clearDirty(key) {
    var d = dirty();
    var i = d.indexOf(key);
    if (i !== -1) {
      d.splice(i, 1);
      save(DIRTY_KEY, d);
    }
  }

  /** Merge the server payload into localStorage. Server wins for anything we
   *  have not edited locally; a key waiting in the outbox stays local until
   *  its edit has been pushed. */
  function mergeServer(data) {
    if (!data || typeof data !== 'object') return;
    var k = remoteKeys();
    var d = dirty();
    function serverWins(key) { return d.indexOf(key) === -1; }

    if (data.content && serverWins(k.content)) {
      save(k.content, Object.assign({}, load(k.content, {}), data.content));
    }
    if (data.images && serverWins(k.images)) {
      save(k.images, Object.assign({}, load(k.images, {}), data.images));
    }
    if (data.menu && serverWins(k.menu)) {
      save(k.menu, Object.assign({}, load(k.menu, {}), data.menu));
    }

    if (Array.isArray(data.reviews)) {
      var byId = {};
      load(k.reviews, []).forEach(function (r) { if (r && r.id != null) byId[r.id] = r; });
      data.reviews.forEach(function (r) { if (r && r.id != null) byId[r.id] = r; });
      save(k.reviews, Object.keys(byId).map(function (x) { return byId[x]; }));
    }

    if (data.ratings && data.ratings.approved && serverWins(k.ratings)) {
      var rs = load(k.ratings, { approved: {}, pending: [], mine: {} });
      if (!rs.approved) rs.approved = {};
      if (!rs.pending) rs.pending = [];
      if (!rs.mine) rs.mine = {};
      rs.approved = data.ratings.approved;
      if (Array.isArray(data.ratings.pending)) {
        // admin payload: everyone's waiting ratings, not just this browser's
        var rb = {};
        rs.pending.forEach(function (p) { if (p && p.id != null) rb[p.id] = p; });
        data.ratings.pending.forEach(function (p) { if (p && p.id != null) rb[p.id] = p; });
        rs.pending = Object.keys(rb).map(function (x) { return rb[x]; });
      }
      save(k.ratings, rs);
    }

    if (data.likes && serverWins(k.likes)) {
      var ls = load(k.likes, { mine: {}, counts: {} });
      if (!ls.mine) ls.mine = {};
      if (!ls.counts) ls.counts = {};
      ls.counts = Object.assign({}, ls.counts, data.likes);
      save(k.likes, ls);
    }

    if (data.feedback) {
      var fb = {};
      load(k.feedback, []).forEach(function (f) { if (f && f.id != null) fb[f.id] = f; });
      data.feedback.forEach(function (f) { if (f && f.id != null) fb[f.id] = f; });
      save(k.feedback, Object.keys(fb).map(function (x) { return fb[x]; }));
    }

    if (Array.isArray(data.orders) && serverWins(k.orders)) {
      var ob = {};
      load(k.orders, []).forEach(function (o) { if (o && o.ref) ob[o.ref] = o; });
      data.orders.forEach(function (o) { if (o && o.ref) ob[o.ref] = o; });
      save(k.orders, Object.keys(ob).map(function (x) { return ob[x]; }));
    }

    try { save(STATE_KEY, { at: Date.now(), uploads: data.uploads || {} }); }
    catch (e) { /* cache marker is optional */ }
  }

  function hasSnapshot() {
    try { return !!load(STATE_KEY, null); } catch (e) { return false; }
  }

  var lastPushError = null;

  /** Send an edit to the server. On failure the key is flagged local-only so
   *  the next sync will not clobber it, and the call is queued for a retry.
   *  Never rejects — callers in the dashboard ignore the result, so a failed
   *  push emits `rt:push-error` instead of becoming an unhandled rejection. */
  function push(method, key, path, body, opts) {
    opts = opts || {};
    return api(method, path, body, !!opts.auth)
      .then(function () { clearDirty(key); return { ok: true }; })
      .catch(function (err) {
        markDirty(key);
        queueOutbox(method, path, body);
        lastPushError = { path: path, message: (err && err.message) || 'offline', at: Date.now() };
        emit('rt:push-error', lastPushError);
        return { ok: false, queued: true, error: lastPushError.message };
      });
  }

  function api(method, path, data, needsAuth) {
    var headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (needsAuth) {
      var token = adminToken();
      if (token) headers.Authorization = 'Bearer ' + token;
    }
    var init = { method: method, headers: headers, cache: 'no-store' };
    if (data !== undefined) init.body = JSON.stringify(data);

    // Promise.resolve().then keeps this a promise even when fetch is missing
    // (file://, very old browsers) or throws synchronously.
    return Promise.resolve().then(function () {
      if (typeof fetch !== 'function') throw new Error('offline');
      return fetch(API_BASE + path, init);
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok) {
          var err = new Error((j && j.error) || 'Request failed (' + res.status + ')');
          err.status = res.status;
          err.fields = (j && j.fields) || null;
          throw err;
        }
        return j;
      });
    });
  }

  function adminToken() {
    try { return sessionStorage.getItem('rt_admin_token') || ''; } catch (e) { return ''; }
  }
  function setAdminToken(token) {
    try {
      if (token) sessionStorage.setItem('rt_admin_token', token);
      else sessionStorage.removeItem('rt_admin_token');
    } catch (e) { /* private mode */ }
  }

  /** Never let a slow network block the page: give up after STATE_TIMEOUT. */
  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; reject(new Error('timeout')); } }, ms);
      promise.then(function (v) { if (!done) { done = true; clearTimeout(timer); resolve(v); } },
        function (e) { if (!done) { done = true; clearTimeout(timer); reject(e); } });
    });
  }

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }
    catch (e) { /* no CustomEvent support */ }
  }

  function loadState() {
    if (statePromise) return statePromise;
    if (location.protocol === 'file:' || typeof fetch !== 'function') {
      statePromise = Promise.resolve(null);
      return statePromise;
    }
    statePromise = withTimeout(
      Promise.resolve()
        .then(function () {
          return fetch(API_BASE + '/state', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          mergeServer(data);
          emit('rt:state', data);
          return data;
        }),
      STATE_TIMEOUT
    ).catch(function () {
      // offline, blocked, slow or file:// — render from localStorage as-is
      emit('rt:state');
      return null;
    });
    return statePromise;
  }

  /**
   * Run `fn` once the DOM is ready AND we have something correct to show.
   *
   * If a cached server snapshot exists we paint immediately (stale-while-
   * revalidate) — no visible wait for returning visitors. On a first visit we
   * wait for the server so nobody ever sees the wrong content; loadState()
   * gives up after STATE_TIMEOUT, so a slow network can never hang the page.
   */
  function ready(fn) {
    var started = false;
    var domReady = false;
    var stateReady = false;

    function tryRun() {
      if (!started && domReady && stateReady) {
        started = true;
        fn();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { domReady = true; tryRun(); });
    } else {
      domReady = true;
    }

    function settle() { stateReady = true; tryRun(); }

    if (hasSnapshot()) {
      settle();
      try { loadState(); } catch (e) { /* already have a snapshot */ }
    } else {
      try { loadState().then(settle, settle); }
      catch (e) { settle(); }
    }
    tryRun();
  }

  // ---------- outbox: retry anything that failed while offline ----------
  var OUTBOX_KEY = 'rt_outbox';

  function queueOutbox(method, path, body) {
    var q = load(OUTBOX_KEY, []);
    q.push({ m: method || 'POST', path: path, body: body, at: Date.now() });
    save(OUTBOX_KEY, q.slice(-40));
  }

  function flushOutbox() {
    var q = load(OUTBOX_KEY, []);
    if (!q.length || location.protocol === 'file:' || typeof fetch !== 'function') return Promise.resolve();
    var remaining = [];
    var chain = Promise.resolve();
    q.forEach(function (op) {
      chain = chain.then(function () {
        return api(op.m || 'POST', op.path, op.body, /^\/admin/.test(op.path))
          .catch(function () { remaining.push(op); });
      });
    });
    return chain.then(function () {
      save(OUTBOX_KEY, remaining);
      if (!remaining.length) save(DIRTY_KEY, []);
      else loadState();
    });
  }

  // ---------- storage (best-effort, works on file://) ----------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  var MENU_KEY = 'rt_menu_overrides';
  var ORDERS_KEY = 'rt_orders';
  var LOCAL_REVIEWS_KEY = 'rt_reviews';
  var PENDING_ORDERS_KEY = 'rt_orders';

  function getOverrides() {
    return load(MENU_KEY, {});
  }

  function getMenu() {
    var ov = getOverrides();
    return RT_MENU.map(function (c) {
      var o = ov[c.slug];
      if (!o) return Object.assign({}, c);
      var m = Object.assign({}, c);
      if (o.price_from !== undefined) m.price_from = o.price_from;
      if (o.available !== undefined) m.available = o.available;
      if (o.featured !== undefined) m.featured = o.featured;
      return m;
    });
  }

  function findCake(slug) {
    var all = getMenu();
    for (var i = 0; i < all.length; i++) if (all[i].slug === slug) return all[i];
    return null;
  }

  function saveOverride(slug, patch) {
    var ov = getOverrides();
    ov[slug] = Object.assign({}, ov[slug] || {}, patch);
    save(MENU_KEY, ov);
    return push('PUT', MENU_KEY, '/admin/menu', { slug: slug, patch: patch }, { auth: true });
  }

  function getOrders() {
    return load(ORDERS_KEY, []);
  }

  /** Orders reach the kitchen: saved locally for instant UI, then posted so
   *  the dashboard shows every customer's order — not just this browser's. */
  function saveOrder(order) {
    var orders = getOrders();
    orders.unshift(order);
    save(ORDERS_KEY, orders);
    return push('POST', ORDERS_KEY, '/order', order);
  }

  function getLocalReviews() {
    return load(LOCAL_REVIEWS_KEY, []);
  }

  /** Client reviews go to the shared queue so you can approve them in the
   *  dashboard — they are NOT stuck in this browser anymore. */
  function saveLocalReview(review) {
    var list = getLocalReviews();
    review.id = Date.now();
    review.createdAt = new Date().toISOString();
    review.approved = false;
    list.unshift(review);
    save(LOCAL_REVIEWS_KEY, list);
    return push('POST', LOCAL_REVIEWS_KEY, '/review', review);
  }

  function allApprovedReviews() {
    var seeds = RT_REVIEWS.slice();
    var shared = getLocalReviews()
      .filter(function (r) { return r && r.approved; })
      .map(function (r) { return Object.assign({}, r, { location: r.location || '' }); });
    return shared.concat(seeds);
  }

  // ---------- content blocks (admin edits live in rt_content) ----------
  var CONTENT_KEY = 'rt_content';

  function defaultFor(key) {
    /* eslint-disable no-undef */
    switch (key) {
      case 'RT_ABOUT': return typeof RT_ABOUT !== 'undefined' ? RT_ABOUT : null;
      case 'RT_WHY': return typeof RT_WHY !== 'undefined' ? RT_WHY : null;
      case 'RT_HOW': return typeof RT_HOW !== 'undefined' ? RT_HOW : null;
      case 'RT_PROCESS': return typeof RT_PROCESS !== 'undefined' ? RT_PROCESS : null;
      case 'RT_GALLERY': return typeof RT_GALLERY !== 'undefined' ? RT_GALLERY : null;
      case 'RT_SPACE': return typeof RT_SPACE !== 'undefined' ? RT_SPACE : null;
      case 'RT_HERO_SLIDES': return typeof RT_HERO_SLIDES !== 'undefined' ? RT_HERO_SLIDES : null;
      default: return null;
    }
    /* eslint-enable no-undef */
  }

  function getContent(key) {
    var store = load(CONTENT_KEY, {});
    if (store[key] !== undefined) return store[key];
    return defaultFor(key);
  }

  function getAllContent() {
    var store = load(CONTENT_KEY, {});
    return {
      RT_ABOUT: store.RT_ABOUT !== undefined ? store.RT_ABOUT : defaultFor('RT_ABOUT'),
      RT_WHY: store.RT_WHY !== undefined ? store.RT_WHY : defaultFor('RT_WHY'),
      RT_HOW: store.RT_HOW !== undefined ? store.RT_HOW : defaultFor('RT_HOW'),
      RT_PROCESS: store.RT_PROCESS !== undefined ? store.RT_PROCESS : defaultFor('RT_PROCESS'),
      RT_GALLERY: store.RT_GALLERY !== undefined ? store.RT_GALLERY : defaultFor('RT_GALLERY'),
      RT_SPACE: store.RT_SPACE !== undefined ? store.RT_SPACE : defaultFor('RT_SPACE'),
      RT_HERO_SLIDES: store.RT_HERO_SLIDES !== undefined ? store.RT_HERO_SLIDES : defaultFor('RT_HERO_SLIDES'),
    };
  }

  /** Content edits are published to the shared store, so they show up for
   *  every visitor — not only in the browser that made the change. */
  function saveContent(key, value) {
    var store = load(CONTENT_KEY, {});
    store[key] = value;
    save(CONTENT_KEY, store);
    return push('PUT', CONTENT_KEY, '/admin/content', { key: key, value: value }, { auth: true });
  }

  // ---------- image resolution: admin override → photo map → svg default ----------
  var IMG_KEY = 'rt_image_overrides';

  function imgOverrides() {
    return load(IMG_KEY, {});
  }

  function imgFor(item) {
    if (!item) return '';
    var slug = typeof item === 'string' ? item : item.slug;
    var ov = imgOverrides();
    if (ov[slug]) return ov[slug];
    /* eslint-disable no-undef */
    if (typeof RT_PHOTO_MAP !== 'undefined' && RT_PHOTO_MAP[slug]) return RT_PHOTO_MAP[slug];
    /* eslint-enable no-undef */
    return typeof item === 'string' ? '' : item.image;
  }

  function saveImgOverride(slug, path) {
    var ov = imgOverrides();
    if (path) ov[slug] = path;
    else delete ov[slug];
    save(IMG_KEY, ov);
    applyImageOverrides();
    return push('PUT', IMG_KEY, '/admin/image', { slug: slug, value: path || null }, { auth: true });
  }

  function uploadImage(dataUrl, name) {
    return push('POST', IMG_KEY, '/admin/upload', { dataUrl: dataUrl, name: name }, { auth: true });
  }

  // ---------- fixed image slots (hero, gallery, story…) ----------
  // Photos baked into the HTML carry data-slot="<id>"; the Media tab can swap
  // them. The original src is remembered so a reset can put it back.
  function applyImageOverridesIn(root) {
    if (!root || root.nodeType !== 1) return;
    var ov = imgOverrides();
    var nodes = [];
    if (root.hasAttribute && root.hasAttribute('data-slot')) nodes.push(root);
    if (root.querySelectorAll) {
      var found = root.querySelectorAll('[data-slot]');
      for (var i = 0; i < found.length; i++) nodes.push(found[i]);
    }
    nodes.forEach(function (img) {
      if (img.tagName !== 'IMG') return;
      var slot = img.getAttribute('data-slot');
      if (!slot) return;
      if (!img.hasAttribute('data-orig')) img.setAttribute('data-orig', img.getAttribute('src') || '');
      var next = ov[slot];
      if (next) {
        if (img.getAttribute('data-ov') !== next) {
          img.setAttribute('data-ov', next);
          img.src = next;
        }
      } else if (img.getAttribute('data-ov')) {
        img.removeAttribute('data-ov');
        var orig = img.getAttribute('data-orig');
        if (orig) img.src = orig;
      }
    });
  }

  function applyImageOverrides() {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
    applyImageOverridesIn(document.documentElement);
  }

  function initImageSlots() {
    applyImageOverrides();
    document.addEventListener('rt:state', applyImageOverrides);
    // Slots rendered after load (carousel, gallery, space grids) get picked up.
    if ('MutationObserver' in window && document.body) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            if (added[j].nodeType === 1) applyImageOverridesIn(added[j]);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  // ---------- likes ----------
  var LIKES_KEY = 'rt_likes';

  function likeState() {
    var s = load(LIKES_KEY, { mine: {}, counts: {} });
    if (!s.mine) s.mine = {};
    if (!s.counts) s.counts = {};
    return s;
  }

  function likeCount(slug) {
    return likeState().counts[slug] || 0;
  }

  function hasLiked(slug) {
    return !!likeState().mine[slug];
  }

  function toggleLike(slug) {
    var s = likeState();
    var delta;
    if (s.mine[slug]) {
      delete s.mine[slug];
      delta = -1;
    } else {
      s.mine[slug] = true;
      delta = 1;
    }
    s.counts[slug] = Math.max(0, (s.counts[slug] || 0) + delta);
    save(LIKES_KEY, s);
    // shared count — everyone sees the same number
    push('POST', LIKES_KEY, '/like', { slug: slug, delta: delta });
    return { liked: !!s.mine[slug], count: s.counts[slug] || 0 };
  }

  // ---------- product ratings (admin approval queue) ----------
  var RATINGS_KEY = 'rt_ratings';

  function ratingState() {
    var s = load(RATINGS_KEY, { approved: {}, pending: [], mine: {} });
    if (!s.approved) s.approved = {};
    if (!s.pending) s.pending = [];
    if (!s.mine) s.mine = {};
    return s;
  }

  function ratingSummary(slug) {
    var a = ratingState().approved[slug];
    if (!a || !a.n) return { sum: 0, n: 0, avg: 0 };
    return { sum: a.sum, n: a.n, avg: Math.round((a.sum / a.n) * 10) / 10 };
  }

  function submitRating(slug, stars) {
    var s = ratingState();
    var prev = s.mine[slug];
    if (prev) {
      s.pending = s.pending.filter(function (p) { return p.slug !== slug; });
    }
    s.mine[slug] = stars;
    s.pending.unshift({ id: Date.now(), slug: slug, stars: stars, ts: new Date().toISOString() });
    save(RATINGS_KEY, s);
    // joins the shared approval queue so you can publish it from the dashboard
    push('POST', RATINGS_KEY, '/rating', { slug: slug, stars: stars });
    return true;
  }

  // ---------- post-order feedback survey ----------
  var FEEDBACK_KEY = 'rt_feedback';

  function getFeedback() {
    return load(FEEDBACK_KEY, []);
  }

  function saveFeedback(entry) {
    var list = getFeedback();
    entry.id = Date.now();
    entry.ts = new Date().toISOString();
    list.unshift(entry);
    save(FEEDBACK_KEY, list);
    push('POST', FEEDBACK_KEY, '/feedback', entry);
    return entry;
  }

  // ---------- pipeline + moderation (dashboard actions go to everyone) ----------
  function setOrderStatus(ref, status) {
    var orders = getOrders();
    var prev = null;
    orders.forEach(function (o) { if (o && o.ref === ref) { prev = o.status; o.status = status; o.updatedAt = new Date().toISOString(); } });
    save(ORDERS_KEY, orders);
    push('PATCH', ORDERS_KEY, '/admin/orders', { ref: ref, status: status }, { auth: true });
    return prev;
  }

  function setReviewApproved(id, approved) {
    var list = getLocalReviews();
    list.forEach(function (r) { if (r && r.id === id) r.approved = approved; });
    save(LOCAL_REVIEWS_KEY, list);
    push('PATCH', LOCAL_REVIEWS_KEY, '/admin/reviews', { id: id, approved: approved }, { auth: true });
  }

  function setRatingAction(id, action) {
    var s = ratingState();
    var entry = null;
    s.pending = s.pending.filter(function (p) {
      if (p && p.id === id) { entry = p; return false; }
      return true;
    });
    if (entry && action === 'approve') {
      var cur = s.approved[entry.slug] || { sum: 0, n: 0 };
      s.approved[entry.slug] = { sum: cur.sum + entry.stars, n: cur.n + 1 };
    }
    save(RATINGS_KEY, s);
    push('PATCH', RATINGS_KEY, '/admin/ratings', { id: id, action: action }, { auth: true });
    return entry;
  }

  /** Undo of an approval — decrements the published average on the server. */
  function unapproveRating(slug, stars) {
    push('PATCH', RATINGS_KEY, '/admin/ratings', { action: 'unapprove', slug: slug, stars: stars }, { auth: true });
  }

  /** Clear every published rating for one item. */
  function resetRatings(slug) {
    push('PATCH', RATINGS_KEY, '/admin/ratings', { action: 'reset', slug: slug }, { auth: true });
  }

  /** Undo of a reset — puts the exact published average back. */
  function restoreRatings(slug, sum, n) {
    push('PATCH', RATINGS_KEY, '/admin/ratings', { action: 'restore', slug: slug, sum: sum, n: n }, { auth: true });
  }

  /** Put a rating back in the queue (undo of a rejection). Local state is the
   *  caller's job — this only mirrors it to the server. */
  function requeueRating(entry) {
    if (!entry) return;
    push('POST', RATINGS_KEY, '/rating', { id: entry.id, slug: entry.slug, stars: entry.stars, ts: entry.ts });
  }

  // ---------- header / nav ----------
  var WA_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.2 3.7.59.26 1.05.41 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z"/></svg>';

  function initHeader() {
    var header = $('#siteHeader');
    var toggle = $('#navToggle');
    var links = $('#navLinks');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('scrolled', window.scrollY > 40);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.textContent = open ? '✕' : '☰';
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      $$('a', links).forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          toggle.textContent = '☰';
        });
      });
    }

    // active link
    var page = document.body.getAttribute('data-page') || '';
    $$('#navLinks a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if ((page === 'home' && href === 'index.html') || (page && href === page + '.html')) {
        a.classList.add('active');
      }
    });

    // default whatsapp links
    $$('[data-wa-default]').forEach(function (a) {
      a.href = waLink('Hello Relish Torte! I would like to place an order.');
    });
    var float = $('.wa-float');
    if (float) float.href = waLink('Hello Relish Torte! I would like to place an order.');

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    // newsletter — saved locally AND sent to the kitchen on WhatsApp
    var news = document.querySelector('.newsletter');
    if (news) {
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = news.querySelector('input');
        var note = document.querySelector('.news-note');
        var v = input && input.value.trim();
        if (!v || v.indexOf('@') === -1) {
          if (note) note.textContent = 'Please enter a valid email address.';
          return;
        }
        var list = load('rt_newsletter', []);
        if (list.indexOf(v) === -1) list.push(v);
        save('rt_newsletter', list);
        window.open(waLink('Hello Relish Torte! Please add me to the newsletter: ' + v), '_blank', 'noopener');
        input.value = '';
        if (note) note.textContent = "You're on the list — subscription sent to the kitchen on WhatsApp.";
      });
    }
  }

  // ---------- rendering ----------
  function starsHtml(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += i <= rating ? '★' : '<span class="off">★</span>';
    }
    return out;
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  function cakeCardHtml(c, extraClass) {
    var priceHtml =
      c.price_from === null
        ? '<span class="price"><small>price</small>Custom quote</span>'
        : '<span class="price"><small>from</small>' + naira(c.price_from) + '</span>';
    var tag = c.featured ? 'Bestseller' : RT_CATEGORIES[c.category];
    var src = imgFor(c);
    var liked = hasLiked(c.slug);
    var lc = likeCount(c.slug);
    var rs = ratingSummary(c.slug);
    var likeBtn =
      '<button class="like-btn' + (liked ? ' liked' : '') + '" type="button" data-like="' + esc(c.slug) +
      '" aria-label="Like ' + esc(c.name) + '" aria-pressed="' + (liked ? 'true' : 'false') + '">' +
      '<svg viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>' +
      (lc ? '<span data-like-count>' + lc + '</span>' : '') +
      '</button>';
    var rateRow = rs.n
      ? '<span class="rating-summary" title="' + rs.avg + ' out of 5 from ' + rs.n + ' rating' + (rs.n === 1 ? '' : 's') + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>' +
        '<span class="avg">' + rs.avg + '</span><span>(' + rs.n + ')</span></span>'
      : '';
    return (
      '<a class="cake-card' + (extraClass ? ' ' + extraClass : '') + (c.available ? '' : ' off') +
      '" href="cake.html?item=' + encodeURIComponent(c.slug) + '" data-item="' + esc(c.slug) + '">' +
      '<div class="cake-card-img">' +
      '<img src="' + esc(src) + '" onerror="this.onerror=null;this.src=\'' + esc(c.image) + '\'" alt="' + esc(c.name) + ' — Relish Torte Jos" width="600" height="600" loading="lazy">' +
      likeBtn +
      '<span class="cake-card-tag">' + esc(tag) + '</span>' +
      '</div>' +
      '<div class="cake-card-body">' +
      '<h3>' + esc(c.name) + '</h3>' +
      '<p class="desc">' + esc(c.description) + '</p>' +
      (rateRow ? '<div class="rate-row">' + rateRow + '</div>' : '') +
      '<div class="cake-card-foot">' + priceHtml +
      '<span class="pill-order">Order</span>' +
      '</div></div></a>'
    );
  }

  function reviewCardHtml(r) {
    return (
      '<figure class="review-card card">' +
      '<div class="review-avatar" aria-hidden="true">' + esc(initials(r.name)) + '</div>' +
      '<figcaption>' +
      '<p class="review-name">' + esc(r.name) + '</p>' +
      '<p class="review-role">' + esc(r.location || 'Jos') + (r.createdAt ? ' · ' + prettyDate(r.createdAt) : '') + '</p>' +
      '</figcaption>' +
      '<div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + starsHtml(r.rating) + '</div>' +
      '<blockquote class="review-quote">' + esc(r.text) + '</blockquote>' +
      '</figure>'
    );
  }

  function reviewStats(list) {
    var total = list.length;
    var sum = 0;
    var dist = [0, 0, 0, 0, 0];
    list.forEach(function (r) {
      var v = Math.min(5, Math.max(1, Number(r.rating) || 0));
      sum += v;
      dist[v - 1]++;
    });
    return {
      total: total,
      avg: total ? Math.round((sum / total) * 10) / 10 : 0,
      five: total ? Math.round((dist[4] / total) * 100) : 0,
      dist: dist,
    };
  }

  function ratingBoardHtml(list) {
    var s = reviewStats(list);
    if (!s.total) return '';
    var rows = [5, 4, 3, 2, 1]
      .map(function (v) {
        var n = s.dist[v - 1];
        var pct = Math.round((n / s.total) * 100);
        return (
          '<div class="rb-row">' +
          '<span class="rb-star">' + v + ' ★</span>' +
          '<span class="rb-bar"><i style="width:' + pct + '%"></i></span>' +
          '<span class="rb-n">' + n + '</span>' +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="rating-board">' +
      '<div class="rb-score">' +
      '<strong>' + s.avg.toFixed(1) + '</strong>' +
      '<div class="stars">' + starsHtml(Math.round(s.avg)) + '</div>' +
      '<span class="rb-count">' + s.total + ' review' + (s.total === 1 ? '' : 's') + ' · ' + s.five + '% rated 5 stars</span>' +
      '</div>' +
      '<div class="rb-dist">' + rows + '</div>' +
      '</div>'
    );
  }

  function renderReviewsInto(el, list) {
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(reviewCardHtml).join('')
      : '<p class="muted">No reviews to show yet.</p>';
  }

  // ---------- order text builder ----------
  function buildOrderMessage(o) {
    var lines = ['Hello Relish Torte! I would like to place an order:', '• Name: ' + o.name, '• Phone: ' + o.phone];
    if (o.email) lines.push('• Email: ' + o.email);
    lines.push('• Item: ' + (o.item || o.type));
    if (o.size) lines.push('• Size: ' + o.size);
    if (o.flavor) lines.push('• Flavour: ' + o.flavor);
    lines.push('• Quantity: ' + o.qty);
    if (o.inscription) lines.push('• Inscription: "' + o.inscription + '"');
    lines.push('• Needed by: ' + o.neededDate);
    lines.push('• ' + o.delivery + (o.delivery === 'Delivery' && o.area ? ' — ' + o.area + ', ' + o.address : ''));
    if (o.notes) lines.push('• Notes: ' + o.notes);
    if (o.ref) lines.push('Order ref: ' + o.ref);
    return lines.join('\n');
  }

  function makeRef() {
    return 'RT-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  // ---------- shared error helper ----------
  function setFieldError(input, msg) {
    var field = input.closest('.field') || input.parentElement;
    if (!field) return;
    var old = field.querySelector('.field-error');
    if (old) old.remove();
    if (msg) {
      var p = document.createElement('p');
      p.className = 'field-error';
      p.textContent = msg;
      field.appendChild(p);
    }
  }

  // ---------- admin secret access (triple-click brand) ----------
  var ADMIN_CREDS_KEY = 'rt_admin_creds';
  var DEFAULT_CREDS = { email: 'admin@gmail.com', password: '1234' };

  function getAdminCreds() {
    var c = load(ADMIN_CREDS_KEY, null);
    if (!c || !c.email || !c.password) return { email: DEFAULT_CREDS.email, password: DEFAULT_CREDS.password };
    return c;
  }

  function checkAdminCreds(email, password) {
    var c = getAdminCreds();
    return String(email).trim().toLowerCase() === String(c.email).trim().toLowerCase()
      && String(password) === String(c.password);
  }

  function saveAdminCreds(email, password) {
    return save(ADMIN_CREDS_KEY, {
      email: String(email).trim().toLowerCase(),
      password: String(password),
    });
  }

  function adminUnlocked() {
    try { return sessionStorage.getItem('rt_admin') === '1'; } catch (e) { return false; }
  }

  function adminUnlock() {
    try { sessionStorage.setItem('rt_admin', '1'); } catch (e) { /* file:// may block storage */ }
  }

  function adminLock() {
    try { sessionStorage.removeItem('rt_admin'); } catch (e) { /* ignore */ }
  }

  var admModal = null;

  function buildAdminModal() {
    var wrap = document.createElement('div');
    wrap.className = 'adm-modal';
    wrap.innerHTML =
      '<div class="adm-backdrop" data-adm-close></div>' +
      '<form class="card adm-card">' +
        '<img src="images/logo-mark.svg" alt="" width="46" height="46">' +
        '<h3>Owner access</h3>' +
        '<p class="sub">Sign in to manage orders, menu &amp; reviews</p>' +
        '<div class="field"><label class="label" for="admEmail">Email</label>' +
        '<input class="input" id="admEmail" type="email" autocomplete="username" placeholder="you@gmail.com"></div>' +
        '<div class="field" style="margin-top:12px"><label class="label" for="admPass">Password</label>' +
        '<input class="input" id="admPass" type="password" autocomplete="current-password" placeholder="••••"></div>' +
        '<div class="alert err hidden" id="admErr" style="margin-top:12px"></div>' +
        '<button type="submit" class="btn btn-gold btn-block" style="margin-top:16px">Sign in</button>' +
        '<p class="login-micro" style="margin-top:14px"><a href="#" data-adm-close style="color:var(--gold)">← Back to site</a></p>' +
      '</form>';
    document.body.appendChild(wrap);
    admModal = wrap;

    wrap.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-adm-close')) closeAdminModal();
    });
    wrap.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var em = wrap.querySelector('#admEmail').value;
      var pw = wrap.querySelector('#admPass').value;
      var err = wrap.querySelector('#admErr');
      if (checkAdminCreds(em, pw)) {
        adminUnlock();
        window.location.href = 'access-control.html';
      } else {
        err.textContent = 'Wrong email or password.';
        err.classList.remove('hidden');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAdminModal();
    });
  }

  function openAdminModal() {
    if (!admModal) buildAdminModal();
    admModal.classList.add('on');
    var f = admModal.querySelector('#admEmail');
    if (f) f.focus();
  }

  function closeAdminModal() {
    if (admModal) admModal.classList.remove('on');
  }

  function initBrandSecret() {
    var brand = document.querySelector('.brand');
    if (!brand) return;
    var clicks = 0;
    var timer = null;
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      clicks++;
      clearTimeout(timer);
      if (clicks >= 3) {
        clicks = 0;
        openAdminModal();
        return;
      }
      timer = setTimeout(function () {
        if (clicks === 1) window.location.href = brand.getAttribute('href') || 'index.html';
        clicks = 0;
      }, 380);
    });
  }

  // ---------- expose ----------
  window.RT = {
    $: $,
    $$: $$,
    naira: naira,
    waLink: waLink,
    getParam: getParam,
    minOrderDate: minOrderDate,
    prettyDate: prettyDate,
    esc: esc,
    load: load,
    save: save,
    getMenu: getMenu,
    findCake: findCake,
    saveOverride: saveOverride,
    getOrders: getOrders,
    saveOrder: saveOrder,
    getLocalReviews: getLocalReviews,
    saveLocalReview: saveLocalReview,
    allApprovedReviews: allApprovedReviews,
    reviewStats: reviewStats,
    ratingBoardHtml: ratingBoardHtml,
    cakeCardHtml: cakeCardHtml,
    reviewCardHtml: reviewCardHtml,
    renderReviewsInto: renderReviewsInto,
    initials: initials,
    buildOrderMessage: buildOrderMessage,
    makeRef: makeRef,
    setFieldError: setFieldError,
    starsHtml: starsHtml,
    getContent: getContent,
    getAllContent: getAllContent,
    saveContent: saveContent,
    imgFor: imgFor,
    imgOverrides: imgOverrides,
    saveImgOverride: saveImgOverride,
    likeCount: likeCount,
    hasLiked: hasLiked,
    toggleLike: toggleLike,
    ratingSummary: ratingSummary,
    submitRating: submitRating,
    ratingState: ratingState,
    getFeedback: getFeedback,
    saveFeedback: saveFeedback,
    WA_SVG: WA_SVG,
    initHeader: initHeader,
    getAdminCreds: getAdminCreds,
    checkAdminCreds: checkAdminCreds,
    saveAdminCreds: saveAdminCreds,
    adminUnlocked: adminUnlocked,
    adminUnlock: adminUnlock,
    adminLock: adminLock,
    openAdminModal: openAdminModal,
    // shared sync layer
    ready: ready,
    loadState: loadState,
    refreshState: refreshState,
    refreshAdminState: refreshAdminState,
    synced: hasSnapshot,
    api: api,
    adminToken: adminToken,
    setAdminToken: setAdminToken,
    flushOutbox: flushOutbox,
    uploadImage: uploadImage,
    setOrderStatus: setOrderStatus,
    setReviewApproved: setReviewApproved,
    setRatingAction: setRatingAction,
    unapproveRating: unapproveRating,
    resetRatings: resetRatings,
    restoreRatings: restoreRatings,
    requeueRating: requeueRating,
    lastPushError: function () { return lastPushError; },
    contentKeys: ['RT_ABOUT', 'RT_WHY', 'RT_HOW', 'RT_PROCESS', 'RT_GALLERY', 'RT_SPACE', 'RT_HERO_SLIDES'],
  };

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    // Service workers only run on http(s) — skip file:// preview.
    if (location.protocol !== 'https:' && location.protocol !== 'http:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline/unsupported — fine */ });
    });
  }

  function refreshState() {
    statePromise = null;
    return loadState();
  }

  /** Dashboard-only refresh: pulls the full picture (pending reviews and
   *  ratings, every order, feedback) which is never exposed publicly. */
  function refreshAdminState() {
    return api('GET', '/admin/state', null, true).then(function (data) {
      mergeServer(data);
      emit('rt:state', data);
      return data;
    });
  }

  // Pull the shared store into localStorage on boot (a returning visitor
  // already has a copy, so paint first and revalidate), then push anything
  // that failed to send while the browser was offline.
  loadState().then(function () { flushOutbox(); });
  window.addEventListener('online', function () {
    flushOutbox();
    refreshState();
  });

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initBrandSecret();
    initImageSlots();
    registerSW();
  });
})();
