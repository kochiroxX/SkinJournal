// ============================================================
// [Refactor] PBI-14: 共有UIコンポーネント
// TrendChart / SkinRadarChart / CosmeticsChart / FactorsChart / DataTable の
// 5箇所で同一の「データなし」表示が重複していたため抽出。
// ============================================================

import { Box, Typography } from '@mui/material';

interface Props {
  message?: string;
  height?: number;
}

// [Refactor] デフォルトメッセージ・高さはオプション引数で上書き可能
export default function EmptyStateBox({ message = 'データがありません', height = 300 }: Props) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height={height}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
