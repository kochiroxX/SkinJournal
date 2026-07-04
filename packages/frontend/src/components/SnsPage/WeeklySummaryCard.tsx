import { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import { formatMonthDay } from '../../utils/format';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  theme: CardTheme;
  size: CardSize;
}

export default function WeeklySummaryCard({ records, theme, size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  const weekRecords = records.filter((r) => {
    const d = new Date(r.timestamp);
    return d >= weekAgo && d <= now;
  });
  const prevWeekRecords = records.filter((r) => {
    const d = new Date(r.timestamp);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  if (weekRecords.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">直近7日間のデータがありません</Typography>
      </Box>
    );
  }

  const weekScores = weekRecords.map((r) => recordHealthScore(r));
  const avgScore = weekScores.reduce((s, v) => s + v, 0) / weekScores.length;

  const prevAvg = prevWeekRecords.length > 0
    ? prevWeekRecords.map((r) => recordHealthScore(r)).reduce((s, v) => s + v, 0) / prevWeekRecords.length
    : null;
  const diff = prevAvg !== null ? avgScore - prevAvg : null;

  const bestRecord = weekRecords.reduce((best, r) =>
    recordHealthScore(r) > recordHealthScore(best) ? r : best
  );
  const worstRecord = weekRecords.reduce((worst, r) =>
    recordHealthScore(r) < recordHealthScore(worst) ? r : worst
  );

  const startDateLabel = formatMonthDay(weekRecords[0].timestamp);
  const endDateLabel = formatMonthDay(weekRecords[weekRecords.length - 1].timestamp);

  const aspectRatio = size === 'story' ? '9 / 16' : size === 'wide' ? '16 / 9' : '1 / 1';

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
        <ChartExportButton targetRef={cardRef} filename="weekly-summary" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          p: 3,
          aspectRatio,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: `1px solid ${t.borderColor}`,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 11, color: t.subTextColor, fontWeight: t.fontWeight }}>
            週間サマリー
          </Typography>
          <Typography sx={{ fontSize: 13, color: t.subTextColor, mt: 0.5 }}>
            {startDateLabel} 〜 {endDateLabel}
          </Typography>
        </Box>

        <Box textAlign="center">
          <Typography sx={{ fontSize: 12, color: t.subTextColor }}>週間平均スコア</Typography>
          <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: t.primaryColor, lineHeight: 1.1 }}>
            {avgScore.toFixed(1)}
          </Typography>
          {diff !== null && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
              {diff > 2 ? (
                <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 18 }} />
              ) : diff < -2 ? (
                <TrendingDownIcon sx={{ color: '#f44336', fontSize: 18 }} />
              ) : (
                <TrendingFlatIcon sx={{ color: t.subTextColor, fontSize: 18 }} />
              )}
              <Typography sx={{
                fontSize: 13,
                fontWeight: 700,
                color: diff > 2 ? '#4caf50' : diff < -2 ? '#f44336' : t.subTextColor,
              }}>
                前週比 {diff > 0 ? '+' : ''}{diff.toFixed(1)}点
              </Typography>
            </Box>
          )}
        </Box>

        <Box display="flex" gap={2} justifyContent="space-between">
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, border: `1px solid ${t.borderColor}` }}>
            <Typography sx={{ fontSize: 10, color: t.subTextColor }}>最良日 🌟</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.textColor, mt: 0.3 }}>
              {formatMonthDay(bestRecord.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: t.primaryColor, fontWeight: 600 }}>
              {recordHealthScore(bestRecord).toFixed(1)}点
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, border: `1px solid ${t.borderColor}` }}>
            <Typography sx={{ fontSize: 10, color: t.subTextColor }}>最悪日 💧</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.textColor, mt: 0.3 }}>
              {formatMonthDay(worstRecord.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: t.primaryColor, fontWeight: 600 }}>
              {recordHealthScore(worstRecord).toFixed(1)}点
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
