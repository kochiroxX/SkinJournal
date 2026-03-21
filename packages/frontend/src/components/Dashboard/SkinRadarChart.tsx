// ============================================================
// PBI-05: 最新肌状態のレーダーチャート
// ============================================================

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { NormalizedRecord } from '../../types';
import { SCALE_MAX, METRIC_LABELS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import EmptyStateBox from '../shared/EmptyStateBox';
// [Refactor] PBI-18: 日付フォーマット関数を utils/format.ts に委譲
import { formatFullDate } from '../../utils/format';

interface Props {
  record: NormalizedRecord | null;
}

// [Refactor] PBI-20: Recharts 固有の型はここにローカル定義（types/index.ts から移動）
interface RadarDataPoint {
  metric: string;
  forehead: number;
  cheek: number;
  fullMark: number;
}

function buildRadarData(record: NormalizedRecord): RadarDataPoint[] {
  return (Object.keys(METRIC_LABELS) as Array<keyof typeof record.forehead>).map((key) => ({
    metric: METRIC_LABELS[key],
    forehead: record.forehead[key],
    cheek: record.cheek[key],
    fullMark: SCALE_MAX,
  }));
}

export default function SkinRadarChart({ record }: Props) {
  if (!record) {
    // [Refactor] PBI-14: EmptyStateBox を使用
    return <EmptyStateBox />;
  }

  const data = buildRadarData(record);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        {/* [Refactor] PBI-18: formatFullDate を使用 */}
        最新記録: {formatFullDate(record.timestamp)}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 14 }} />
          <PolarRadiusAxis angle={90} domain={[0, SCALE_MAX]} tickCount={6} tick={{ fontSize: 10 }} />
          <Radar name="おでこ" dataKey="forehead" stroke="#e91e63" fill="#e91e63" fillOpacity={0.3} />
          <Radar name="ほお" dataKey="cheek" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
