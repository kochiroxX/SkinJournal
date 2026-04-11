// ============================================================
// Frontend 型定義
// [Sync required] Backend の packages/backend/src/types/index.ts と同期を保つこと。
// 共有型（SkinMetrics / CosmeticsUsed / ExternalFactors / NormalizedRecord /
//   SkinEntryInput / CosmeticItem / CosmeticsMaster / ApiResponse / PeriodFilter）
// はどちらかを変更したら必ず両方を更新する。
// ============================================================

export interface SkinMetrics {
  tone: number;       // 肌色（0〜100）
  moisture: number;   // 水分量（0〜100）
  oil: number;        // 油分量（0〜100）
  elasticity: number; // 弾性力（0〜100）
}

export interface CosmeticsUsed {
  toner: string;    // 化粧水
  essence: string;  // 美容液
  lotion: string;   // 乳液
  // [Add] PBI-33: 下地カテゴリを追加
  primer: string;   // 下地
}

export interface ExternalFactors {
  businessTrip: boolean; // 出張
  alcohol: boolean;      // 飲酒
  sleepHours: number;    // 睡眠時間
  notes: string;         // その他メモ
}

export interface NormalizedRecord {
  id: string;
  timestamp: string;
  forehead: SkinMetrics;
  cheek: SkinMetrics;
  cosmetics: CosmeticsUsed;
  factors: ExternalFactors;
}

export interface SkinEntryInput {
  forehead: SkinMetrics;
  cheek: SkinMetrics;
  cosmetics: CosmeticsUsed;
  factors: ExternalFactors;
  date?: string; // ISO date (YYYY-MM-DD), 省略時はサーバー側で当日を使用
}

export interface CosmeticItem {
  id: string;
  maker: string;
  name: string;
  startDate?: string; // ISO date (YYYY-MM-DD)
  endDate?: string;   // ISO date (YYYY-MM-DD)
}

/** 今日の日付を基準にアイテムの使用状態を返す */
export function getItemStatus(item: CosmeticItem): 'active' | 'upcoming' | 'expired' {
  const today = new Date().toISOString().slice(0, 10);
  if (item.endDate && item.endDate < today) return 'expired';
  if (item.startDate && item.startDate > today) return 'upcoming';
  return 'active';
}

export interface CosmeticsMaster {
  toners: CosmeticItem[];
  essences: CosmeticItem[];
  lotions: CosmeticItem[];
  // [Add] PBI-33: 下地カテゴリを追加
  primers: CosmeticItem[];
}

/** アイテムを "メーカー / 品名" 形式にフォーマット（CSV に保存する値） */
export function formatItemValue(item: CosmeticItem): string {
  return item.maker ? `${item.maker} / ${item.name}` : item.name;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type PeriodFilter = 'week' | 'month' | 'all';
export type AnalysisType = 'trend' | 'comparison' | 'correlation';

// [Refactor] PBI-20: RadarDataPoint / TrendDataPoint は Recharts 固有の型であり
// ドメイン型とは無関係。各チャートコンポーネントのローカル型に移動した。
// （SkinRadarChart.tsx / TrendChart.tsx 内で定義）
