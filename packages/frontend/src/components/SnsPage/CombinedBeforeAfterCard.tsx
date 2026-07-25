import { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import { getPrevWeekRange, getPrevMonthRange, getPastDaysRange, filterByDateRange } from '../../utils/dateRange';
import ChartExportButton from '../shared/ChartExportButton';

interface CombinedBeforeAfterCardProps {
  records: NormalizedRecord[];   // 全レコード（フィルタなし）
  theme: CardTheme;
  size: CardSize;
}

type PeriodSection = {
  label: string;
  beforeScore: number | null;
  afterScore: number | null;
  delta: number | null;
  catchcopy: string | null;
};

export default function CombinedBeforeAfterCard({
  records,
  theme,
  size: _size,
}: CombinedBeforeAfterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  const periods = [
    { ...getPrevWeekRange(), key: 'week' },
    { ...getPrevMonthRange(), key: 'month' },
    { ...getPastDaysRange(90), key: '3months' },
  ];

  const sections: PeriodSection[] = periods.map((period) => {
    const periodRecords = filterByDateRange(records, period.start, period.end);

    if (periodRecords.length < 2) {
      return {
        label: period.label,
        beforeScore: null,
        afterScore: null,
        delta: null,
        catchcopy: null,
      };
    }

    const first = periodRecords[0];
    const last = periodRecords[periodRecords.length - 1];
    const beforeScore = recordHealthScore(first);
    const afterScore = recordHealthScore(last);
    const delta = afterScore - beforeScore;
    const pct = beforeScore > 0 ? Math.round((delta / beforeScore) * 100) : 0;
    const diffDays = Math.round(
      (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const catchcopy =
      delta > 0
        ? `${diffDays}日間で${Math.abs(pct)}%改善！`
        : delta < 0
        ? `${diffDays}日間で${Math.abs(pct)}%低下`
        : `${diffDays}日間スコアを維持中！`;

    return { label: period.label, beforeScore, afterScore, delta, catchcopy };
  });

  return (
    <>
      <Box ref={cardRef} sx={{ background: t.background, borderRadius: 3, overflow: 'hidden', border: `1px solid ${t.borderColor}` }}>
        {/* ヘッダー */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${t.borderColor}` }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <SpaIcon sx={{ color: t.primaryColor, fontSize: 14 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.primaryColor }}>
              SkinJournal 肌変化レポート
            </Typography>
          </Box>
        </Box>

        {/* 3セクション */}
        {sections.map((sec, i) => (
          <Box key={i} sx={{ p: 2, borderTop: i > 0 ? `1px solid ${t.borderColor}` : undefined }}>
            <Typography sx={{ fontSize: 11, color: t.subTextColor, mb: 0.5 }}>{sec.label}</Typography>
            {sec.beforeScore === null ? (
              <Typography sx={{ fontSize: 11, color: t.subTextColor }}>
                ※ 対象期間のデータが不足しています
              </Typography>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 11, color: t.subTextColor }}>BEFORE</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 300, color: t.textColor, opacity: 0.6 }}>
                    {Math.round(sec.beforeScore)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 20, color: t.subTextColor }}>→</Typography>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 11, color: t.primaryColor, fontWeight: 700 }}>AFTER</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: t.primaryColor }}>
                    {Math.round(sec.afterScore!)}
                  </Typography>
                </Box>
                <Box flex={1} />
                <Typography sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: (sec.delta ?? 0) >= 0 ? '#388e3c' : '#c62828',
                }}>
                  {(sec.delta ?? 0) >= 0 ? '+' : ''}{Math.round(sec.delta ?? 0)}
                </Typography>
              </Box>
            )}
            {sec.catchcopy && sec.beforeScore !== null && (
              <Typography sx={{ fontSize: 10, color: t.subTextColor, mt: 0.5 }}>
                {sec.catchcopy}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      <Box display="flex" justifyContent="flex-end" mt={1}>
        <ChartExportButton targetRef={cardRef} filename="sns-before-after-combined" />
      </Box>
    </>
  );
}
