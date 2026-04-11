// ============================================================
// [Add] PBI-41: 週次ヒートマップ（X軸: 曜日 / Y軸: 週）
// 過去N週の肌スコアを曜日×週のグリッドで可視化。
// 特定の曜日ごとの傾向（週末疲れ・休日ケアなど）を把握できる。
// ============================================================

import { useRef } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { NormalizedRecord } from '../../types';
import { formatFullDate } from '../../utils/format';
import { buildScoreByDate } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  /** 表示週数（デフォルト 26週 = 約半年） */
  weeks?: number;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** スコア 0〜100 を色に変換（低→高: グレー→ピンクグラデーション） */
function scoreToColor(avg: number): string {
  if (avg >= 80) return '#ad1457';
  if (avg >= 65) return '#e91e63';
  if (avg >= 50) return '#f48fb1';
  if (avg >= 35) return '#fce4ec';
  return '#f5f5f5';
}

/** 日付文字列（YYYY-MM-DD）に対応するセルデータを構築 */
function buildWeekGrid(weeks: number): { date: string; week: number; weekday: number }[] {
  const today = new Date();
  // 今週の日曜日（今日が日曜なら今日）
  const sundayOffset = today.getDay(); // 0=日〜6=土
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - sundayOffset);

  const cells: { date: string; week: number; weekday: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(thisSunday);
      date.setDate(thisSunday.getDate() - w * 7 + d);
      // 未来の日付は含めない
      if (date > today) continue;
      cells.push({
        date: date.toISOString().slice(0, 10),
        week: weeks - 1 - w, // 0=最古, weeks-1=最新
        weekday: d,
      });
    }
  }
  return cells;
}

export default function WeeklyHeatmap({ records, weeks = 26 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  // [Refactor] buildScoreByDate に集約（複数レコード/日の算術平均を正確に計算）
  const scoreByDate = buildScoreByDate(records);

  const cells = buildWeekGrid(weeks);
  const cellSize = 18;
  const cellGap = 3;

  // 週ラベル（数週おきに表示: 最新から2週おき）
  const weekLabels: { week: number; label: string }[] = [];
  for (let w = 0; w < weeks; w++) {
    if ((weeks - 1 - w) % 4 === 0) {
      // 対応する日曜日の日付を計算
      const today = new Date();
      const sundayOffset = today.getDay();
      const thisSunday = new Date(today);
      thisSunday.setDate(today.getDate() - sundayOffset);
      const labelDate = new Date(thisSunday);
      labelDate.setDate(thisSunday.getDate() - (weeks - 1 - w) * 7);
      const m = labelDate.getMonth() + 1;
      const d = labelDate.getDate();
      weekLabels.push({ week: w, label: `${m}/${d}` });
    }
  }

  return (
    <Box>
      {/* ヘッダー：タイトル + エクスポートボタン */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          過去{weeks}週の肌記録ヒートマップ（曜日別）
        </Typography>
        <ChartExportButton targetRef={chartRef} filename="skin-weekly-heatmap" />
      </Box>

      <Box ref={chartRef} sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'inline-flex', flexDirection: 'row', gap: 0 }}>
          {/* 週ラベル列 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mr: `${cellGap}px`, pt: `${cellSize + cellGap + 4}px` }}>
            {Array.from({ length: weeks }, (_, w) => {
              const wl = weekLabels.find((l) => l.week === w);
              return (
                <Box key={w} sx={{ height: cellSize + cellGap, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary', width: 28, textAlign: 'right', pr: 0.5, whiteSpace: 'nowrap' }}>
                    {wl ? wl.label : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* 曜日ラベル + グリッド（列=曜日, 行=週） */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* 曜日ラベル行 */}
            <Box sx={{ display: 'flex', gap: `${cellGap}px`, mb: 0.5 }}>
              {WEEKDAY_LABELS.map((wl) => (
                <Box key={wl} sx={{ width: cellSize, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary' }}>{wl}</Typography>
                </Box>
              ))}
            </Box>

            {/* グリッド（行=週, 列=曜日） */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
              {Array.from({ length: weeks }, (_, w) => (
                <Box key={w} sx={{ display: 'flex', gap: `${cellGap}px` }}>
                  {Array.from({ length: 7 }, (_, d) => {
                    const cell = cells.find((c) => c.week === w && c.weekday === d);
                    if (!cell) {
                      return (
                        <Box key={d} sx={{ width: cellSize, height: cellSize, borderRadius: '3px', bgcolor: 'transparent' }} />
                      );
                    }
                    const score = scoreByDate.get(cell.date);
                    const color = score !== undefined ? scoreToColor(score) : '#eeeeee';
                    const hasRecord = score !== undefined;

                    return (
                      <Tooltip
                        key={d}
                        title={hasRecord ? `${formatFullDate(cell.date)}: 平均スコア ${score!.toFixed(1)}` : formatFullDate(cell.date)}
                        arrow
                      >
                        <Box
                          sx={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: '3px',
                            bgcolor: color,
                            border: '1px solid',
                            borderColor: hasRecord ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                            cursor: hasRecord ? 'pointer' : 'default',
                            transition: 'transform 0.1s',
                            '&:hover': hasRecord ? { transform: 'scale(1.2)' } : {},
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
        <Box display="flex" alignItems="center" gap={0.5} mt={1} ml="32px">
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>スコア低</Typography>
          {['#eeeeee', '#fce4ec', '#f48fb1', '#e91e63', '#ad1457'].map((c) => (
            <Box key={c} sx={{ width: 12, height: 12, bgcolor: c, borderRadius: '2px', border: '1px solid rgba(0,0,0,0.08)' }} />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>高</Typography>
          <Box sx={{ ml: 1, width: 12, height: 12, bgcolor: '#eeeeee', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.08)' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>記録なし</Typography>
        </Box>
      </Box>
    </Box>
  );
}
