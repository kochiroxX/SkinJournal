// ============================================================
// Frontend 型定義（Backend の types/index.ts と同期）
// ============================================================

export interface SkinMetrics {
  tone: number;
  moisture: number;
  oil: number;
  elasticity: number;
}

export interface CosmeticsUsed {
  toner: string;
  essence: string;
  lotion: string;
}

export interface ExternalFactors {
  businessTrip: boolean;
  alcohol: boolean;
  sleepHours: number;
  notes: string;
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
}

/** アイテムを "メーカー / 品名" 形式にフォーマット（CSVに保存する値） */
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

/** Recharts レーダーチャート用データ型 */
export interface RadarDataPoint {
  metric: string;
  forehead: number;
  cheek: number;
  fullMark: number;
}

/** Recharts 推移グラフ用データ型 */
export interface TrendDataPoint {
  date: string;
  foreheadTone: number;
  foreheadMoisture: number;
  foreheadOil: number;
  foreheadElasticity: number;
  cheekTone: number;
  cheekMoisture: number;
  cheekOil: number;
  cheekElasticity: number;
}
