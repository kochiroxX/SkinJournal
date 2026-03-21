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
}

export interface CosmeticsMaster {
  toners: string[];
  essences: string[];
  lotions: string[];
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
