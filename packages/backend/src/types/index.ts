// ============================================================
// 肌マネジメント・システム - 型定義
// ============================================================

/** 肌指標（1〜10スケール） */
export interface SkinMetrics {
  tone: number;       // 白さ
  moisture: number;   // 水分
  oil: number;        // 油分
  elasticity: number; // 弾力
}

/** 使用化粧品 */
export interface CosmeticsUsed {
  toner: string;    // 化粧水
  essence: string;  // 美容液
  lotion: string;   // 乳液
}

/** 外部要因・ライフログ */
export interface ExternalFactors {
  businessTrip: boolean; // 出張
  alcohol: boolean;      // 飲酒
  sleepHours: number;    // 睡眠時間
  notes: string;         // その他メモ
}

/** 肌状態データセット */
export interface SkinConditionDataset {
  id: string;
  timestamp: string;
  forehead: SkinMetrics;
  cheek: SkinMetrics;
}

/** 使用化粧品データセット */
export interface CosmeticsDataset {
  id: string;
  timestamp: string;
  cosmetics: CosmeticsUsed;
}

/** 外部要因データセット */
export interface ExternalFactorsDataset {
  id: string;
  timestamp: string;
  factors: ExternalFactors;
}

/** 正規化済み統合レコード（分析用） */
export interface NormalizedRecord {
  id: string;
  timestamp: string;
  forehead: SkinMetrics;
  cheek: SkinMetrics;
  cosmetics: CosmeticsUsed;
  factors: ExternalFactors;
}

/** Google Sheets から取得する生データの1行 */
export interface RawSheetRow {
  timestamp: string;
  foreheadTone: string;
  foreheadMoisture: string;
  foreheadOil: string;
  foreheadElasticity: string;
  cheekTone: string;
  cheekMoisture: string;
  cheekOil: string;
  cheekElasticity: string;
  toner: string;
  essence: string;
  lotion: string;
  businessTrip: string;
  alcohol: string;
  sleepHours: string;
  notes: string;
}

/** 入力フォームから送信されるデータ */
export interface SkinEntryInput {
  forehead: SkinMetrics;
  cheek: SkinMetrics;
  cosmetics: CosmeticsUsed;
  factors: ExternalFactors;
}

/** APIレスポンス共通ラッパー */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 期間フィルタ種別 */
export type PeriodFilter = 'week' | 'month' | 'all';

/** 分析種別 */
export type AnalysisType = 'trend' | 'comparison' | 'correlation';

/** 化粧品マスタ */
export interface CosmeticsMaster {
  toners: string[];
  essences: string[];
  lotions: string[];
}
