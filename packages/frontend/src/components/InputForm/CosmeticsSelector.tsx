import { Grid, FormControl, InputLabel, Select, MenuItem, ListSubheader, Typography } from '@mui/material';
import { CosmeticsUsed, CosmeticsMaster, CosmeticItem, formatItemValue, getItemStatus } from '../../types';

interface Props {
  value: CosmeticsUsed;
  master: CosmeticsMaster;
  onChange: (cosmetics: CosmeticsUsed) => void;
}

/** アイテムをステータスで分け、メーカーグループの MenuItem を生成する */
function buildMenuItems(items: CosmeticItem[]) {
  const active  = items.filter((i) => getItemStatus(i) === 'active');
  const others  = items.filter((i) => getItemStatus(i) !== 'active');

  const toGroupedItems = (list: CosmeticItem[], dimmed: boolean) => {
    const groups = new Map<string, CosmeticItem[]>();
    for (const item of list) {
      const key = item.maker || '（メーカー未設定）';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    const result: React.ReactNode[] = [];
    groups.forEach((groupItems, maker) => {
      result.push(
        <ListSubheader key={`h-${maker}`} sx={{ lineHeight: '28px', fontSize: 11, color: 'text.secondary' }}>
          {maker}
        </ListSubheader>
      );
      groupItems.forEach((item) => {
        result.push(
          <MenuItem key={item.id} value={formatItemValue(item)} sx={{ pl: 3, opacity: dimmed ? 0.5 : 1 }}>
            {item.name}
          </MenuItem>
        );
      });
    });
    return result;
  };

  return [
    ...toGroupedItems(active, false),
    ...(others.length > 0
      ? [
          <ListSubheader key="divider-others" sx={{ lineHeight: '28px', fontSize: 11, color: 'text.disabled', borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}>
            使用期間外
          </ListSubheader>,
          ...toGroupedItems(others, true),
        ]
      : []),
  ];
}

export default function CosmeticsSelector({ value, master, onChange }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          使用化粧品
        </Typography>
      </Grid>

      {(
        [
          { field: 'toner',   label: '化粧水', items: master.toners },
          { field: 'essence', label: '美容液', items: master.essences },
          { field: 'lotion',  label: '乳液',   items: master.lotions },
          // [Add] PBI-33: 下地カテゴリを追加
          { field: 'primer',  label: '下地',   items: master.primers },
        ] as const
      ).map(({ field, label, items }) => (
        <Grid item xs={12} sm={4} key={field}>
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              value={value[field]}
              label={label}
              onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            >
              <MenuItem value="">未使用</MenuItem>
              {buildMenuItems(items)}
            </Select>
          </FormControl>
        </Grid>
      ))}
    </Grid>
  );
}
