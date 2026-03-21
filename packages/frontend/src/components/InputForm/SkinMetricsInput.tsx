// ============================================================
// PBI-01: 部位別 肌指標入力コンポーネント
// ============================================================

// [Refactor] PBI-16: スライダーの実装を shared/MetricSliderGroup に委譲。
// ローカルで定義していた METRICS 配列は constants.ts に移動済み。

import { SkinMetrics } from '../../types';
import MetricSliderGroup from '../shared/MetricSliderGroup';

interface Props {
  label: string;
  value: SkinMetrics;
  onChange: (metrics: SkinMetrics) => void;
}

export default function SkinMetricsInput({ label, value, onChange }: Props) {
  // [Refactor] variant="full" で Grid レイアウト・色付きバッジのデザインを維持
  return <MetricSliderGroup label={label} value={value} onChange={onChange} variant="full" />;
}
