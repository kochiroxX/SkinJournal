// ============================================================
// [Refactor] PBI-16: フォームコンポーネント統一
// InputForm/SkinMetricsInput と DataTable/EditDialog の両方で
// 肌指標スライダーの同一構造が重複していたため共有コンポーネントとして抽出。
// - variant="full"    : InputForm 用（Grid レイアウト・色付き値バッジ）
// - variant="compact" : EditDialog 用（行レイアウト・シンプル表示）
// [Add] PBI-32: スライダーに加えて数値入力フィールドと ±1 ボタンを追加。
// キーボード上下矢印でも操作可能（input の onKeyDown で対応）。
// ============================================================

import { Box, Grid, IconButton, Input, Slider, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
  const handleSliderChange = (key: keyof SkinMetrics) => (_: Event, v: number | number[]) => {
    onChange({ ...value, [key]: v as number });
  };

  // [Add] PBI-32: 数値入力フィールドの変更ハンドラ（範囲外は clamp）
  const handleInputChange = (key: keyof SkinMetrics) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (isNaN(raw)) return;
    onChange({ ...value, [key]: Math.min(SCALE_MAX, Math.max(0, raw)) });
  };

  // [Add] PBI-32: ±1 ボタンおよびキーボード上下矢印のハンドラ
  const handleStep = (key: keyof SkinMetrics, delta: 1 | -1) => {
    onChange({ ...value, [key]: Math.min(SCALE_MAX, Math.max(0, value[key] + delta)) });
  };

  const handleKeyDown = (key: keyof SkinMetrics) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); handleStep(key, 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); handleStep(key, -1); }
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
        // [Add] PBI-32: 数値入力ボックス＋±ボタンを右側に配置
        <Grid container spacing={2}>
          {METRIC_SLIDER_CONFIG.map(({ key, label: metricLabel, color }) => (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ px: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2">{metricLabel}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <IconButton size="small" onClick={() => handleStep(key, -1)} disabled={value[key] <= 0}>
                      <RemoveIcon fontSize="inherit" />
                    </IconButton>
                    <Input
                      value={value[key]}
                      onChange={handleInputChange(key)}
                      onKeyDown={handleKeyDown(key)}
                      inputProps={{ min: 0, max: SCALE_MAX, style: { textAlign: 'center', width: 36, padding: '2px 0', fontWeight: 700 } }}
                      disableUnderline
                      sx={{ bgcolor: color, borderRadius: 1, px: 0.5 }}
                    />
                    <IconButton size="small" onClick={() => handleStep(key, 1)} disabled={value[key] >= SCALE_MAX}>
                      <AddIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </Box>
                <Slider
                  value={value[key]}
                  min={0}
                  max={SCALE_MAX}
                  step={1}
                  onChange={handleSliderChange(key)}
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
        // [Add] PBI-32: ±ボタンと数値入力フィールドを右端に追加
        <>
          {METRIC_SLIDER_CONFIG.map(({ key, label: metricLabel, color }) => (
            <Box key={key} display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="caption" sx={{ width: 48, flexShrink: 0 }}>
                {metricLabel}
              </Typography>
              <Slider
                value={value[key]}
                min={0}
                max={SCALE_MAX}
                step={1}
                onChange={handleSliderChange(key)}
                sx={{ color: color, flex: 1 }}
              />
              <IconButton size="small" onClick={() => handleStep(key, -1)} disabled={value[key] <= 0} sx={{ p: 0.25 }}>
                <RemoveIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <Input
                value={value[key]}
                onChange={handleInputChange(key)}
                onKeyDown={handleKeyDown(key)}
                inputProps={{ min: 0, max: SCALE_MAX, style: { textAlign: 'center', width: 28, padding: '1px 0', fontSize: 12 } }}
                disableUnderline
                sx={{ bgcolor: color, borderRadius: 0.5, px: 0.25 }}
              />
              <IconButton size="small" onClick={() => handleStep(key, 1)} disabled={value[key] >= SCALE_MAX} sx={{ p: 0.25 }}>
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
