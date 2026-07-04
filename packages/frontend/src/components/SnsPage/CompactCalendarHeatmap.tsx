import { useRef } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { NormalizedRecord } from '../../types';
import { CardTheme, CardSize, CARD_THEMES } from '../../constants';
import { buildScoreByDate } from '../../utils/metrics';
import { formatFullDate } from '../../utils/format';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  theme: CardTheme;
  size: CardSize;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function scoreToColor(score: number, theme: CardTheme): string {
  if (theme === 'luxury') {
    if (score >= 75) return '#FFD700';
    if (score >= 55) return '#B8860B';
    if (score >= 35) return '#4A3A00';
    return '#2A2A2A';
  }
  if (theme === 'minimal') {
    if (score >= 75) return '#424242';
    if (score >= 55) return '#757575';
    if (score >= 35) return '#BDBDBD';
    return '#EEEEEE';
  }
  if (score >= 75) return '#ad1457';
  if (score >= 55) return '#e91e63';
  if (score >= 35) return '#f48fb1';
  return '#fce4ec';
}

function buildDays(daysCount: number): string[] {
  const today = new Date();
  const result: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function groupByMonth(days: string[]): { month: string; dates: string[] }[] {
  const map = new Map<string, string[]>();
  for (const d of days) {
    const month = d.slice(0, 7);
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(d);
  }
  return Array.from(map.entries()).map(([month, dates]) => ({ month, dates }));
}

export default function CompactCalendarHeatmap({ records, theme, size: _size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];

  const days = buildDays(90);
  const scoreByDate = buildScoreByDate(records);
  const daysSet = new Set(days);
  const viewScores = Array.from(scoreByDate.entries()).filter(([d]) => daysSet.has(d));
  const bestDate = viewScores.length > 0 ? viewScores.reduce((a, b) => b[1] > a[1] ? b : a)[0] : null;
  const worstDate = viewScores.length > 0 ? viewScores.reduce((a, b) => b[1] < a[1] ? b : a)[0] : null;
  const months = groupByMonth(days);
  const cellSize = 18;
  const cellGap = 3;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
        <ChartExportButton targetRef={cardRef} filename="compact-calendar" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          p: 2,
          border: `1px solid ${t.borderColor}`,
          overflowX: 'auto',
        }}
      >
        <Typography sx={{ fontSize: 12, color: t.subTextColor, mb: 1.5 }}>直近3ヶ月の肌記録</Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          {months.map(({ month, dates }) => {
            const [y, m] = month.split('-');
            const monthLabel = `${parseInt(y)}年${parseInt(m)}月`;
            const firstDate = new Date(dates[0]);
            const leadingBlanks = firstDate.getDay();
            const totalCols = Math.ceil((leadingBlanks + dates.length) / 7);

            return (
              <Box key={month}>
                <Typography sx={{ fontSize: 11, color: t.subTextColor, mb: 0.5, fontWeight: 700 }}>
                  {monthLabel}
                </Typography>
                <Box display="flex" gap={0}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mr: `${cellGap}px` }}>
                    {WEEKDAY_LABELS.map((wl, i) => (
                      <Box key={wl} sx={{ height: cellSize + cellGap, display: 'flex', alignItems: 'center' }}>
                        {i % 2 === 0 && (
                          <Typography sx={{ fontSize: 9, color: t.subTextColor, width: cellSize - 4, textAlign: 'center' }}>
                            {wl}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: `${cellGap}px` }}>
                    {Array.from({ length: totalCols }, (_, col) => (
                      <Box key={col} sx={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                        {Array.from({ length: 7 }, (_, row) => {
                          const idx = col * 7 + row - leadingBlanks;
                          if (idx < 0 || idx >= dates.length) {
                            return <Box key={row} sx={{ width: cellSize, height: cellSize }} />;
                          }
                          const date = dates[idx];
                          const score = scoreByDate.get(date);
                          const bgColor = score !== undefined
                            ? scoreToColor(score, theme)
                            : theme === 'luxury' ? '#1a1a1a' : '#f0f0f0';
                          const isBest = date === bestDate;
                          const isWorst = date === worstDate;

                          return (
                            <Tooltip
                              key={row}
                              title={score !== undefined ? `${formatFullDate(date)}: ${score.toFixed(1)}` : formatFullDate(date)}
                              arrow
                            >
                              <Box
                                sx={{
                                  width: cellSize,
                                  height: cellSize,
                                  borderRadius: '3px',
                                  bgcolor: bgColor,
                                  border: `1px solid ${score !== undefined ? 'rgba(0,0,0,0.12)' : 'transparent'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  cursor: score !== undefined ? 'pointer' : 'default',
                                  transition: 'transform 0.1s',
                                  '&:hover': score !== undefined ? { transform: 'scale(1.3)' } : {},
                                }}
                              >
                                {isBest ? '👑' : isWorst ? '💧' : ''}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
