// ============================================================
// [Refactor] PBI-14: 共有UIコンポーネント
// DataTable でローカル定義されていた ScoreChip を shared に昇格。
// 将来的にダッシュボードのサマリーカード等でも再利用できる。
// ============================================================

import { Chip } from '@mui/material';
import { getScoreColor } from '../../constants';

interface Props {
  value: number;
}

export default function ScoreChip({ value }: Props) {
  return (
    <Chip
      label={value}
      color={getScoreColor(value)}
      size="small"
      sx={{ fontWeight: 700, minWidth: 48 }}
    />
  );
}
