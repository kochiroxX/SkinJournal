// ============================================================
// コスメ比較レーダーチャート
// カテゴリ別に使用頻度上位3製品の平均肌指標（水分・油分・弾性）を比較する
// ============================================================

import { useState } from 'react';
import { Box } from '@mui/material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NormalizedRecord } from '../../types';
import { COSMETIC_FIELD_LABELS } from '../../constants';
import { avgMetrics } from '../../utils/metrics';
import FilterToggleGroup from '../shared/FilterToggleGroup';
import EmptyStateBox from '../shared/EmptyStateBox';

type Category = 'toner' | 'essence' | 'lotion' | 'primer';

interface Props {
  records: NormalizedRecord[];
}

const COLORS = ['#e91e63', '#2196f3', '#4caf50', '#ff9800'];

const METRIC_KEYS = ['moisture', 'oil', 'elasticity'] as const;
const METRIC_LABEL_MAP: Record<typeof METRIC_KEYS[number], string> = {
  moisture: '水分',
  oil: '油分',
  elasticity: '弾性',
};

export default function CosmeticsRadarChart({ records }: Props) {
  const [category, setCategory] = useState<Category>('toner');

  // 使用頻度上位3製品を取得
  const usageCounts = new Map<string, number>();
  for (const r of records) {
    const name = r.cosmetics[category];
    if (name) usageCounts.set(name, (usageCounts.get(name) ?? 0) + 1);
  }

  const topCosmetics = Array.from(usageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  if (topCosmetics.length < 2) {
    return (
      <Box>
        <Box display="flex" justifyContent="center" mb={1}>
          <FilterToggleGroup
            label="カテゴリ"
            options={COSMETIC_FIELD_LABELS}
            value={category}
            onChange={setCategory}
          />
        </Box>
        <EmptyStateBox message="比較に必要なデータが不足しています（2種類以上の化粧品記録が必要）" />
      </Box>
    );
  }

  // レーダーデータ構築: axes = 指標, polygons = 製品
  const data = METRIC_KEYS.map((key) => {
    const point: Record<string, string | number> = { metric: METRIC_LABEL_MAP[key] };
    topCosmetics.forEach((name) => {
      const cosRecords = records.filter((r) => r.cosmetics[category] === name);
      const fhAvg = avgMetrics(cosRecords, 'forehead');
      const chAvg = avgMetrics(cosRecords, 'cheek');
      point[name] = Math.round((fhAvg[key] + chAvg[key]) / 2);
    });
    return point;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="center" mb={1}>
        <FilterToggleGroup
          label="カテゴリ"
          options={COSMETIC_FIELD_LABELS}
          value={category}
          onChange={setCategory}
        />
      </Box>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 60]} tick={{ fontSize: 10 }} />
          {topCosmetics.map((name, i) => (
            <Radar
              key={name}
              name={name.length > 14 ? name.slice(0, 14) + '…' : name}
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
