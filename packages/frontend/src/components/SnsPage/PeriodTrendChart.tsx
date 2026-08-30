import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';
import EmptyStateBox from '../shared/EmptyStateBox';

interface PeriodTrendChartProps {
  records: NormalizedRecord[];   // 期間フィルタ済みレコード
  period: 'weekly' | 'monthly';
  theme: CardTheme;
  size: CardSize;
}

export default function PeriodTrendChart({ records, period, theme, size: _size }: PeriodTrendChartProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(520);
  const t = CARD_THEMES[theme];

  // ResponsiveContainer は html-to-image で幅が解決されないため
  // ResizeObserver で実寸を計測して AreaChart に明示的な width を渡す
  useEffect(() => {
    if (!cardRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        // p:2 = 16px × 2 = 32px のパディングを引く
        setChartWidth(Math.max(200, e.contentRect.width - 32));
      }
    });
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);
  const primaryColor = t.primaryColor;

  // 日付ごとにグループ化してスコアを平均
  const byDate = new Map<string, number[]>();
  for (const r of records) {
    const d = r.timestamp.slice(5, 10).replace('-', '/'); // "MM/DD"
    const s = recordHealthScore(r);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(s);
  }
  const data = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));
  const avgScore =
    data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;

  if (data.length === 0) {
    return <EmptyStateBox />;
  }

  const isWeekly = period === 'weekly';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontSize: 12, color: t.subTextColor, fontWeight: 600 }}>
          スコア推移
        </Typography>
        <ChartExportButton targetRef={cardRef} filename="period-trend" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          p: 2,
          border: `1px solid ${t.borderColor}`,
        }}
      >
        <AreaChart width={chartWidth} height={240} data={data} margin={{ top: 10, right: 16, left: 0, bottom: isWeekly ? 30 : 10 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            {isWeekly ? (
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={50}
              />
            ) : (
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={4}
                height={30}
              />
            )}
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value: number) => [`${value}点`, 'スコア']}
            />
            {!isWeekly && (
              <ReferenceLine
                y={avgScore}
                stroke="#bdbdbd"
                strokeDasharray="4 4"
                label={{ value: `平均 ${avgScore}`, position: 'insideTopRight', fontSize: 10 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="score"
              stroke={primaryColor}
              strokeWidth={isWeekly ? 3 : 2}
              fill="url(#scoreGrad)"
              dot={isWeekly ? { r: 6, fill: primaryColor } : false}
              activeDot={{ r: 9 }}
            />
          </AreaChart>
      </Box>
    </Box>
  );
}
