// ============================================================
// PBI-11: 化粧品別 平均肌スコア比較グラフ
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { NormalizedRecord } from '../../types';
import { SCALE_MAX, METRIC_LABELS, METRIC_COLORS } from '../../constants';

type CosmeticField = 'toner' | 'essence' | 'lotion';
type AreaFilter = 'forehead' | 'cheek';

const FIELD_LABELS: Record<CosmeticField, string> = {
  toner: '化粧水',
  essence: '美容液',
  lotion: '乳液',
};

function buildChartData(records: NormalizedRecord[], field: CosmeticField, area: AreaFilter) {
  const grouped = new Map<string, number[][]>();

  for (const r of records) {
    const name = r.cosmetics[field];
    if (!name) continue;
    if (!grouped.has(name)) grouped.set(name, [[], [], [], []]);
    const metrics = r[area];
    grouped.get(name)![0].push(metrics.tone);
    grouped.get(name)![1].push(metrics.moisture);
    grouped.get(name)![2].push(metrics.oil);
    grouped.get(name)![3].push(metrics.elasticity);
  }

  return Array.from(grouped.entries()).map(([name, values]) => ({
    name: name.length > 14 ? name.slice(0, 14) + '…' : name,
    tone: parseFloat((values[0].reduce((a, b) => a + b, 0) / values[0].length).toFixed(1)),
    moisture: parseFloat((values[1].reduce((a, b) => a + b, 0) / values[1].length).toFixed(1)),
    oil: parseFloat((values[2].reduce((a, b) => a + b, 0) / values[2].length).toFixed(1)),
    elasticity: parseFloat((values[3].reduce((a, b) => a + b, 0) / values[3].length).toFixed(1)),
  }));
}

interface Props {
  records: NormalizedRecord[];
}

export default function CosmeticsChart({ records }: Props) {
  const [field, setField] = useState<CosmeticField>('toner');
  const [area, setArea] = useState<AreaFilter>('forehead');

  const data = buildChartData(records, field, area);

  if (data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography color="text.secondary">データが不足しています（化粧品を記録してください）</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">カテゴリ:</Typography>
          <ToggleButtonGroup value={field} exclusive onChange={(_, v) => v && setField(v)} size="small">
            {(Object.entries(FIELD_LABELS) as [CosmeticField, string][]).map(([k, l]) => (
              <ToggleButton key={k} value={k}>{l}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">部位:</Typography>
          <ToggleButtonGroup value={area} exclusive onChange={(_, v) => v && setArea(v)} size="small">
            <ToggleButton value="forehead">おでこ</ToggleButton>
            <ToggleButton value="cheek">ほお</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
          <YAxis domain={[0, SCALE_MAX]} tickCount={6} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((key) => (
            <Bar key={key} dataKey={key} name={METRIC_LABELS[key]} fill={METRIC_COLORS[key]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
