import { Grid, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { CosmeticsUsed, CosmeticsMaster } from '../../types';

interface Props {
  value: CosmeticsUsed;
  master: CosmeticsMaster;
  onChange: (cosmetics: CosmeticsUsed) => void;
}

export default function CosmeticsSelector({ value, master, onChange }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          使用化粧品
        </Typography>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>化粧水</InputLabel>
          <Select
            value={value.toner}
            label="化粧水"
            onChange={(e) => onChange({ ...value, toner: e.target.value })}
          >
            <MenuItem value="">未使用</MenuItem>
            {master.toners.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>美容液</InputLabel>
          <Select
            value={value.essence}
            label="美容液"
            onChange={(e) => onChange({ ...value, essence: e.target.value })}
          >
            <MenuItem value="">未使用</MenuItem>
            {master.essences.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>乳液</InputLabel>
          <Select
            value={value.lotion}
            label="乳液"
            onChange={(e) => onChange({ ...value, lotion: e.target.value })}
          >
            <MenuItem value="">未使用</MenuItem>
            {master.lotions.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
