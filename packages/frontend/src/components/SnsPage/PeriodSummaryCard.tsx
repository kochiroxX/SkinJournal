import { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES, RANK_CONFIG, getScoreRank } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import { formatMonthDay } from '../../utils/format';
import ChartExportButton from '../shared/ChartExportButton';

interface PeriodSummaryCardProps {
  records: NormalizedRecord[];      // 当期間のフィルタ済みレコード（ソート済み）
  prevRecords: NormalizedRecord[];  // 前期間のレコード（比較用）
  label: string;                    // 期間ラベル（例: "7/6(月) 〜 7/12(日)"）
  mode: 'weekly' | 'monthly';
  theme: CardTheme;
  size: CardSize;
}

export default function PeriodSummaryCard({
  records,
  prevRecords,
  label,
  mode: _mode,
  theme,
  size,
}: PeriodSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  if (records.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">対象期間のデータがありません</Typography>
      </Box>
    );
  }

  // 期間平均スコア
  const scores = records.map(r => recordHealthScore(r));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const rank = getScoreRank(avgScore);
  const rankConfig = RANK_CONFIG[rank];

  // 前期比
  const prevAvg = prevRecords.length > 0
    ? prevRecords.map(r => recordHealthScore(r)).reduce((s, v) => s + v, 0) / prevRecords.length
    : null;
  const diff = prevAvg !== null ? avgScore - prevAvg : null;

  // 最良日 / 最悪日
  const bestRecord = records.reduce((best, r) =>
    recordHealthScore(r) > recordHealthScore(best) ? r : best
  );
  const worstRecord = records.reduce((worst, r) =>
    recordHealthScore(r) < recordHealthScore(worst) ? r : worst
  );

  // 指標別平均（水分・油分・弾性）
  const metricKeys = [
    { key: 'moisture' as const, label: '水分' },
    { key: 'oil' as const, label: '油分' },
    { key: 'elasticity' as const, label: '弾性' },
  ];
  const metricAvgs = metricKeys.map(({ key, label: mLabel }) => ({
    label: mLabel,
    value: Math.round(
      records.reduce((s, r) => s + (r.forehead[key] + r.cheek[key]) / 2, 0) / records.length
    ),
  }));

  const aspectRatio = size === 'story' ? '9 / 16' : size === 'wide' ? '16 / 9' : '1 / 1';

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
        <ChartExportButton targetRef={cardRef} filename="period-summary" />
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
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー */}
        <Box>
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <SpaIcon sx={{ color: t.primaryColor, fontSize: 14 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.primaryColor }}>
              SkinJournal
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, color: t.subTextColor }}>{label}</Typography>
        </Box>

        {/* 期間平均スコア & ランク */}
        <Box textAlign="center">
          <Typography sx={{ fontSize: 11, color: t.subTextColor, mb: 0.5 }}>期間平均スコア</Typography>
          <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: rankConfig.color, lineHeight: 1.1 }}>
            {rank}
          </Typography>
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: t.primaryColor, lineHeight: 1.1 }}>
            {avgScore.toFixed(1)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: rankConfig.color, fontWeight: 600, mt: 0.3 }}>
            {rankConfig.label}
          </Typography>

          {/* 指標別平均 */}
          <Box display="flex" justifyContent="center" gap={1.5} mt={1}>
            {metricAvgs.map(({ label: mLabel, value }) => (
              <Typography key={mLabel} sx={{ fontSize: 10, color: t.subTextColor }}>
                {mLabel} {value}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* 最良日 / 最悪日 */}
        <Box display="flex" gap={1.5} justifyContent="space-between">
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1, border: `1px solid ${t.borderColor}` }}>
            <Typography sx={{ fontSize: 10, color: t.subTextColor }}>最良日</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: t.textColor, mt: 0.2 }}>
              {formatMonthDay(bestRecord.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: 10, color: t.primaryColor, fontWeight: 600 }}>
              {recordHealthScore(bestRecord).toFixed(1)}点
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1, border: `1px solid ${t.borderColor}` }}>
            <Typography sx={{ fontSize: 10, color: t.subTextColor }}>最悪日</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: t.textColor, mt: 0.2 }}>
              {formatMonthDay(worstRecord.timestamp)}
            </Typography>
            <Typography sx={{ fontSize: 10, color: t.primaryColor, fontWeight: 600 }}>
              {recordHealthScore(worstRecord).toFixed(1)}点
            </Typography>
          </Box>
        </Box>

        {/* 前期比 */}
        {diff !== null && (
          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            {diff > 2 ? (
              <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />
            ) : diff < -2 ? (
              <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16 }} />
            ) : (
              <TrendingFlatIcon sx={{ color: t.subTextColor, fontSize: 16 }} />
            )}
            <Typography sx={{
              fontSize: 12,
              fontWeight: 700,
              color: diff > 2 ? '#4caf50' : diff < -2 ? '#f44336' : t.subTextColor,
            }}>
              前期比 {diff > 0 ? '+' : ''}{diff.toFixed(1)}点
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
