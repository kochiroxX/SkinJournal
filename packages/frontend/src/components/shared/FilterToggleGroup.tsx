// ============================================================
// [Refactor] PBI-15: チャート共通コンポーネント
// CosmeticsChart（カテゴリ選択）/ FactorsChart（要因選択）で同一構造の
// ToggleButtonGroup が重複していたため汎用コンポーネントとして抽出。
// ============================================================

import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

interface Props<T extends string> {
  label: string;
  // [Refactor] options は Record<値, 表示ラベル> の形式で渡す
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}

export default function FilterToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, v) => v && onChange(v as T)}
        size="small"
      >
        {(Object.entries(options) as [T, string][]).map(([k, l]) => (
          <ToggleButton key={k} value={k}>
            {l}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
