import { useRef, useState } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
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

type Period = '1w' | '1m' | '3m';

const PERIOD_DAYS: Record<Period, number> = { '1w': 7, '1m': 30, '3m': 90 };
const PERIOD_LABELS: Record<Period, string> = { '1w': '1週間', '1m': '1ヶ月', '3m': '3ヶ月' };

export default function BeforeAfterCard({ records, theme, size: _size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<Period>('1m');
  const t = CARD_THEMES[theme];

  if (records.length < 2) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">比較に必要なデータが不足しています</Typography>
      </Box>
    );
  }

  const days = PERIOD_DAYS[period];
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);

  const filtered = records.filter((r) => new Date(r.timestamp) >= cutoff);
  const sorted = (filtered.length >= 2 ? filtered : [...records])
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const beforeScore = recordHealthScore(first);
  const afterScore = recordHealthScore(latest);
  const delta = afterScore - beforeScore;
  const percent = beforeScore > 0 ? Math.round((delta / beforeScore) * 100) : 0;

  const firstDate = new Date(first.timestamp);
  const latestDate = new Date(latest.timestamp);
  const diffDays = Math.round((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  const metricDeltas = [
    { label: '肌色(おでこ)',   delta: latest.forehead.tone       - first.forehead.tone },
    { label: '水分量(おでこ)', delta: latest.forehead.moisture   - first.forehead.moisture },
    { label: '油分量(おでこ)', delta: latest.forehead.oil        - first.forehead.oil },
    { label: '弾性力(おでこ)', delta: latest.forehead.elasticity - first.forehead.elasticity },
    { label: '肌色(ほお)',     delta: latest.cheek.tone          - first.cheek.tone },
    { label: '水分量(ほお)',   delta: latest.cheek.moisture      - first.cheek.moisture },
    { label: '油分量(ほお)',   delta: latest.cheek.oil           - first.cheek.oil },
    { label: '弾性力(ほお)',   delta: latest.cheek.elasticity    - first.cheek.elasticity },
  ];
  const best = metricDeltas.reduce((a, b) => b.delta > a.delta ? b : a);

  const catchCopy = delta > 0
    ? `${diffDays}日間で${Math.abs(percent)}%改善！${best.label}が+${best.delta.toFixed(0)}点UP`
    : delta < 0
    ? `${diffDays}日間で変化あり。継続ケアが大切です`
    : `${diffDays}日間スコアを維持中！`;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <ToggleButtonGroup
          size="small"
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v as Period)}
        >
          {(Object.keys(PERIOD_DAYS) as Period[]).map((p) => (
            <ToggleButton key={p} value={p} sx={{ fontSize: 11, px: 1, py: 0.3 }}>
              {PERIOD_LABELS[p]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ChartExportButton targetRef={cardRef} filename="before-after" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          border: `1px solid ${t.borderColor}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, pt: 2, pb: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: t.primaryColor, fontWeight: 700 }}>
            {catchCopy}
          </Typography>
        </Box>
        <Box display="flex">
          <Box
            sx={{
              flex: 1,
              p: 2.5,
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRight: `1px solid ${t.borderColor}`,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 10, color: t.subTextColor, letterSpacing: 1, mb: 0.5 }}>BEFORE</Typography>
            <Typography sx={{ fontSize: 11, color: t.subTextColor, mb: 1 }}>
              {formatMonthDay(first.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: t.subTextColor, lineHeight: 1 }}>
              {beforeScore.toFixed(1)}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 2.5,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 10, color: t.primaryColor, letterSpacing: 1, fontWeight: 700, mb: 0.5 }}>AFTER</Typography>
            <Typography sx={{ fontSize: 11, color: t.subTextColor, mb: 1 }}>
              {formatMonthDay(latest.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: t.primaryColor, lineHeight: 1 }}>
              {afterScore.toFixed(1)}
            </Typography>
            <Typography sx={{
              fontSize: 12,
              fontWeight: 700,
              color: delta > 0 ? '#4caf50' : delta < 0 ? '#f44336' : t.subTextColor,
              mt: 0.5,
            }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}点
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
