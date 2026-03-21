// ============================================================
// [Refactor] PBI-16: フォームコンポーネント統一
// InputForm/SkinMetricsInput と DataTable/EditDialog の両方で
// 肌指標スライダーの同一構造が重複していたため共有コンポーネントとして抽出。
// - variant="full"    : InputForm 用（Grid レイアウト・色付き値バッジ）
// - variant="compact" : EditDialog 用（行レイアウト・シンプル表示）
// ============================================================

import { Box, Grid, Slider, Typography } from '@mui/material';
import { SkinMetrics } from '../../types';
import { METRIC_SLIDER_CONFIG, SCALE_MAX } from '../../constants';

interface Props {
  label?: string;
  value: SkinMetrics;
  onChange: (metrics: SkinMetrics) => void;
  variant?: 'full' | 'compact';
}

export default function MetricSliderGroup({
  label,
  value,
  onChange,
  variant = 'full',
}: Props) {
  const handleChange = (key: keyof SkinMetrics) => (_: Event, v: number | number[]) => {
    onChange({ ...value, [key]: v as number });
  };

  return (
    <Box>
      {label && (
        <Typography
          variant={variant === 'full' ? 'subtitle1' : 'subtitle2'}
          fontWeight={variant === 'full' ? 600 : undefined}
          gutterBottom
        >
          {label}
        </Typography>
      )}

      {variant === 'full' ? (
        // [Refactor] InputForm 向けの Grid レイアウト（SkinMetricsInput から移植）
        <Grid container spacing={2}>
          {METRIC_SLIDER_CONFIG.map(({ key, label: metricLabel, color }) => (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ px: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{metricLabel}</Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      bgcolor: color,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      minWidth: 32,
                      textAlign: 'center',
                    }}
                  >
                    {value[key]}
                  </Typography>
                </Box>
                <Slider
                  value={value[key]}
                  min={0}
                  max={SCALE_MAX}
                  step={1}
                  onChange={handleChange(key)}
                  sx={{
                    color: color,
                    '& .MuiSlider-thumb': { bgcolor: color, border: '2px solid currentColor' },
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        // [Refactor] EditDialog 向けのコンパクトな行レイアウト（DataTable から移植）
        <>
          {METRIC_SLIDER_CONFIG.map(({ key, label: metricLabel, color }) => (
            <Box key={key} display="flex" alignItems="center" gap={2} mb={0.5}>
              <Typography variant="caption" sx={{ width: 48, flexShrink: 0 }}>
                {metricLabel}
              </Typography>
              <Slider
                value={value[key]}
                min={0}
                max={SCALE_MAX}
                step={1}
                onChange={handleChange(key)}
                sx={{ color: color }}
              />
              <Typography variant="caption" sx={{ width: 28, textAlign: 'right' }}>
                {value[key]}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
