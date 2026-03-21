import {
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Slider,
  Box,
} from '@mui/material';
import { ExternalFactors } from '../../types';

interface Props {
  value: ExternalFactors;
  onChange: (factors: ExternalFactors) => void;
}

export default function ExternalFactorsInput({ value, onChange }: Props) {
  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          ライフログ
        </Typography>
      </Grid>

      <Grid item xs={6} sm={3}>
        <FormControlLabel
          control={
            <Switch
              checked={value.businessTrip}
              onChange={(e) => onChange({ ...value, businessTrip: e.target.checked })}
              color="warning"
            />
          }
          label="出張"
        />
      </Grid>

      <Grid item xs={6} sm={3}>
        <FormControlLabel
          control={
            <Switch
              checked={value.alcohol}
              onChange={(e) => onChange({ ...value, alcohol: e.target.checked })}
              color="error"
            />
          }
          label="飲酒"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">睡眠時間</Typography>
            <Typography variant="body2" fontWeight={700}>
              {value.sleepHours}時間
            </Typography>
          </Box>
          <Slider
            value={value.sleepHours}
            min={0}
            max={12}
            step={0.5}
            marks={[
              { value: 0, label: '0h' },
              { value: 6, label: '6h' },
              { value: 12, label: '12h' },
            ]}
            onChange={(_, v) => onChange({ ...value, sleepHours: v as number })}
            color="primary"
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          size="small"
          label="メモ（任意）"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="体調、天気、その他気になることなど..."
        />
      </Grid>
    </Grid>
  );
}
