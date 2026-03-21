// ============================================================
// [Refactor] PBI-14: 共有UIコンポーネント
// DataTable と CosmeticsMasterEditor の2箇所で同一構造の
// 削除確認ダイアログが重複していたため抽出。
// ============================================================

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

// [Refactor] confirmLabel / title はオプションでデフォルト値を設定
export default function ConfirmDialog({
  open,
  title = '削除の確認',
  message,
  confirmLabel = '削除',
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
