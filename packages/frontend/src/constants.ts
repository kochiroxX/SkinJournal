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

// カードテーマ
export type CardTheme = 'minimal' | 'pop' | 'luxury' | 'pastel';
export const CARD_THEMES: Record<CardTheme, {
  label: string;
  chipColor: string;
  background: string;
  primaryColor: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  fontWeight: number;
}> = {
  minimal: {
    label: 'ミニマル', chipColor: '#F5F5F5', background: '#FFFFFF',
    primaryColor: '#424242', textColor: '#212121', subTextColor: '#757575',
    borderColor: '#E0E0E0', fontWeight: 400,
  },
  pop: {
    label: 'ポップ', chipColor: '#FF6B9D', background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%)',
    primaryColor: '#FFFFFF', textColor: '#FFFFFF', subTextColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700,
  },
  luxury: {
    label: 'ラグジュアリー', chipColor: '#1A1A2E', background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
    primaryColor: '#FFD700', textColor: '#F5F5F5', subTextColor: '#B0B0B0',
    borderColor: '#FFD700', fontWeight: 500,
  },
  pastel: {
    label: 'パステル', chipColor: '#FFB3C6', background: 'linear-gradient(135deg, #FFB3C6 0%, #C9B8FF 50%, #B8E4FF 100%)',
    primaryColor: '#6B4C93', textColor: '#4A3060', subTextColor: '#7B6B8D',
    borderColor: 'rgba(107,76,147,0.3)', fontWeight: 500,
  },
};

// カードサイズ
export type CardSize = 'square' | 'story' | 'wide';
export const CARD_SIZES: Record<CardSize, {
  label: string; icon: string; width: number; height: number; description: string;
}> = {
  square: { label: '正方形', icon: '⬛', width: 600, height: 600,  description: 'Instagram / X' },
  story:  { label: '縦長',   icon: '📱', width: 450, height: 800,  description: 'Story / TikTok' },
  wide:   { label: '横長',   icon: '🖥',  width: 800, height: 450,  description: 'X ヘッダー' },
};

// スコアランク
export const RANK_CONFIG = {
  S: { min: 90, color: '#FFD700', label: 'PERFECT' },
  A: { min: 75, color: '#C0C0C0', label: 'GREAT' },
  B: { min: 60, color: '#CD7F32', label: 'GOOD' },
  C: { min: 45, color: '#78909C', label: 'FAIR' },
  D: { min: 0,  color: '#546E7A', label: 'KEEP UP' },
} as const;

export type ScoreRank = keyof typeof RANK_CONFIG;

export const getScoreRank = (score: number): ScoreRank => {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  return 'D';
};
