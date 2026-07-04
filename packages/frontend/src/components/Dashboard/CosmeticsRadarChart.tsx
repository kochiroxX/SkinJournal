// ============================================================
// [Add] #47: 化粧品別レーダーチャート
// カテゴリ選択した化粧品の銘柄同士を4指標（tone/moisture/oil/elasticity）で比較
// ============================================================

import { useRef, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box } from '@mui/material';
import { NormalizedRecord, CosmeticsMaster, SkinMetrics } from '../../types';
import { METRIC_LABELS, SCALE_MAX } from '../../constants';
import EmptyStateBox from '../shared/EmptyStateBox';
import FilterToggleGroup from '../shared/FilterToggleGroup';
import ChartExportButton from '../shared/ChartExportButton';

export interface CosmeticsRadarChartProps {
  records: NormalizedRecord[];
  master: CosmeticsMaster;
}

const CATEGORY_FIELD_MAP = {
  toners:   { field: 'toner' as const,   label: '化粧水' },
  essences: { field: 'essence' as const, label: '美容液' },
  lotions:  { field: 'lotion' as const,  label: '乳液' },
  primers:  { field: 'primer' as const,  label: '下地' },
} as const;

type CategoryKey = keyof typeof CATEGORY_FIELD_MAP;

const CATEGORY_OPTIONS: Record<CategoryKey, string> = {
  toners:   '化粧水',
  essences: '美容液',
  lotions:  '乳液',
  primers:  '下地',
};

const AREA_LABELS: Record<'forehead' | 'cheek', string> = {
  forehead: 'おでこ',
  cheek:    'ほお',
};

/** 銘柄ごとの色（最大4銘柄） */
const BRAND_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

const METRIC_KEYS = Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>;

function buildRadarData(
  records: NormalizedRecord[],
  category: CategoryKey,
  area: 'forehead' | 'cheek',
): { data: Record<string, number | string>[]; brands: string[] } {
  const { field } = CATEGORY_FIELD_MAP[category];

  // 銘柄ごとにレコードをグループ化
  const grouped = new Map<string, NormalizedRecord[]>();
  for (const r of records) {
    const name = r.cosmetics[field];
    if (!name) continue;
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name)!.push(r);
  }

  // 3件未満の銘柄を除外し、使用件数の多い順に最大4銘柄を選択
  const brands = Array.from(grouped.entries())
    .filter(([, recs]) => recs.length >= 3)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 4)
    .map(([name]) => name);

  if (brands.length === 0) return { data: [], brands: [] };

  // レーダーデータを構築（指標ごとに各銘柄の平均を算出）
  const data = METRIC_KEYS.map((key) => {
    const point: Record<string, number | string> = { metric: METRIC_LABELS[key] };
    for (const brand of brands) {
      const recs = grouped.get(brand)!;
      const avg = recs.reduce((sum, r) => sum + r[area][key], 0) / recs.length;
      point[brand] = parseFloat(avg.toFixed(1));
    }
    return point;
  });

  return { data, brands };
}

export default function CosmeticsRadarChart({ records }: CosmeticsRadarChartProps) {
  const [category, setCategory] = useState<CategoryKey>('toners');
  const [area, setArea] = useState<'forehead' | 'cheek'>('forehead');
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, brands } = buildRadarData(records, category, area);

  if (data.length === 0 || brands.length === 0) {
    return (
      <>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
          <FilterToggleGroup label="カテゴリ" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <FilterToggleGroup label="部位" options={AREA_LABELS} value={area} onChange={setArea} />
        </Box>
        <EmptyStateBox message="データが不足しています（同じ化粧品を3件以上記録してください）" />
      </>
    );
  }

  return (
    <Box>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FilterToggleGroup label="カテゴリ" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <FilterToggleGroup label="部位" options={AREA_LABELS} value={area} onChange={setArea} />
        </Box>
        <ChartExportButton targetRef={chartRef} filename="skin-cosmetics-radar" />
      </Box>

      <Box ref={chartRef}>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={data} cx="50%" cy="50%">
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 13 }} />
            <PolarRadiusAxis angle={90} domain={[0, SCALE_MAX]} tickCount={6} tick={{ fontSize: 10 }} />
            {brands.map((brand, i) => (
              <Radar
                key={brand}
                name={brand.length > 16 ? `${brand.slice(0, 16)}…` : brand}
                dataKey={brand}
                stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                fill={BRAND_COLORS[i % BRAND_COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
