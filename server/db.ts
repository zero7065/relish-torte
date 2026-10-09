import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureSeed } from './seed';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = root;

const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(root, 'uploads'), { recursive: true });

export const db: Database.Database = new Database(path.join(dataDir, 'relish-torte.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS cakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    price_from INTEGER,
    sizes TEXT NOT NULL DEFAULT '[]',
    flavors TEXT NOT NULL DEFAULT '[]',
    image TEXT DEFAULT '/images/cake-custom.svg',
    available INTEGER NOT NULL DEFAULT 1,
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    type TEXT NOT NULL,
    item TEXT DEFAULT '',
    flavor TEXT DEFAULT '',
    size TEXT DEFAULT '',
    qty INTEGER NOT NULL DEFAULT 1,
    inscription TEXT DEFAULT '',
    needed_date TEXT NOT NULL,
    delivery TEXT NOT NULL,
    area TEXT DEFAULT '',
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    photo TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 5,
    text TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

ensureSeed(db);
