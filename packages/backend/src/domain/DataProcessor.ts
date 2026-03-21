// ============================================================
// Domain層: 生データを3種データセットに正規化・クレンジング
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import {
  RawSheetRow,
  SkinConditionDataset,
  CosmeticsDataset,
  ExternalFactorsDataset,
  NormalizedRecord,
  SkinMetrics,
  PeriodFilter,
} from '../types';
import logger from '../utils/logger';

export class DataProcessor {
  /** 弾力スコアを正規化する（1〜10 → 0.0〜1.0 の範囲にクランプ） */
  private clampScore(value: number): number {
    return Math.min(10, Math.max(1, value));
  }

  /** 文字列を数値にパース（不正値は0） */
  private parseNumber(value: string): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /** "TRUE"/"FALSE" 文字列をboolean に変換 */
  private parseBoolean(value: string): boolean {
    return value.toUpperCase() === 'TRUE';
  }

  /** 生データ1行を SkinMetrics に変換 */
  private parseSkinMetrics(
    tone: string,
    moisture: string,
    oil: string,
    elasticity: string
  ): SkinMetrics {
    return {
      tone: this.clampScore(this.parseNumber(tone)),
      moisture: this.clampScore(this.parseNumber(moisture)),
      oil: this.clampScore(this.parseNumber(oil)),
      elasticity: this.clampScore(this.parseNumber(elasticity)),
    };
  }

  /**
   * 生データ行列を3種データセットと統合レコードに正規化する
   * 単一責任: この関数だけがスプレッドシートの列マッピングを知っている
   */
  normalize(rows: RawSheetRow[]): {
    skinConditions: SkinConditionDataset[];
    cosmetics: CosmeticsDataset[];
    externalFactors: ExternalFactorsDataset[];
    normalized: NormalizedRecord[];
  } {
    const skinConditions: SkinConditionDataset[] = [];
    const cosmeticsDatasets: CosmeticsDataset[] = [];
    const externalFactorsDatasets: ExternalFactorsDataset[] = [];
    const normalizedRecords: NormalizedRecord[] = [];

    for (const row of rows) {
      if (!row.timestamp) {
        logger.warn('Skipping row with empty timestamp');
        continue;
      }

      const id = uuidv4();
      const timestamp = row.timestamp;

      const forehead = this.parseSkinMetrics(
        row.foreheadTone,
        row.foreheadMoisture,
        row.foreheadOil,
        row.foreheadElasticity
      );
      const cheek = this.parseSkinMetrics(
        row.cheekTone,
        row.cheekMoisture,
        row.cheekOil,
        row.cheekElasticity
      );

      const cosmetics = {
        toner: row.toner,
        essence: row.essence,
        lotion: row.lotion,
      };

      const factors = {
        businessTrip: this.parseBoolean(row.businessTrip),
        alcohol: this.parseBoolean(row.alcohol),
        sleepHours: this.parseNumber(row.sleepHours),
        notes: row.notes,
      };

      skinConditions.push({ id, timestamp, forehead, cheek });
      cosmeticsDatasets.push({ id, timestamp, cosmetics });
      externalFactorsDatasets.push({ id, timestamp, factors });
      normalizedRecords.push({ id, timestamp, forehead, cheek, cosmetics, factors });
    }

    logger.info(`Normalized ${normalizedRecords.length} records into 3 datasets`);

    return {
      skinConditions,
      cosmetics: cosmeticsDatasets,
      externalFactors: externalFactorsDatasets,
      normalized: normalizedRecords,
    };
  }

  /** 期間フィルタを適用した正規化済みレコードを返す */
  filterByPeriod(records: NormalizedRecord[], period: PeriodFilter): NormalizedRecord[] {
    if (period === 'all') return records;

    const now = new Date();
    const cutoff = new Date(now);

    if (period === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    }

    return records.filter((r) => new Date(r.timestamp) >= cutoff);
  }

  /** 部位ごとの平均スコアを計算する */
  calcAverageMetrics(records: NormalizedRecord[]): {
    forehead: SkinMetrics;
    cheek: SkinMetrics;
  } {
    if (records.length === 0) {
      const empty: SkinMetrics = { tone: 0, moisture: 0, oil: 0, elasticity: 0 };
      return { forehead: empty, cheek: empty };
    }

    const sum = records.reduce(
      (acc, r) => ({
        forehead: {
          tone: acc.forehead.tone + r.forehead.tone,
          moisture: acc.forehead.moisture + r.forehead.moisture,
          oil: acc.forehead.oil + r.forehead.oil,
          elasticity: acc.forehead.elasticity + r.forehead.elasticity,
        },
        cheek: {
          tone: acc.cheek.tone + r.cheek.tone,
          moisture: acc.cheek.moisture + r.cheek.moisture,
          oil: acc.cheek.oil + r.cheek.oil,
          elasticity: acc.cheek.elasticity + r.cheek.elasticity,
        },
      }),
      {
        forehead: { tone: 0, moisture: 0, oil: 0, elasticity: 0 },
        cheek: { tone: 0, moisture: 0, oil: 0, elasticity: 0 },
      }
    );

    const n = records.length;
    return {
      forehead: {
        tone: sum.forehead.tone / n,
        moisture: sum.forehead.moisture / n,
        oil: sum.forehead.oil / n,
        elasticity: sum.forehead.elasticity / n,
      },
      cheek: {
        tone: sum.cheek.tone / n,
        moisture: sum.cheek.moisture / n,
        oil: sum.cheek.oil / n,
        elasticity: sum.cheek.elasticity / n,
      },
    };
  }
}
