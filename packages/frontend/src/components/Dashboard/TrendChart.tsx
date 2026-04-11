// ============================================================
// PBI-03: 肌状態 推移グラフ（部位・指標をトグルで切り替え）
// [Add] PBI-35: チャート表示改善
//   - X軸ラベルを斜め表示にして切れを防止
//   - Y軸スケールをデータの実際の範囲に合わせて動的に変更
//   - ツールチップに使用化粧品・ライフログ情報を追加表示
// ============================================================

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { NormalizedRecord } from '../../types';
import { METRIC_LABELS, METRIC_COLORS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import EmptyStateBox from '../shared/EmptyStateBox';
// [Refactor] PBI-15: 部位選択トグルを FilterToggleGroup に委譲
import FilterToggleGroup from '../shared/FilterToggleGroup';
// [Refactor] PBI-18: 日付フォーマット関数を utils/format.ts に委譲
import { formatMonthDay, formatDateTime } from '../../utils/format';

type AreaFilter = 'forehead' | 'cheek' | 'both';

// [Refactor] PBI-20: Recharts 固有の型はここにローカル定義（types/index.ts から移動）
interface TrendDataPoint {
  date: string;
  // フルタイムスタンプ（ツールチップの詳細表示に使用）
  timestamp: string;
  foreheadTone: number;
  foreheadMoisture: number;
  foreheadOil: number;
  foreheadElasticity: number;
  cheekTone: number;
  cheekMoisture: number;
  cheekOil: number;
  cheekElasticity: number;
  // [Add] PBI-35: ツールチップ表示用の追加情報
  toner: string;
  essence: string;
  lotion: string;
  primer: string;
  sleepHours: number;
  businessTrip: boolean;
  alcohol: boolean;
}

const AREA_OPTIONS: Record<AreaFilter, string> = {
  both: '両方',
  forehead: 'おでこ',
  cheek: 'ほお',
};

interface Props {
  records: NormalizedRecord[];
}

function buildTrendData(records: NormalizedRecord[]): TrendDataPoint[] {
  return records.map((r) => ({
    date: formatMonthDay(r.timestamp),
    timestamp: r.timestamp,
    foreheadTone: r.forehead.tone,
    foreheadMoisture: r.forehead.moisture,
    foreheadOil: r.forehead.oil,
    foreheadElasticity: r.forehead.elasticity,
    cheekTone: r.cheek.tone,
    cheekMoisture: r.cheek.moisture,
    cheekOil: r.cheek.oil,
    cheekElasticity: r.cheek.elasticity,
    // [Add] PBI-35: ツールチップ用データ
    toner: r.cosmetics.toner,
    essence: r.cosmetics.essence,
    lotion: r.cosmetics.lotion,
    primer: r.cosmetics.primer,
    sleepHours: r.factors.sleepHours,
    businessTrip: r.factors.businessTrip,
    alcohol: r.factors.alcohol,
  }));
}

// [Add] PBI-35: カスタムツールチップ（化粧品・ライフログ情報を含む）
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendDataPoint; name: string; value: number; color: string }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <Paper elevation={3} sx={{ p: 1.5, maxWidth: 280, fontSize: 12 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {formatDateTime(d.timestamp)}
      </Typography>

      {/* 指標値 */}
      <Box mb={0.5}>
        {payload.map((entry) => (
          <Box key={entry.name} display="flex" justifyContent="space-between" gap={2}>
            <Typography variant="caption" sx={{ color: entry.color }}>{entry.name}</Typography>
            <Typography variant="caption" fontWeight={700}>{entry.value}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* 使用化粧品 */}
      <Box mb={0.5}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">使用化粧品</Typography>
        {d.toner   && <Typography variant="caption" display="block">化粧水: {d.toner}</Typography>}
        {d.essence && <Typography variant="caption" display="block">美容液: {d.essence}</Typography>}
        {d.lotion  && <Typography variant="caption" display="block">乳液: {d.lotion}</Typography>}
        {d.primer  && <Typography variant="caption" display="block">下地: {d.primer}</Typography>}
        {!d.toner && !d.essence && !d.lotion && !d.primer && (
          <Typography variant="caption" color="text.disabled">記録なし</Typography>
        )}
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* ライフログ */}
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ライフログ</Typography>
      <Typography variant="caption" display="block">
        睡眠: {d.sleepHours}h
        {d.businessTrip && '　出張'}
        {d.alcohol && '　飲酒'}
      </Typography>
    </Paper>
  );
}

export default function TrendChart({ records }: Props) {
  const [area, setArea] = useState<AreaFilter>('both');
  const data = buildTrendData(records);

  if (data.length === 0) {
    // [Refactor] PBI-14: EmptyStateBox を使用
    return <EmptyStateBox />;
  }

  const showForehead = area === 'forehead' || area === 'both';
  const showCheek = area === 'cheek' || area === 'both';

  // [Add] PBI-35: Y軸を動的スケールに変更（表示データの最小・最大値から計算）
  const metricKeys = [
    ...(showForehead ? ['foreheadTone', 'foreheadMoisture', 'foreheadOil', 'foreheadElasticity'] : []),
    ...(showCheek ? ['cheekTone', 'cheekMoisture', 'cheekOil', 'cheekElasticity'] : []),
  ] as (keyof TrendDataPoint)[];

  const allValues = data.flatMap((d) => metricKeys.map((k) => d[k] as number));
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  // 上下に余白を持たせ、0〜100の範囲内に収める
  const yMin = Math.max(0, Math.floor(dataMin / 10) * 10 - 10);
  const yMax = Math.min(100, Math.ceil(dataMax / 10) * 10 + 10);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        {/* [Refactor] PBI-15: FilterToggleGroup を使用 */}
        <FilterToggleGroup
          label="表示部位"
          options={AREA_OPTIONS}
          value={area}
          onChange={setArea}
        />
      </Box>

      <ResponsiveContainer width="100%" height={340}>
        {/* [Add] PBI-35: X軸ラベルが切れないよう bottom マージンを増加 */}
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {/* [Add] PBI-35: X軸ラベルを-45度に傾けて切れを防止 */}
          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={60} />
          {/* [Add] PBI-35: Y軸スケールを動的に変更 */}
          <YAxis domain={[yMin, yMax]} tickCount={6} tick={{ fontSize: 11 }} />
          {/* [Add] PBI-35: カスタムツールチ��プを使用 */}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 8 }} />

          {showForehead && (
            <>
              <Line type="monotone" dataKey="foreheadTone" name={`おでこ・${METRIC_LABELS.tone}`} stroke={METRIC_COLORS.tone} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 2" />
              <Line type="monotone" dataKey="foreheadMoisture" name={`おでこ・${METRIC_LABELS.moisture}`} stroke={METRIC_COLORS.moisture} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 2" />
              <Line type="monotone" dataKey="foreheadOil" name={`おでこ・${METRIC_LABELS.oil}`} stroke={METRIC_COLORS.oil} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 2" />
              <Line type="monotone" dataKey="foreheadElasticity" name={`おでこ・${METRIC_LABELS.elasticity}`} stroke={METRIC_COLORS.elasticity} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 2" />
            </>
          )}

          {showCheek && (
            <>
              <Line type="monotone" dataKey="cheekTone" name={`ほお・${METRIC_LABELS.tone}`} stroke={METRIC_COLORS.tone} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cheekMoisture" name={`ほお・${METRIC_LABELS.moisture}`} stroke={METRIC_COLORS.moisture} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cheekOil" name={`ほお・${METRIC_LABELS.oil}`} stroke={METRIC_COLORS.oil} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cheekElasticity" name={`ほお・${METRIC_LABELS.elasticity}`} stroke={METRIC_COLORS.elasticity} strokeWidth={2} dot={{ r: 3 }} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
