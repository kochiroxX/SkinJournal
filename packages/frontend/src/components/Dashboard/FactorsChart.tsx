// ============================================================
// PBI-12: 外部要因と肌状態の相関グラフ
// [Add] PBI-43: グラフ個別エクスポートボタンを追加
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Box } from '@mui/material';
import { useRef, useState } from 'react';
// [Add] PBI-43: グラフエクスポートボタン
import ChartExportButton from '../shared/ChartExportButton';
import { NormalizedRecord } from '../../types';
import { SCALE_MAX, METRIC_LABELS, METRIC_COLORS, FACTOR_MODE_LABELS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import EmptyStateBox from '../shared/EmptyStateBox';
// [Refactor] PBI-15: FilterToggleGroup を使用（ローカルの ToggleButtonGroup 実装を置き換え）
import FilterToggleGroup from '../shared/FilterToggleGroup';
// [Refactor] PBI-18: avgMetrics を utils/metrics.ts に委譲
import { avgMetrics } from '../../utils/metrics';

type AreaFilter = 'forehead' | 'cheek';

// [Refactor] PBI-15: MODE_LABELS は constants.ts の FACTOR_MODE_LABELS に移動済み
// [Refactor] PBI-18: avgMetrics はローカル定義から utils/metrics.ts のものを使用するため削除

const AREA_LABELS: Record<AreaFilter, string> = {
  forehead: 'おでこ',
  cheek: 'ほお',
};

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

export default function FactorsChart({ records }: Props) {
  const [mode, setMode] = useState<FactorMode>('sleep');
  const [area, setArea] = useState<AreaFilter>('forehead');
  // [Add] PBI-43: エクスポート用 ref
  const chartRef = useRef<HTMLDivElement>(null);

  const data =
    mode === 'sleep'
      ? buildSleepData(records, area)
      : buildBoolData(records, mode as 'alcohol' | 'businessTrip', area);

  if (records.length === 0) {
    // [Refactor] PBI-14: EmptyStateBox を使用
    return <EmptyStateBox />;
  }

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* [Refactor] PBI-15: FilterToggleGroup を使用 */}
          <FilterToggleGroup label="要因" options={FACTOR_MODE_LABELS} value={mode} onChange={setMode} />
          <FilterToggleGroup label="部位" options={AREA_LABELS} value={area} onChange={setArea} />
        </Box>
        {/* [Add] PBI-43: エクスポートボタン */}
        <ChartExportButton targetRef={chartRef} filename="skin-factors" />
      </Box>

      <Box ref={chartRef}>
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
    </Box>
  );
}

