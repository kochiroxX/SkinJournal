// ============================================================
// PBI-11: 化粧品別 平均肌スコア比較グラフ
// [Add] PBI-35: チャート表示改善
// [Add] PBI-43: グラフ個別エクスポートボタンを追加
//   - X軸ラベルを斜め表示にして切れを防止
//   - Y軸スケールをデータの実際の範囲に合わせて動的に変更
//   - ツールチップに使用件数を表示
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Box, Paper, Typography } from '@mui/material';
import { useRef, useState } from 'react';
// [Add] PBI-43: グラフエクスポートボタン
import ChartExportButton from '../shared/ChartExportButton';
import { NormalizedRecord } from '../../types';
import { METRIC_LABELS, METRIC_COLORS, COSMETIC_FIELD_LABELS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import EmptyStateBox from '../shared/EmptyStateBox';
// [Refactor] PBI-15: FilterToggleGroup を使用（ローカルの ToggleButtonGroup 実装を置き換え）
import FilterToggleGroup from '../shared/FilterToggleGroup';

// [Add] PBI-33: 下地カテゴリを追加
type CosmeticField = 'toner' | 'essence' | 'lotion' | 'primer';
type AreaFilter = 'forehead' | 'cheek';

// [Refactor] PBI-15: FIELD_LABELS は constants.ts の COSMETIC_FIELD_LABELS に移動済み

const AREA_LABELS: Record<AreaFilter, string> = {
  forehead: 'おでこ',
  cheek: 'ほお',
};

interface ChartDataPoint {
  name: string;
  fullName: string;
  count: number;
  tone: number;
  moisture: number;
  oil: number;
  elasticity: number;
}

function buildChartData(records: NormalizedRecord[], field: CosmeticField, area: AreaFilter): ChartDataPoint[] {
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

  return Array.from(grouped.entries()).map(([fullName, values]) => ({
    // [Add] PBI-35: 表示名は短縮、元の名前は fullName で保持してツールチップに使用
    name: fullName.length > 14 ? fullName.slice(0, 14) + '…' : fullName,
    fullName,
    count: values[0].length,
    tone: parseFloat((values[0].reduce((a, b) => a + b, 0) / values[0].length).toFixed(1)),
    moisture: parseFloat((values[1].reduce((a, b) => a + b, 0) / values[1].length).toFixed(1)),
    oil: parseFloat((values[2].reduce((a, b) => a + b, 0) / values[2].length).toFixed(1)),
    elasticity: parseFloat((values[3].reduce((a, b) => a + b, 0) / values[3].length).toFixed(1)),
  }));
}

// [Add] PBI-35: 使用件数と完全名を表示するカスタムツールチップ
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartDataPoint; name: string; value: number; color: string }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <Paper elevation={3} sx={{ p: 1.5, maxWidth: 240, fontSize: 12 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {d.fullName}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        使用件数: {d.count} 回
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.name} display="flex" justifyContent="space-between" gap={2}>
          <Typography variant="caption" sx={{ color: entry.color }}>{entry.name}</Typography>
          <Typography variant="caption" fontWeight={700}>{entry.value}</Typography>
        </Box>
      ))}
    </Paper>
  );
}

interface Props {
  records: NormalizedRecord[];
}

export default function CosmeticsChart({ records }: Props) {
  const [field, setField] = useState<CosmeticField>('toner');
  const [area, setArea] = useState<AreaFilter>('forehead');
  // [Add] PBI-43: エクスポート用 ref
  const chartRef = useRef<HTMLDivElement>(null);

  const data = buildChartData(records, field, area);

  if (data.length === 0) {
    // [Refactor] PBI-14: EmptyStateBox を使用
    return <EmptyStateBox message="データが不足しています（化粧品を記録してください）" />;
  }

  // [Update] Y軸デフォルト範囲を 20-70 に設定
  const allValues = data.flatMap((d) => [d.tone, d.moisture, d.oil, d.elasticity]);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const yMin = Math.max(0, Math.min(20, Math.floor(dataMin / 10) * 10));
  const yMax = Math.max(70, Math.ceil(dataMax / 10) * 10);

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* [Refactor] PBI-15: FilterToggleGroup を使用 */}
          <FilterToggleGroup label="カテゴリ" options={COSMETIC_FIELD_LABELS} value={field} onChange={setField} />
          <FilterToggleGroup label="部位" options={AREA_LABELS} value={area} onChange={setArea} />
        </Box>
        {/* [Add] PBI-43: エクスポートボタン */}
        <ChartExportButton targetRef={chartRef} filename="skin-cosmetics" />
      </Box>

      <Box ref={chartRef}>
        <ResponsiveContainer width="100%" height={340}>
          {/* [Add] PBI-35: bottom マージンを増やして斜めラベルが収まるようにする */}
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            {/* [Add] PBI-35: X軸ラベルを-45度に傾けて切れを防止 */}
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={0} height={70} />
            {/* [Add] PBI-35: Y軸スケールを動的に変更 */}
            <YAxis domain={[yMin, yMax]} tickCount={6} tick={{ fontSize: 11 }} />
            {/* [Add] PBI-35: カスタムツールチップを使用 */}
            <Tooltip content={<CustomTooltip />} />
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
