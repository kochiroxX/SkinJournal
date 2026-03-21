import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { PeriodFilter } from '../../types';

interface Props {
  value: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
}

const OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'week', label: '1週間' },
  { value: 'month', label: '1ヶ月' },
  { value: 'all', label: '全期間' },
];

export default function PeriodSelector({ value, onChange }: Props) {
  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, v) => v && onChange(v)}
        size="small"
        color="primary"
      >
        {OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
