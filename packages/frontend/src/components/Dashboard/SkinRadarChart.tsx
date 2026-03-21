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
import { NormalizedRecord, RadarDataPoint } from '../../types';

interface Props {
  record: NormalizedRecord | null;
}

const METRIC_LABELS: { key: string; label: string }[] = [
  { key: 'tone', label: '白さ' },
  { key: 'moisture', label: '水分' },
  { key: 'oil', label: '油分' },
  { key: 'elasticity', label: '弾力' },
];

function buildRadarData(record: NormalizedRecord): RadarDataPoint[] {
  return METRIC_LABELS.map(({ key, label }) => ({
    metric: label,
    forehead: record.forehead[key as keyof typeof record.forehead],
    cheek: record.cheek[key as keyof typeof record.cheek],
    fullMark: 10,
  }));
}

export default function SkinRadarChart({ record }: Props) {
  if (!record) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  const data = buildRadarData(record);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        最新記録: {new Date(record.timestamp).toLocaleDateString('ja-JP')}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 14 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tickCount={6} tick={{ fontSize: 10 }} />
          <Radar
            name="おでこ"
            dataKey="forehead"
            stroke="#e91e63"
            fill="#e91e63"
            fillOpacity={0.3}
          />
          <Radar
            name="ほお"
            dataKey="cheek"
            stroke="#2196f3"
            fill="#2196f3"
            fillOpacity={0.3}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
