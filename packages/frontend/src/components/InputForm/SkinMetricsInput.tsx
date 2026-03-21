import { Box, Slider, Typography, Grid } from '@mui/material';
import { SkinMetrics } from '../../types';

interface Props {
  label: string;
  value: SkinMetrics;
  onChange: (metrics: SkinMetrics) => void;
}

const METRICS: { key: keyof SkinMetrics; label: string; color: string }[] = [
  { key: 'tone', label: '肌色', color: '#f8bbd0' },
  { key: 'moisture', label: '水分量', color: '#bbdefb' },
  { key: 'oil', label: '油分量', color: '#fff9c4' },
  { key: 'elasticity', label: '弾性力', color: '#c8e6c9' },
];

export default function SkinMetricsInput({ label, value, onChange }: Props) {
  const handleChange = (key: keyof SkinMetrics) => (_: Event, newValue: number | number[]) => {
    onChange({ ...value, [key]: newValue as number });
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      <Grid container spacing={2}>
        {METRICS.map(({ key, label: metricLabel, color }) => (
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
                max={100}
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
    </Box>
  );
}
