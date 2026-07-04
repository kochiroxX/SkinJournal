// ============================================================
// [Add] #47: 外部要因別レーダーチャート
// 睡眠/飲酒/出張のグループ別に4指標をレーダーチャートで比較
// ============================================================

import { useRef, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box } from '@mui/material';
import { NormalizedRecord, SkinMetrics } from '../../types';
import { METRIC_LABELS, FACTOR_MODE_LABELS, SCALE_MAX } from '../../constants';
import EmptyStateBox from '../shared/EmptyStateBox';
import FilterToggleGroup from '../shared/FilterToggleGroup';
import ChartExportButton from '../shared/ChartExportButton';

export interface FactorsRadarChartProps {
  records: NormalizedRecord[];
}

type FactorMode = 'sleep' | 'alcohol' | 'businessTrip';

const AREA_LABELS: Record<'forehead' | 'cheek', string> = {
  forehead: 'おでこ',
  cheek:    'ほお',
};

/** グループごとの色（最大3グループ） */
const GROUP_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

const METRIC_KEYS = Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>;

function buildGroupsData(
  records: NormalizedRecord[],
  mode: FactorMode,
  area: 'forehead' | 'cheek',
): { data: Record<string, number | string>[]; groups: string[] } {
  let rawGroups: { name: string; records: NormalizedRecord[] }[];

  if (mode === 'sleep') {
    rawGroups = [
      { name: '6h未満', records: records.filter((r) => r.factors.sleepHours < 6) },
      { name: '6〜8h',  records: records.filter((r) => r.factors.sleepHours >= 6 && r.factors.sleepHours < 8) },
      { name: '8h以上', records: records.filter((r) => r.factors.sleepHours >= 8) },
    ];
  } else if (mode === 'alcohol') {
    rawGroups = [
      { name: '飲酒あり', records: records.filter((r) => r.factors.alcohol) },
      { name: '飲酒なし', records: records.filter((r) => !r.factors.alcohol) },
    ];
  } else {
    rawGroups = [
      { name: '出張あり', records: records.filter((r) => r.factors.businessTrip) },
      { name: '出張なし', records: records.filter((r) => !r.factors.businessTrip) },
    ];
  }

  // 5件未満のグループをスキップ
  const validGroups = rawGroups.filter((g) => g.records.length >= 5);

  if (validGroups.length === 0) return { data: [], groups: [] };

  // レーダーデータを構築（指標ごとに各グループの平均を算出）
  const data = METRIC_KEYS.map((key) => {
    const point: Record<string, number | string> = { metric: METRIC_LABELS[key] };
    for (const g of validGroups) {
      const avg = g.records.reduce((sum, r) => sum + r[area][key], 0) / g.records.length;
      point[g.name] = parseFloat(avg.toFixed(1));
    }
    return point;
  });

  return { data, groups: validGroups.map((g) => g.name) };
}

export default function FactorsRadarChart({ records }: FactorsRadarChartProps) {
  const [mode, setMode] = useState<FactorMode>('sleep');
  const [area, setArea] = useState<'forehead' | 'cheek'>('forehead');
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, groups } = buildGroupsData(records, mode, area);

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FilterToggleGroup label="要因" options={FACTOR_MODE_LABELS} value={mode} onChange={setMode} />
          <FilterToggleGroup label="部位" options={AREA_LABELS} value={area} onChange={setArea} />
        </Box>
        <ChartExportButton targetRef={chartRef} filename="skin-factors-radar" />
      </Box>

      {data.length === 0 ? (
        <EmptyStateBox message="データが不足しています（各グループに5件以上の記録が必要です）" />
      ) : (
        <Box ref={chartRef}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={data} cx="50%" cy="50%">
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 13 }} />
              <PolarRadiusAxis angle={90} domain={[0, SCALE_MAX]} tickCount={6} tick={{ fontSize: 10 }} />
              <Tooltip />
              {groups.map((group, i) => (
                <Radar
                  key={group}
                  name={group}
                  dataKey={group}
                  stroke={GROUP_COLORS[i % GROUP_COLORS.length]}
                  fill={GROUP_COLORS[i % GROUP_COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
