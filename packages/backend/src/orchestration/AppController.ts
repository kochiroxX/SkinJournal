// ============================================================
// Orchestration層: APIルーティングとデータパイプラインの統合管理
// ============================================================

import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { CsvRepository } from '../repository/CsvRepository';
import { DataProcessor } from '../domain/DataProcessor';
import { ApiResponse, SkinEntryInput, PeriodFilter, CosmeticsMaster } from '../types';
import logger from '../utils/logger';

const DEFAULT_MASTER: CosmeticsMaster = {
  toners: [
    { id: 'sample-t1', maker: 'サンプルブランド', name: '化粧水A' },
    { id: 'sample-t2', maker: 'サンプルブランド', name: '化粧水B' },
  ],
  essences: [
    { id: 'sample-e1', maker: 'サンプルブランド', name: '美容液A' },
  ],
  lotions: [
    { id: 'sample-l1', maker: 'サンプルブランド', name: '乳液A' },
  ],
};

export class AppController {
  private router: Router;
  private repository: CsvRepository;
  private processor: DataProcessor;
  private masterPath: string;

  constructor() {
    this.router = Router();
    this.repository = new CsvRepository();
    this.processor = new DataProcessor();
    const dataDir = process.env.DATA_DIR ?? path.join(__dirname, '../../data');
    this.masterPath = path.join(dataDir, 'cosmetics_master.json');
    this.registerRoutes();
  }

  private loadMaster(): CosmeticsMaster {
    if (!fs.existsSync(this.masterPath)) return { ...DEFAULT_MASTER };
    return JSON.parse(fs.readFileSync(this.masterPath, 'utf-8')) as CosmeticsMaster;
  }

  private saveMaster(master: CosmeticsMaster): void {
    fs.writeFileSync(this.masterPath, JSON.stringify(master, null, 2), 'utf-8');
  }

  getRouter(): Router {
    return this.router;
  }

  private registerRoutes(): void {
    /** GET /api/records - 全正規化済みレコードを返す（期間フィルタ対応） */
    this.router.get('/records', async (req: Request, res: Response) => {
      try {
        const period = (req.query.period as PeriodFilter) ?? 'all';
        const rows = await this.repository.loadAllRows();
        const { normalized } = this.processor.normalize(rows);
        const filtered = this.processor.filterByPeriod(normalized, period);

        const response: ApiResponse<typeof filtered> = { success: true, data: filtered };
        res.json(response);
      } catch (error) {
        logger.error('GET /records error', error);
        res.status(500).json({ success: false, error: 'データ取得に失敗しました' });
      }
    });

    /** GET /api/datasets - 3種データセットを返す */
    this.router.get('/datasets', async (_req: Request, res: Response) => {
      try {
        const rows = await this.repository.loadAllRows();
        const { skinConditions, cosmetics, externalFactors } =
          this.processor.normalize(rows);

        const response: ApiResponse<{
          skinConditions: typeof skinConditions;
          cosmetics: typeof cosmetics;
          externalFactors: typeof externalFactors;
        }> = {
          success: true,
          data: { skinConditions, cosmetics, externalFactors },
        };
        res.json(response);
      } catch (error) {
        logger.error('GET /datasets error', error);
        res.status(500).json({ success: false, error: 'データ取得に失敗しました' });
      }
    });

    /** GET /api/latest - 最新レコードと平均スコアを返す */
    this.router.get('/latest', async (_req: Request, res: Response) => {
      try {
        const rows = await this.repository.loadAllRows();
        const { normalized } = this.processor.normalize(rows);
        const latest = normalized[normalized.length - 1] ?? null;
        const averages = this.processor.calcAverageMetrics(normalized);

        const response: ApiResponse<{ latest: typeof latest; averages: typeof averages }> = {
          success: true,
          data: { latest, averages },
        };
        res.json(response);
      } catch (error) {
        logger.error('GET /latest error', error);
        res.status(500).json({ success: false, error: 'データ取得に失敗しました' });
      }
    });

    /** POST /api/entry - 新規エントリを CSV に書き込む */
    this.router.post('/entry', async (req: Request, res: Response) => {
      try {
        const entry = req.body as SkinEntryInput;

        if (!entry.forehead || !entry.cheek || !entry.cosmetics || !entry.factors) {
          res.status(400).json({ success: false, error: '必須フィールドが不足しています' });
          return;
        }

        await this.repository.appendRow(entry);

        const response: ApiResponse<null> = { success: true };
        res.status(201).json(response);
      } catch (error) {
        logger.error('POST /entry error', error);
        res.status(500).json({ success: false, error: 'データ保存に失敗しました' });
      }
    });

    /** GET /api/export/csv - CSV ファイルをダウンロードする */
    this.router.get('/export/csv', (_req: Request, res: Response) => {
      try {
        const csvPath = this.repository.getCsvPath();
        const filename = `skin_data_${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(csvPath, { root: '/' });
        logger.info(`CSV exported: ${filename}`);
      } catch (error) {
        logger.error('GET /export/csv error', error);
        res.status(500).json({ success: false, error: 'CSV出力に失敗しました' });
      }
    });

    /** GET /api/cosmetics-master - 化粧品マスタを返す */
    this.router.get('/cosmetics-master', (_req: Request, res: Response) => {
      try {
        const master = this.loadMaster();
        const response: ApiResponse<CosmeticsMaster> = { success: true, data: master };
        res.json(response);
      } catch (error) {
        logger.error('GET /cosmetics-master error', error);
        res.status(500).json({ success: false, error: 'マスタ取得に失敗しました' });
      }
    });

    /** PUT /api/cosmetics-master - 化粧品マスタを更新する */
    this.router.put('/cosmetics-master', (req: Request, res: Response) => {
      try {
        const body = req.body as CosmeticsMaster;
        if (!Array.isArray(body.toners) || !Array.isArray(body.essences) || !Array.isArray(body.lotions)) {
          res.status(400).json({ success: false, error: 'フォーマットが不正です' });
          return;
        }
        const sanitize = (items: CosmeticsMaster['toners']) =>
          items
            .filter((item) => item && typeof item.name === 'string' && item.name.trim())
            .map((item) => ({
              id: String(item.id || ''),
              maker: String(item.maker || '').trim(),
              name: String(item.name).trim(),
            }));

        const master: CosmeticsMaster = {
          toners: sanitize(body.toners),
          essences: sanitize(body.essences),
          lotions: sanitize(body.lotions),
        };
        this.saveMaster(master);
        logger.info('Cosmetics master updated');
        const response: ApiResponse<CosmeticsMaster> = { success: true, data: master };
        res.json(response);
      } catch (error) {
        logger.error('PUT /cosmetics-master error', error);
        res.status(500).json({ success: false, error: 'マスタ保存に失敗しました' });
      }
    });
  }
}
