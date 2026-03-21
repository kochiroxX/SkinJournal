// ============================================================
// Express サーバー エントリーポイント
// ============================================================

import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { AppController } from './orchestration/AppController';
import logger from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// CORS: 環境変数 CORS_ORIGIN をカンマ区切りで複数指定可
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// API Routes
const controller = new AppController();
app.use('/api', controller.getRouter());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静的ファイル配信（本番ビルド）
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// SPA フォールバック: API 以外はすべて index.html を返す
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`SkinJournal backend server running on port ${PORT} (0.0.0.0)`);
});

export default app;
