// ============================================================
// PBI-03: 肌状態 推移グラフ（部位・指標をトグルで切り替え）
// ============================================================

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { NormalizedRecord, TrendDataPoint } from '../../types';

type AreaFilter = 'forehead' | 'cheek' | 'both';

interface Props {
  records: NormalizedRecord[];
}

const COLORS = {
  tone: '#e91e63',
  moisture: '#2196f3',
  oil: '#ff9800',
  elasticity: '#4caf50',
};

const METRIC_LABELS = {
  tone: '白さ',
  moisture: '水分',
  oil: '油分',
  elasticity: '弾力',
};

function buildTrendData(records: NormalizedRecord[]): TrendDataPoint[] {
  return records.map((r) => ({
    date: new Date(r.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    foreheadTone: r.forehead.tone,
    foreheadMoisture: r.forehead.moisture,
    foreheadOil: r.forehead.oil,
    foreheadElasticity: r.forehead.elasticity,
    cheekTone: r.cheek.tone,
    cheekMoisture: r.cheek.moisture,
    cheekOil: r.cheek.oil,
    cheekElasticity: r.cheek.elasticity,
  }));
}

export default function TrendChart({ records }: Props) {
  const [area, setArea] = useState<AreaFilter>('both');
  const data = buildTrendData(records);

  const showForehead = area === 'forehead' || area === 'both';
  const showCheek = area === 'cheek' || area === 'both';

  if (data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="body2" color="text.secondary">
          表示部位:
        </Typography>
        <ToggleButtonGroup
          value={area}
          exclusive
          onChange={(_, v) => v && setArea(v)}
          size="small"
        >
          <ToggleButton value="both">両方</ToggleButton>
          <ToggleButton value="forehead">おでこ</ToggleButton>
          <ToggleButton value="cheek">ほお</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />

          {showForehead && (
            <>
              <Line
                type="monotone"
                dataKey="foreheadTone"
                name={`おでこ・${METRIC_LABELS.tone}`}
                stroke={COLORS.tone}
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="6 2"
              />
              <Line
                type="monotone"
                dataKey="foreheadMoisture"
                name={`おでこ・${METRIC_LABELS.moisture}`}
                stroke={COLORS.moisture}
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="6 2"
              />
              <Line
                type="monotone"
                dataKey="foreheadOil"
                name={`おでこ・${METRIC_LABELS.oil}`}
                stroke={COLORS.oil}
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="6 2"
              />
              <Line
                type="monotone"
                dataKey="foreheadElasticity"
                name={`おでこ・${METRIC_LABELS.elasticity}`}
                stroke={COLORS.elasticity}
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="6 2"
              />
            </>
          )}

          {showCheek && (
            <>
              <Line
                type="monotone"
                dataKey="cheekTone"
                name={`ほお・${METRIC_LABELS.tone}`}
                stroke={COLORS.tone}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cheekMoisture"
                name={`ほお・${METRIC_LABELS.moisture}`}
                stroke={COLORS.moisture}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cheekOil"
                name={`ほお・${METRIC_LABELS.oil}`}
                stroke={COLORS.oil}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cheekElasticity"
                name={`ほお・${METRIC_LABELS.elasticity}`}
                stroke={COLORS.elasticity}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
