// ============================================================
// 肌マネジメント・システム - 型定義
// ============================================================

// ============================================================
// [Sync required] Frontend の packages/frontend/src/types/index.ts と同期を保つこと。
// 共有型を変更する場合は必ず両方のファイルを同時に更新する。
// ============================================================

/** 肌指標（0〜100スケール） */
export interface SkinMetrics {
  tone: number;       // 肌色
  moisture: number;   // 水分量
  oil: number;        // 油分量
  elasticity: number; // 弾性力
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
  date?: string; // ISO date (YYYY-MM-DD), 省略時はサーバー側で当日を使用
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

/** 化粧品マスタの1アイテム */
export interface CosmeticItem {
  id: string;
  maker: string;
  name: string;
  startDate?: string; // ISO date (YYYY-MM-DD)
  endDate?: string;   // ISO date (YYYY-MM-DD)
}

/** 化粧品マスタ */
export interface CosmeticsMaster {
  toners: CosmeticItem[];
  essences: CosmeticItem[];
  lotions: CosmeticItem[];
}
