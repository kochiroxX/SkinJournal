// ============================================================
// [Refactor] PBI-14: 共有UIコンポーネント
// Dashboard / DataTable / CosmeticsMasterEditor の3画面で
// 「h5タイトル + 右揃えコントロール」の同一レイアウトが重複していたため抽出。
// ============================================================

import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  // [Refactor] 右側に任意のボタン/コントロールを配置できるスロット
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <Box mb={3}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={1}
        mb={subtitle ? 0.5 : 0}
      >
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          {title}
        </Typography>
        {actions && (
          <Box display="flex" gap={1} alignItems="center">
            {actions}
          </Box>
        )}
      </Box>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
