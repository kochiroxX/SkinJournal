import { useRef } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import WorkIcon from '@mui/icons-material/Work';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  theme: CardTheme;
  size: CardSize;
}

interface Insight {
  icon: React.ReactNode;
  label: string;
  delta: number;
  usedCount: number;
}

export default function FactorsInsightCard({ records, theme, size: _size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  function calcDelta(
    positives: NormalizedRecord[],
    negatives: NormalizedRecord[],
  ): number | null {
    if (positives.length < 5 || negatives.length < 5) return null;
    const posAvg = positives.map((r) => recordHealthScore(r)).reduce((s, v) => s + v, 0) / positives.length;
    const negAvg = negatives.map((r) => recordHealthScore(r)).reduce((s, v) => s + v, 0) / negatives.length;
    return posAvg - negAvg;
  }

  const sleepGood = records.filter((r) => r.factors.sleepHours >= 7);
  const sleepBad = records.filter((r) => r.factors.sleepHours < 7 && r.factors.sleepHours > 0);
  const noAlcohol = records.filter((r) => !r.factors.alcohol);
  const withAlcohol = records.filter((r) => r.factors.alcohol);
  const noTrip = records.filter((r) => !r.factors.businessTrip);
  const withTrip = records.filter((r) => r.factors.businessTrip);

  const candidates: (Insight | null)[] = [
    (() => {
      const d = calcDelta(sleepGood, sleepBad);
      if (d === null) return null;
      return { icon: <HotelIcon sx={{ fontSize: 16 }} />, label: '睡眠7h以上', delta: d, usedCount: sleepGood.length };
    })(),
    (() => {
      const d = calcDelta(noAlcohol, withAlcohol);
      if (d === null) return null;
      return { icon: <LocalBarIcon sx={{ fontSize: 16 }} />, label: '飲酒なし', delta: d, usedCount: noAlcohol.length };
    })(),
    (() => {
      const d = calcDelta(noTrip, withTrip);
      if (d === null) return null;
      return { icon: <WorkIcon sx={{ fontSize: 16 }} />, label: '出張なし', delta: d, usedCount: noTrip.length };
    })(),
  ];

  const insights = candidates
    .filter((x): x is Insight => x !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
        <ChartExportButton targetRef={cardRef} filename="factors-insight" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          p: 3,
          border: `1px solid ${t.borderColor}`,
        }}
      >
        <Typography sx={{ fontSize: 12, color: t.subTextColor, mb: 2, textAlign: 'center' }}>
          生活習慣インサイト
        </Typography>

        {insights.length === 0 ? (
          <Box textAlign="center" py={2}>
            <Typography sx={{ fontSize: 14, color: t.subTextColor }}>
              データ不足（各条件5件以上必要）
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {insights.map((insight) => (
              <Box key={insight.label}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <Box sx={{ color: t.primaryColor }}>{insight.icon}</Box>
                    <Typography sx={{ fontSize: 13, color: t.textColor, fontWeight: 600 }}>
                      {insight.label}
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: insight.delta >= 0 ? '#4caf50' : '#f44336',
                  }}>
                    {insight.delta >= 0 ? '+' : ''}{insight.delta.toFixed(1)}点
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.abs(insight.delta) * 2)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${t.borderColor}44`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: insight.delta >= 0 ? '#4caf50' : '#f44336',
                    },
                  }}
                />
                <Typography sx={{ fontSize: 10, color: t.subTextColor, mt: 0.3 }}>
                  n={insight.usedCount}件のデータより算出
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
