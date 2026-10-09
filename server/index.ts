import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { apiRouter } from './api';
import { adminRouter } from './admin-api';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET) {
  console.warn('[relish-torte] JWT_SECRET not set — using dev default. Set it in .env for production.');
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'relish-torte-api', time: new Date().toISOString() });
});

app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[relish-torte] error:', err.message);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Relish Torte API → http://localhost:${PORT}`);
});
