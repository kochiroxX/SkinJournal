// ============================================================
// 生活習慣比較レーダーチャート
// 睡眠・飲酒などのライフスタイル条件別に平均肌指標を比較する
// ============================================================

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
import { avgMetrics } from '../../utils/metrics';
import EmptyStateBox from '../shared/EmptyStateBox';

interface Props {
  records: NormalizedRecord[];
}

const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800'];

const METRIC_KEYS = ['moisture', 'oil', 'elasticity'] as const;
const METRIC_LABEL_MAP: Record<typeof METRIC_KEYS[number], string> = {
  moisture: '水分',
  oil: '油分',
  elasticity: '弾性',
};

export default function FactorsRadarChart({ records }: Props) {
  if (records.length < 5) {
    return <EmptyStateBox message="データ不足（5件以上の記録が必要）" />;
  }

  // ライフスタイル条件ごとにレコードをグループ化
  const groups = [
    { name: '睡眠7h+', recs: records.filter((r) => r.factors.sleepHours >= 7) },
    {
      name: '睡眠不足',
      recs: records.filter((r) => r.factors.sleepHours > 0 && r.factors.sleepHours < 7),
    },
    { name: '飲酒なし', recs: records.filter((r) => !r.factors.alcohol) },
    { name: '飲酒あり', recs: records.filter((r) => r.factors.alcohol) },
  ].filter((g) => g.recs.length >= 3);

  if (groups.length < 2) {
    return (
      <EmptyStateBox message="比較に必要なデータが不足しています（各条件3件以上必要）" />
    );
  }

  // レーダーデータ構築: axes = 指標, polygons = 条件グループ
  const data = METRIC_KEYS.map((key) => {
    const point: Record<string, string | number> = { metric: METRIC_LABEL_MAP[key] };
    groups.forEach((g) => {
      const fhAvg = avgMetrics(g.recs, 'forehead');
      const chAvg = avgMetrics(g.recs, 'cheek');
      point[g.name] = Math.round((fhAvg[key] + chAvg[key]) / 2);
    });
    return point;
  });

  return (
    <Box>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 60]} tick={{ fontSize: 10 }} />
          {groups.map((g, i) => (
            <Radar
              key={g.name}
              name={g.name}
              dataKey={g.name}
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
