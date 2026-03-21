// ============================================================
// Express サーバー エントリーポイント
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AppController } from './orchestration/AppController';
import logger from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

// API Routes
const controller = new AppController();
app.use('/api', controller.getRouter());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  logger.info(`SkinJournal backend server running on port ${PORT}`);
});

export default app;
