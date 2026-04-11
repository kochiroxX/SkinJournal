// ============================================================
// [Refactor] PBI-18: ユーティリティ関数整理
// avgMetrics が FactorsChart と DataTable で重複実装されていたため集約。
// groupBy はチャートデータ構築（CosmeticsChart / FactorsChart）で共通で使用。
// ============================================================

import { NormalizedRecord, SkinMetrics } from '../types';

/** area（forehead / cheek）の全指標平均を返す */
export function avgMetrics(
  records: NormalizedRecord[],
  area: 'forehead' | 'cheek'
): SkinMetrics {
  if (records.length === 0) return { tone: 0, moisture: 0, oil: 0, elasticity: 0 };
  const keys = ['tone', 'moisture', 'oil', 'elasticity'] as const;
  // [Refactor] unknown 経由でキャストする（Object.fromEntries の戻り型が {[k:string]: number} のため）
  return Object.fromEntries(
    keys.map((k) => [
      k,
      parseFloat(
        (records.reduce((s, r) => s + r[area][k], 0) / records.length).toFixed(1)
      ),
    ])
  ) as unknown as SkinMetrics;
}

/**
 * [Add] PBI-40/41: レコード群から「日付 → 平均スコア（全8指標の平均）」を正確に算出する。
 * 同一日に複数レコードがある場合、加重平均ではなく件数ベースの算術平均を使用する。
 * ※ (prev + avg) / 2 方式では3件目以降の算出結果が誤るため別途 accumulator を管理する。
 */
export function buildScoreByDate(records: NormalizedRecord[]): Map<string, number> {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of records) {
    const date = r.timestamp.slice(0, 10);
    const avg =
      (r.forehead.tone + r.forehead.moisture + r.forehead.oil + r.forehead.elasticity +
       r.cheek.tone    + r.cheek.moisture    + r.cheek.oil    + r.cheek.elasticity) / 8;
    const prev = acc.get(date);
    acc.set(date, prev ? { sum: prev.sum + avg, count: prev.count + 1 } : { sum: avg, count: 1 });
  }
  const result = new Map<string, number>();
  for (const [date, { sum, count }] of acc) {
    result.set(date, sum / count);
  }
  return result;
}

/** 配列を keyFn の戻り値でグループ化して Map を返す */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}
