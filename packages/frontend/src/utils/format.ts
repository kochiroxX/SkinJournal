// ============================================================
// [Refactor] PBI-18: ユーティリティ関数整理
// 日付フォーマット関数が TrendChart / SkinRadarChart / DataTable /
// CosmeticsMasterEditor でそれぞれ異なる実装で散在していたため集約。
// ============================================================

/** 「3月22日」形式（TrendChart の X 軸ラベルで使用） */
export function formatMonthDay(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

/** 「2025/03/22」形式（SkinRadarChart のサブタイトルで使用） */
export function formatFullDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ja-JP');
}

/** 「3月22日 09:00」形式（DataTable の日時列で使用） */
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO 日付文字列（YYYY-MM-DD）を「YYYY/MM/DD」形式に変換（CosmeticsMasterEditor で使用） */
export function formatSlashDate(iso?: string): string {
  if (!iso) return '—';
  return iso.replace(/-/g, '/');
}
