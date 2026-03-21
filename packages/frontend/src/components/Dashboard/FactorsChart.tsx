// ============================================================
// PBI-12: 外部要因と肌状態の相関グラフ
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { NormalizedRecord } from '../../types';
import { SCALE_MAX, METRIC_LABELS, METRIC_COLORS } from '../../constants';

type AreaFilter = 'forehead' | 'cheek';

function avgMetrics(records: NormalizedRecord[], area: AreaFilter) {
  if (records.length === 0) return { tone: 0, moisture: 0, oil: 0, elasticity: 0 };
  const keys = ['tone', 'moisture', 'oil', 'elasticity'] as const;
  return Object.fromEntries(
    keys.map((k) => [k, parseFloat((records.reduce((s, r) => s + r[area][k], 0) / records.length).toFixed(1))])
  ) as { tone: number; moisture: number; oil: number; elasticity: number };
}

// 飲酒・出張あり/なしで平均スコアを比較
function buildBoolData(records: NormalizedRecord[], factor: 'alcohol' | 'businessTrip', area: AreaFilter) {
  const yes = records.filter((r) => r.factors[factor]);
  const no  = records.filter((r) => !r.factors[factor]);
  const label = factor === 'alcohol' ? '飲酒' : '出張';
  return [
    { name: `${label}あり (${yes.length}件)`, ...avgMetrics(yes, area) },
    { name: `${label}なし (${no.length}件)`, ...avgMetrics(no, area) },
  ];
}

// 睡眠時間を2時間ごとにグループ化してスコア平均を算出
function buildSleepData(records: NormalizedRecord[], area: AreaFilter) {
  const groups = new Map<string, NormalizedRecord[]>();
  for (const r of records) {
    const bucket = `${Math.floor(r.factors.sleepHours / 2) * 2}〜${Math.floor(r.factors.sleepHours / 2) * 2 + 2}h`;
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket)!.push(r);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([bucket, recs]) => ({ name: bucket, ...avgMetrics(recs, area) }));
}

interface Props {
  records: NormalizedRecord[];
}

type FactorMode = 'sleep' | 'alcohol' | 'businessTrip';

const MODE_LABELS: Record<FactorMode, string> = {
  sleep: '睡眠時間',
  alcohol: '飲酒',
  businessTrip: '出張',
};

export default function FactorsChart({ records }: Props) {
  const [mode, setMode] = useState<FactorMode>('sleep');
  const [area, setArea] = useState<AreaFilter>('forehead');

  const data =
    mode === 'sleep'
      ? buildSleepData(records, area)
      : buildBoolData(records, mode as 'alcohol' | 'businessTrip', area);

  if (records.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">要因:</Typography>
          <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} size="small">
            {(Object.entries(MODE_LABELS) as [FactorMode, string][]).map(([k, l]) => (
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
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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

// ScatterChart と ZAxis はバンドルに含まれるよう import しているが、
// 今後の散布図拡張時のために残しておく
void ScatterChart; void Scatter; void ZAxis;
