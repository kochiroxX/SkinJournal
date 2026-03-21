// ============================================================
// Orchestration層: APIルーティングとデータパイプラインの統合管理
// ============================================================

import { Router, Request, Response } from 'express';
import { GSheetLoader } from '../repository/GSheetLoader';
import { DataProcessor } from '../domain/DataProcessor';
import { ApiResponse, SkinEntryInput, PeriodFilter } from '../types';
import logger from '../utils/logger';

export class AppController {
  private router: Router;
  private loader: GSheetLoader;
  private processor: DataProcessor;

  constructor() {
    this.router = Router();
    this.loader = new GSheetLoader();
    this.processor = new DataProcessor();
    this.registerRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private registerRoutes(): void {
    /** GET /api/records - 全正規化済みレコードを返す（期間フィルタ対応） */
    this.router.get('/records', async (req: Request, res: Response) => {
      try {
        const period = (req.query.period as PeriodFilter) ?? 'all';
        const rows = await this.loader.loadAllRows();
        const { normalized } = this.processor.normalize(rows);
        const filtered = this.processor.filterByPeriod(normalized, period);

        const response: ApiResponse<typeof filtered> = {
          success: true,
          data: filtered,
        };
        res.json(response);
      } catch (error) {
        logger.error('GET /records error', error);
        res.status(500).json({ success: false, error: 'データ取得に失敗しました' });
      }
    });

    /** GET /api/datasets - 3種データセットを返す */
    this.router.get('/datasets', async (_req: Request, res: Response) => {
      try {
        const rows = await this.loader.loadAllRows();
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
        const rows = await this.loader.loadAllRows();
        const { normalized } = this.processor.normalize(rows);
        const latest = normalized[normalized.length - 1] ?? null;
        const averages = this.processor.calcAverageMetrics(normalized);

        const response: ApiResponse<{ latest: typeof latest; averages: typeof averages }> =
          {
            success: true,
            data: { latest, averages },
          };
        res.json(response);
      } catch (error) {
        logger.error('GET /latest error', error);
        res.status(500).json({ success: false, error: 'データ取得に失敗しました' });
      }
    });

    /** POST /api/entry - 新規エントリをスプレッドシートに書き込む */
    this.router.post('/entry', async (req: Request, res: Response) => {
      try {
        const entry = req.body as SkinEntryInput;

        // 必須フィールドの検証
        if (!entry.forehead || !entry.cheek || !entry.cosmetics || !entry.factors) {
          res.status(400).json({ success: false, error: '必須フィールドが不足しています' });
          return;
        }

        await this.loader.appendRow(entry);

        const response: ApiResponse<null> = { success: true };
        res.status(201).json(response);
      } catch (error) {
        logger.error('POST /entry error', error);
        res.status(500).json({ success: false, error: 'データ保存に失敗しました' });
      }
    });

    /** GET /api/cosmetics-master - 化粧品マスタを返す */
    this.router.get('/cosmetics-master', (_req: Request, res: Response) => {
      try {
        // 環境変数またはデフォルト値からマスタを提供
        const master = {
          toners: (process.env.TONERS ?? '').split(',').filter(Boolean),
          essences: (process.env.ESSENCES ?? '').split(',').filter(Boolean),
          lotions: (process.env.LOTIONS ?? '').split(',').filter(Boolean),
        };

        // デフォルトサンプルデータ（環境変数未設定時）
        if (master.toners.length === 0) {
          master.toners = ['化粧水A', '化粧水B', '化粧水C'];
        }
        if (master.essences.length === 0) {
          master.essences = ['美容液A', '美容液B', '美容液C'];
        }
        if (master.lotions.length === 0) {
          master.lotions = ['乳液A', '乳液B', '乳液C'];
        }

        const response: ApiResponse<typeof master> = { success: true, data: master };
        res.json(response);
      } catch (error) {
        logger.error('GET /cosmetics-master error', error);
        res.status(500).json({ success: false, error: 'マスタ取得に失敗しました' });
      }
    });
  }
}
