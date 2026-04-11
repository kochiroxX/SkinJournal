// ============================================================
// フロントエンド定数・ユーティリティ
// ============================================================

import { SkinMetrics } from './types';

/** 肌指標スケール最大値 */
export const SCALE_MAX = 100;

/** 肌指標ラベル */
export const METRIC_LABELS: Record<keyof SkinMetrics, string> = {
  tone: '肌色',
  moisture: '水分量',
  oil: '油分量',
  elasticity: '弾性力',
};

/** 肌指標カラー（グラフ・チップ用） */
export const METRIC_COLORS: Record<keyof SkinMetrics, string> = {
  tone: '#e91e63',
  moisture: '#2196f3',
  oil: '#ff9800',
  elasticity: '#4caf50',
};

// [Refactor] PBI-15: SkinMetricsInput.tsx でローカル定義されていた METRICS 配列を移動。
// MetricSliderGroup と SkinMetricsInput の両方から参照するため共有定数として管理する。
/** スライダー表示用の指標設定（ラベル + パステルカラー） */
export const METRIC_SLIDER_CONFIG: { key: keyof SkinMetrics; label: string; color: string }[] = [
  { key: 'tone',       label: '肌色',   color: '#f8bbd0' },
  { key: 'moisture',   label: '水分量', color: '#bbdefb' },
  { key: 'oil',        label: '油分量', color: '#fff9c4' },
  { key: 'elasticity', label: '弾性力', color: '#c8e6c9' },
];

// [Refactor] PBI-15: CosmeticsChart.tsx でローカル定義されていた FIELD_LABELS を移動。
// [Add] PBI-33: 下地カテゴリを追加
/** 化粧品カテゴリの表示ラベル（CosmeticsChart・CosmeticsSelector で使用） */
export const COSMETIC_FIELD_LABELS: Record<'toner' | 'essence' | 'lotion' | 'primer', string> = {
  toner:   '化粧水',
  essence: '美容液',
  lotion:  '乳液',
  primer:  '下地',
};

// [Refactor] PBI-15: FactorsChart.tsx でローカル定義されていた MODE_LABELS を移動。
/** 外部要因モードの表示ラベル（FactorsChart で使用） */
export const FACTOR_MODE_LABELS: Record<'sleep' | 'alcohol' | 'businessTrip', string> = {
  sleep:        '睡眠時間',
  alcohol:      '飲酒',
  businessTrip: '出張',
};

/** スコア値から MUI color を返す（0〜100スケール） */
export function getScoreColor(value: number): 'success' | 'warning' | 'error' {
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'error';
}
