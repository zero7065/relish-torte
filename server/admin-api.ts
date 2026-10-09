import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from './db';
import {
  loginSchema,
  statusSchema,
  menuWriteSchema,
  menuPatchSchema,
  reviewPatchSchema,
  fieldErrors,
} from './schema';

export const adminRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'relish-torte-dev-secret-change-me-32chars!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@relishtorte.ng';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

interface AuthedRequest extends Request {
  adminEmail?: string;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Admin login required' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string };
    req.adminEmail = payload.email || payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

adminRouter.post('/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email and password are required' });

  const row = db.prepare('SELECT * FROM admins WHERE email = ?').get(parsed.data.email.trim()) as
    | { id: number; email: string; password_hash: string }
    | undefined;
  const ok = row && bcrypt.compareSync(parsed.data.password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ sub: String(row!.id), email: row!.email }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, email: row!.email });
});

adminRouter.use(requireAdmin);

interface OrderRow {
  id: number;
  ref: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  item: string;
  flavor: string;
  size: string;
  qty: number;
  inscription: string;
  needed_date: string;
  delivery: string;
  area: string;
  address: string;
  notes: string;
  photo: string | null;
  status: string;
  created_at: string;
}

adminRouter.get('/orders', (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all() as OrderRow[];
  res.json(rows);
});

adminRouter.patch('/orders/:id', (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true });
});

adminRouter.get('/reviews', (req, res) => {
  const pending = req.query.pending === '1';
  const rows = pending
    ? db.prepare('SELECT * FROM reviews WHERE approved = 0 ORDER BY id DESC').all()
    : db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json(rows);
});

adminRouter.patch('/reviews/:id', (req, res) => {
  const parsed = reviewPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid value' });
  const info = db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(parsed.data.approved, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Review not found' });
  res.json({ ok: true });
});

adminRouter.post('/menu', (req, res) => {
  const parsed = menuWriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the fields', fields: fieldErrors(parsed.error) });
  }
  const d = parsed.data;
  const slug =
    d.slug ||
    d.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  try {
    const flavors = d.flavors
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    const info = db
      .prepare(
        `INSERT INTO cakes (slug, name, category, description, price_from, sizes, flavors, image, available, featured, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 200)`
      )
      .run(
        slug,
        d.name,
        d.category,
        d.description,
        d.price_from,
        JSON.stringify(d.sizes.length ? d.sizes : [{ label: 'Standard', price: d.price_from }]),
        JSON.stringify(flavors),
        d.image || '/images/cake-custom.svg'
      );
    res.status(201).json({ id: info.lastInsertRowid, slug });
  } catch {
    res.status(409).json({ error: 'That slug already exists' });
  }
});

adminRouter.put('/menu/:id', (req, res) => {
  const parsed = menuPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the fields', fields: fieldErrors(parsed.error) });
  }
  const d = parsed.data;
  const sets: string[] = [];
  const params: unknown[] = [];
  if (d.name !== undefined) {
    sets.push('name = ?');
    params.push(d.name);
  }
  if (d.description !== undefined) {
    sets.push('description = ?');
    params.push(d.description);
  }
  if (d.price_from !== undefined) {
    sets.push('price_from = ?');
    params.push(d.price_from);
  }
  if (d.available !== undefined) {
    sets.push('available = ?');
    params.push(d.available);
  }
  if (d.featured !== undefined) {
    sets.push('featured = ?');
    params.push(d.featured);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id);
  const info = db.prepare(`UPDATE cakes SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  if (!info.changes) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});

adminRouter.delete('/menu/:id', (req, res) => {
  const info = db.prepare('DELETE FROM cakes WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});

adminRouter.get('/me', (req: AuthedRequest, res) => {
  res.json({ email: req.adminEmail });
});

export { JWT_SECRET, ADMIN_EMAIL };
