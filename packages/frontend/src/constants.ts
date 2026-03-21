// ============================================================
// アプリ共通定数
// ============================================================

/** 肌指標スケール最大値 */
export const SCALE_MAX = 100;

/** 肌指標ラベル */
export const METRIC_LABELS: Record<string, string> = {
  tone: '肌色',
  moisture: '水分量',
  oil: '油分量',
  elasticity: '弾性力',
};

/** 肌指標カラー */
export const METRIC_COLORS: Record<string, string> = {
  tone: '#e91e63',
  moisture: '#2196f3',
  oil: '#ff9800',
  elasticity: '#4caf50',
};

/** スコア値から MUI color を返す（0〜100スケール） */
export function getScoreColor(value: number): 'success' | 'warning' | 'error' {
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'error';
}
