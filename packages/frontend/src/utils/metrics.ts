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
 * 指標を適正範囲 [min, max] を基準に 0-100 で正規化する。
 * 上限を超えても 100 にクランプ（超過ペナルティは設けない）。
 */
function normalizeScore(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, (value - min) / (max - min) * 100));
}

/**
 * 1レコードの健康スコア（0-100）を各指標の適正範囲で算出する。
 *   tone:        20-70（高いほど良い）
 *   moisture:    30-50（低めは乾燥、高めは過剰）
 *   oil:         30-50（低めは乾燥、高めは過剰）
 *   elasticity:  30-70（高いほど良い）
 */
function recordHealthScore(r: NormalizedRecord): number {
  const score = (v: number, min: number, max: number) => normalizeScore(v, min, max);
  return (
    score(r.forehead.tone,        20, 70) + score(r.forehead.moisture, 30, 50) +
    score(r.forehead.oil,         30, 50) + score(r.forehead.elasticity, 30, 70) +
    score(r.cheek.tone,           20, 70) + score(r.cheek.moisture,   30, 50) +
    score(r.cheek.oil,            30, 50) + score(r.cheek.elasticity,  30, 70)
  ) / 8;
}

/**
 * [Add] PBI-40/41: レコード群から「日付 → 健康スコア（0-100）」を算出する。
 * 各指標は適正範囲で正規化し、同一日複数レコードは算術平均を使用する。
 */
export function buildScoreByDate(records: NormalizedRecord[]): Map<string, number> {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of records) {
    const date = r.timestamp.slice(0, 10);
    const score = recordHealthScore(r);
    const prev = acc.get(date);
    acc.set(date, prev ? { sum: prev.sum + score, count: prev.count + 1 } : { sum: score, count: 1 });
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
