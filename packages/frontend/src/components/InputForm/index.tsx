// ============================================================
// PBI-01: 高機能入力フォーム
// 部位別（おでこ・ほお）×指標4種 + 化粧品マスタ選択 + ライフログ
// ============================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SkinMetricsInput from './SkinMetricsInput';
import CosmeticsSelector from './CosmeticsSelector';
import ExternalFactorsInput from './ExternalFactorsInput';
import { useCosmeticsMaster, submitEntry } from '../../hooks/useSkinData';
import { SkinEntryInput, SkinMetrics, CosmeticsUsed, ExternalFactors } from '../../types';

const DEFAULT_METRICS: SkinMetrics = {
  tone: 50,
  moisture: 50,
  oil: 50,
  elasticity: 50,
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_COSMETICS: CosmeticsUsed = {
  toner: '',
  essence: '',
  lotion: '',
};

const DEFAULT_FACTORS: ExternalFactors = {
  businessTrip: false,
  alcohol: false,
  sleepHours: 7,
  notes: '',
};

export default function InputForm() {
  const { master } = useCosmeticsMaster();

  const [recordDate, setRecordDate] = useState(todayString());
  const [forehead, setForehead] = useState<SkinMetrics>({ ...DEFAULT_METRICS });
  const [cheek, setCheek] = useState<SkinMetrics>({ ...DEFAULT_METRICS });
  const [cosmetics, setCosmetics] = useState<CosmeticsUsed>({ ...DEFAULT_COSMETICS });
  const [factors, setFactors] = useState<ExternalFactors>({ ...DEFAULT_FACTORS });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const entry: SkinEntryInput = { forehead, cheek, cosmetics, factors, date: recordDate };
      await submitEntry(entry);

      // リセット
      setRecordDate(todayString());
      setForehead({ ...DEFAULT_METRICS });
      setCheek({ ...DEFAULT_METRICS });
      setCosmetics({ ...DEFAULT_COSMETICS });
      setFactors({ ...DEFAULT_FACTORS });

      setSnackbar({ open: true, message: '記録を保存しました！', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '保存に失敗しました',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        肌状態の記録
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        肌状態をスライダーで入力してください（0〜100スケール）
      </Typography>

      <Grid container spacing={3}>
        {/* 記録日 */}
        <Grid item xs={12}>
          <TextField
            type="date"
            label="記録日"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 200 }}
          />
        </Grid>

        {/* おでこ */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <SkinMetricsInput label="おでこ" value={forehead} onChange={setForehead} />
            </CardContent>
          </Card>
        </Grid>

        {/* ほお */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <SkinMetricsInput label="ほお" value={cheek} onChange={setCheek} />
            </CardContent>
          </Card>
        </Grid>

        {/* 使用化粧品 */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <CosmeticsSelector value={cosmetics} master={master} onChange={setCosmetics} />
            </CardContent>
          </Card>
        </Grid>

        {/* ライフログ */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <ExternalFactorsInput value={factors} onChange={setFactors} />
            </CardContent>
          </Card>
        </Grid>

        {/* 保存ボタン */}
        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            >
              {submitting ? '保存中...' : '記録を保存'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
