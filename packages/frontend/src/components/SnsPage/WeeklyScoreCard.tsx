import { useRef } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES, RANK_CONFIG, getScoreRank } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  theme: CardTheme;
  size: CardSize;
}

const METRIC_ROWS: { label: string; area: 'forehead' | 'cheek'; key: 'tone' | 'moisture' | 'oil' | 'elasticity' }[] = [
  { label: 'おでこ 肌色',   area: 'forehead', key: 'tone' },
  { label: 'おでこ 水分量', area: 'forehead', key: 'moisture' },
  { label: 'おでこ 油分量', area: 'forehead', key: 'oil' },
  { label: 'おでこ 弾性力', area: 'forehead', key: 'elasticity' },
  { label: 'ほお 肌色',     area: 'cheek',    key: 'tone' },
  { label: 'ほお 水分量',   area: 'cheek',    key: 'moisture' },
  { label: 'ほお 油分量',   area: 'cheek',    key: 'oil' },
  { label: 'ほお 弾性力',   area: 'cheek',    key: 'elasticity' },
];

export default function WeeklyScoreCard({ records, theme, size: _size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const weekRecords = records.filter((r) => {
    const d = new Date(r.timestamp);
    return d >= weekAgo && d <= now;
  });

  if (weekRecords.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">直近7日間のデータがありません</Typography>
      </Box>
    );
  }

  const scores = weekRecords.map((r) => recordHealthScore(r));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const rank = getScoreRank(avgScore);
  const rankConfig = RANK_CONFIG[rank];

  const metricAvgs = METRIC_ROWS.map(({ label, area, key }) => {
    const avg = weekRecords.reduce((s, r) => s + r[area][key], 0) / weekRecords.length;
    return { label, avg };
  });

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
        <ChartExportButton targetRef={cardRef} filename="weekly-score" />
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
        <Box textAlign="center" mb={3}>
          <Typography sx={{ fontSize: 11, color: t.subTextColor }}>週間スコアランク</Typography>
          <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: rankConfig.color, lineHeight: 1 }}>
            {rank}
          </Typography>
          <Typography sx={{ fontSize: 13, color: rankConfig.color, fontWeight: 700, letterSpacing: 2 }}>
            {rankConfig.label}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: t.primaryColor, mt: 0.5 }}>
            {avgScore.toFixed(1)} / 100
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          {metricAvgs.map(({ label, avg }) => (
            <Box key={label}>
              <Box display="flex" justifyContent="space-between" mb={0.3}>
                <Typography sx={{ fontSize: 11, color: t.subTextColor }}>{label}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: t.textColor }}>{avg.toFixed(1)}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, avg)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: `${t.borderColor}44`,
                  '& .MuiLinearProgress-bar': { bgcolor: t.primaryColor },
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
