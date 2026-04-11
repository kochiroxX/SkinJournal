// ============================================================
// [Add] PBI-40: カレンダービュー（GitHub Contributions 風）
// 過去1年分の日付をグリッドで表示し、記録の有無・肌スコアを色で可視化。
// 「スキンケア継続記録」として SNS 映えを意識したデザイン。
// ============================================================

import { useRef } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { NormalizedRecord } from '../../types';
import { METRIC_LABELS } from '../../constants';
import { formatFullDate } from '../../utils/format';
import { buildScoreByDate } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/** 健康スコア 0〜100（適正範囲正規化済み）を色に変換 */
function scoreToColor(score: number): string {
  if (score >= 75) return '#ad1457';
  if (score >= 55) return '#e91e63';
  if (score >= 35) return '#f48fb1';
  if (score >= 15) return '#fce4ec';
  return '#f5f5f5';
}

/** 直近 N 日の日付配列を日曜始まりで返す */
function buildCalendarDays(days = 365): string[] {
  const today = new Date();
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default function CalendarHeatmap({ records }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  // [Refactor] buildScoreByDate に集約（複数レコード/日の算術平均を正確に計算）
  const scoreByDate = buildScoreByDate(records);

  const days = buildCalendarDays(365);
  // 最初の日曜日まで空白セルを追加
  const firstDate = new Date(days[0]);
  const leadingBlanks = firstDate.getDay(); // 0=日 〜 6=土

  // 月ラベルの位置計算（カラム番号 → 月ラベル）
  const monthPositions: { col: number; label: string }[] = [];
  let prevMonth = -1;
  days.forEach((d, i) => {
    const col = Math.floor((leadingBlanks + i) / 7);
    const month = parseInt(d.slice(5, 7), 10) - 1;
    if (month !== prevMonth) {
      monthPositions.push({ col, label: MONTH_LABELS[month] });
      prevMonth = month;
    }
  });

  const totalCols = Math.ceil((leadingBlanks + days.length) / 7);
  const cellSize = 14;
  const cellGap = 2;

  return (
    <Box>
      {/* ヘッダー：タイトル + エクスポートボタン */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          過去365日の肌記録カレンダー
        </Typography>
        <ChartExportButton targetRef={chartRef} filename="skin-calendar" />
      </Box>

      <Box ref={chartRef} sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
          {/* 月ラベル行 */}
          <Box sx={{ display: 'flex', ml: `${cellSize + cellGap + 4}px`, mb: 0.5 }}>
            {Array.from({ length: totalCols }, (_, col) => {
              const mp = monthPositions.find((m) => m.col === col);
              return (
                <Box key={col} sx={{ width: cellSize + cellGap, flexShrink: 0 }}>
                  {mp && (
                    <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {mp.label}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* 曜日ラベル + グリッド */}
          <Box sx={{ display: 'flex', gap: 0 }}>
            {/* 曜日ラベル列 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: `${cellGap}px` }}>
              {WEEKDAY_LABELS.map((wl, i) => (
                <Box key={wl} sx={{ height: cellSize + cellGap, display: 'flex', alignItems: 'center' }}>
                  {i % 2 === 0 && (
                    <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary', width: cellSize, textAlign: 'center' }}>
                      {wl}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {/* カレンダーグリッド（列=週、行=曜日） */}
            <Box sx={{ display: 'flex', gap: `${cellGap}px` }}>
              {Array.from({ length: totalCols }, (_, col) => (
                <Box key={col} sx={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                  {Array.from({ length: 7 }, (_, row) => {
                    const idx = col * 7 + row - leadingBlanks;
                    if (idx < 0 || idx >= days.length) {
                      return <Box key={row} sx={{ width: cellSize, height: cellSize, borderRadius: '2px', bgcolor: 'transparent' }} />;
                    }
                    const date = days[idx];
                    const score = scoreByDate.get(date);
                    const color = score !== undefined ? scoreToColor(score) : '#f0f0f0';
                    const hasRecord = score !== undefined;

                    return (
                      <Tooltip
                        key={row}
                        title={hasRecord ? `${formatFullDate(date)}: 健康スコア ${score!.toFixed(1)}` : formatFullDate(date)}
                        arrow
                      >
                        <Box
                          sx={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: '2px',
                            bgcolor: color,
                            border: '1px solid',
                            borderColor: hasRecord ? 'rgba(0,0,0,0.08)' : 'transparent',
                            cursor: hasRecord ? 'pointer' : 'default',
                            transition: 'transform 0.1s',
                            '&:hover': hasRecord ? { transform: 'scale(1.3)' } : {},
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* 凡例 */}
        <Box display="flex" alignItems="center" gap={0.5} mt={1} ml={`${cellSize + cellGap + 4}px`}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>スコア低</Typography>
          {['#f0f0f0', '#fce4ec', '#f48fb1', '#e91e63', '#ad1457'].map((c) => (
            <Box key={c} sx={{ width: 12, height: 12, bgcolor: c, borderRadius: '2px', border: '1px solid rgba(0,0,0,0.08)' }} />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>高</Typography>
          <Box sx={{ ml: 1, width: 12, height: 12, bgcolor: '#f0f0f0', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.12)' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>記録なし</Typography>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ fontSize: 10 }}>
        ※ スコアは {Object.values(METRIC_LABELS).join(' / ')}（おでこ・ほお）の平均値
      </Typography>
    </Box>
  );
}
