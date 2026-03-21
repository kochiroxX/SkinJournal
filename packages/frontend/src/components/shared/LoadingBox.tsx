// ============================================================
// [Refactor] PBI-14: 共有UIコンポーネント
// Dashboard / DataTable / CosmeticsMasterEditor の3箇所で
// 同一のローディング表示が重複していたため抽出。
// ============================================================

import { Box, CircularProgress } from '@mui/material';

interface Props {
  py?: number;
}

export default function LoadingBox({ py = 8 }: Props) {
  return (
    <Box display="flex" justifyContent="center" py={py}>
      <CircularProgress />
    </Box>
  );
}
