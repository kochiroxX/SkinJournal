// ============================================================
// [Refactor] PBI-17: Hooks 抽象化
// InputForm / DataTable / CosmeticsMasterEditor の3コンポーネントで
// Snackbar の state 定義と JSX が完全に重複していたためフックとして抽出。
// 呼び出し元は showSuccess / showError を呼ぶだけでよい。
// ============================================================

import { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

const DEFAULT_STATE: SnackbarState = { open: false, message: '', severity: 'success' };

export function useSnackbar(autoHideDuration = 3000) {
  const [state, setState] = useState<SnackbarState>(DEFAULT_STATE);

  const showSuccess = (message: string) =>
    setState({ open: true, message, severity: 'success' });

  const showError = (message: string) =>
    setState({ open: true, message, severity: 'error' });

  const close = () => setState((s) => ({ ...s, open: false }));

  // [Refactor] JSX 要素を返すことで呼び出し元は {snackbarEl} を置くだけで済む
  const snackbarEl = (
    <Snackbar
      open={state.open}
      autoHideDuration={autoHideDuration}
      onClose={close}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={state.severity} variant="filled" onClose={close}>
        {state.message}
      </Alert>
    </Snackbar>
  );

  return { showSuccess, showError, snackbarEl };
}
