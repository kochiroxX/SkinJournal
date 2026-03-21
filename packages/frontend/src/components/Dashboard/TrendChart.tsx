// ============================================================
// PBI-03: 肌状態 推移グラフ（部位・指標をトグルで切り替え）
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
import { Box } from '@mui/material';
import { useState } from 'react';
import { NormalizedRecord } from '../../types';
import { SCALE_MAX, METRIC_LABELS, METRIC_COLORS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import EmptyStateBox from '../shared/EmptyStateBox';
// [Refactor] PBI-15: 部位選択トグルを FilterToggleGroup に委譲
import FilterToggleGroup from '../shared/FilterToggleGroup';
// [Refactor] PBI-18: 日付フォーマット関数を utils/format.ts に委譲
import { formatMonthDay } from '../../utils/format';

type AreaFilter = 'forehead' | 'cheek' | 'both';

// [Refactor] PBI-20: Recharts 固有の型はここにローカル定義（types/index.ts から移動）
interface TrendDataPoint {
  date: string;
  foreheadTone: number;
  foreheadMoisture: number;
  foreheadOil: number;
  foreheadElasticity: number;
  cheekTone: number;
  cheekMoisture: number;
  cheekOil: number;
  cheekElasticity: number;
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
    foreheadTone: r.forehead.tone,
    foreheadMoisture: r.forehead.moisture,
    foreheadOil: r.forehead.oil,
    foreheadElasticity: r.forehead.elasticity,
    cheekTone: r.cheek.tone,
    cheekMoisture: r.cheek.moisture,
    cheekOil: r.cheek.oil,
    cheekElasticity: r.cheek.elasticity,
  }));
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

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, SCALE_MAX]} tickCount={6} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />

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
