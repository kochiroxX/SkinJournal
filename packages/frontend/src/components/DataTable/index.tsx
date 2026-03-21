// ============================================================
// PBI-02: データテーブルビュー（生データ・正規化済みデータの確認）
// ============================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  TextField,
  Checkbox,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSkinData, updateRecord, deleteRecord } from '../../hooks/useSkinData';
import { NormalizedRecord, SkinMetrics, SkinEntryInput } from '../../types';
import { METRIC_LABELS, METRIC_COLORS, getScoreColor, SCALE_MAX } from '../../constants';

function ScoreChip({ value }: { value: number }) {
  return (
    <Chip
      label={value}
      color={getScoreColor(value)}
      size="small"
      sx={{ fontWeight: 700, minWidth: 48 }}
    />
  );
}

function MetricsCell({ metrics }: { metrics: SkinMetrics }) {
  return (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      {(Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>).map((key) => (
        <Tooltip key={key} title={METRIC_LABELS[key]}>
          <Chip
            label={`${METRIC_LABELS[key][0]}:${metrics[key]}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: METRIC_COLORS[key], color: METRIC_COLORS[key] }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

function BoolIcon({ value }: { value: boolean }) {
  return value
    ? <CheckCircleIcon fontSize="small" color="success" />
    : <CancelIcon fontSize="small" color="disabled" />;
}

// ── 編集ダイアログ ────────────────────────────────────────
function EditDialog({
  record,
  onClose,
  onSave,
}: {
  record: NormalizedRecord;
  onClose: () => void;
  onSave: (entry: SkinEntryInput) => Promise<void>;
}) {
  const [forehead, setForehead] = useState<SkinMetrics>({ ...record.forehead });
  const [cheek, setCheek] = useState<SkinMetrics>({ ...record.cheek });
  const [toner, setToner] = useState(record.cosmetics.toner);
  const [essence, setEssence] = useState(record.cosmetics.essence);
  const [lotion, setLotion] = useState(record.cosmetics.lotion);
  const [businessTrip, setBusinessTrip] = useState(record.factors.businessTrip);
  const [alcohol, setAlcohol] = useState(record.factors.alcohol);
  const [sleepHours, setSleepHours] = useState(record.factors.sleepHours);
  const [notes, setNotes] = useState(record.factors.notes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      forehead, cheek,
      cosmetics: { toner, essence, lotion },
      factors: { businessTrip, alcohol, sleepHours, notes },
    });
    setSaving(false);
  };

  const MetricSliders = ({
    label, value, onChange,
  }: { label: string; value: SkinMetrics; onChange: (m: SkinMetrics) => void }) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      {(Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>).map((key) => (
        <Box key={key} display="flex" alignItems="center" gap={2} mb={0.5}>
          <Typography variant="caption" sx={{ width: 48, flexShrink: 0 }}>{METRIC_LABELS[key]}</Typography>
          <Slider
            value={value[key]}
            min={0} max={SCALE_MAX} step={1}
            onChange={(_, v) => onChange({ ...value, [key]: v as number })}
            sx={{ color: METRIC_COLORS[key] }}
          />
          <Typography variant="caption" sx={{ width: 28, textAlign: 'right' }}>{value[key]}</Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>記録を編集</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          <MetricSliders label="おでこ" value={forehead} onChange={setForehead} />
          <MetricSliders label="ほお" value={cheek} onChange={setCheek} />
          <Box>
            <Typography variant="subtitle2" gutterBottom>使用化粧品</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <TextField size="small" label="化粧水" value={toner} onChange={(e) => setToner(e.target.value)} fullWidth />
              <TextField size="small" label="美容液" value={essence} onChange={(e) => setEssence(e.target.value)} fullWidth />
              <TextField size="small" label="乳液" value={lotion} onChange={(e) => setLotion(e.target.value)} fullWidth />
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>ライフログ</Typography>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <FormControlLabel
                control={<Checkbox checked={businessTrip} onChange={(e) => setBusinessTrip(e.target.checked)} />}
                label="出張"
              />
              <FormControlLabel
                control={<Checkbox checked={alcohol} onChange={(e) => setAlcohol(e.target.checked)} />}
                label="飲酒"
              />
              <TextField
                size="small" type="number" label="睡眠時間"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 24, step: 0.5 }}
                sx={{ width: 120 }}
              />
              <TextField
                size="small" label="メモ" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── 正規化済みデータテーブル ────────────────────────────
function NormalizedTable({
  records,
  onRefetch,
}: {
  records: NormalizedRecord[];
  onRefetch: () => void;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editRecord, setEditRecord] = useState<NormalizedRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NormalizedRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const paginated = [...records]
    .reverse()
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSave = async (entry: SkinEntryInput) => {
    try {
      await updateRecord(editRecord!.timestamp, entry);
      setSnackbar({ open: true, message: '更新しました', severity: 'success' });
      setEditRecord(null);
      onRefetch();
    } catch {
      setSnackbar({ open: true, message: '更新に失敗しました', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecord(deleteTarget!.timestamp);
      setSnackbar({ open: true, message: '削除しました', severity: 'success' });
      setDeleteTarget(null);
      onRefetch();
    } catch {
      setSnackbar({ open: true, message: '削除に失敗しました', severity: 'error' });
    }
  };

  return (
    <>
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>日時</TableCell>
              <TableCell>おでこ</TableCell>
              <TableCell>ほお</TableCell>
              <TableCell>化粧水</TableCell>
              <TableCell>美容液</TableCell>
              <TableCell>乳液</TableCell>
              <TableCell align="center">出張</TableCell>
              <TableCell align="center">飲酒</TableCell>
              <TableCell>睡眠</TableCell>
              <TableCell>メモ</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {new Date(r.timestamp).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell><MetricsCell metrics={r.forehead} /></TableCell>
                <TableCell><MetricsCell metrics={r.cheek} /></TableCell>
                <TableCell><Typography variant="caption">{r.cosmetics.toner || '—'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{r.cosmetics.essence || '—'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{r.cosmetics.lotion || '—'}</Typography></TableCell>
                <TableCell align="center"><BoolIcon value={r.factors.businessTrip} /></TableCell>
                <TableCell align="center"><BoolIcon value={r.factors.alcohol} /></TableCell>
                <TableCell><Typography variant="caption">{r.factors.sleepHours}h</Typography></TableCell>
                <TableCell sx={{ maxWidth: 120 }}>
                  <Typography variant="caption" noWrap>{r.factors.notes || '—'}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="編集">
                    <IconButton size="small" onClick={() => setEditRecord(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="削除">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(r)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={records.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="表示件数:"
      />

      {editRecord && (
        <EditDialog record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSave} />
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>記録を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget && new Date(deleteTarget.timestamp).toLocaleString('ja-JP')} の記録を削除します。この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>削除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

function DatasetSummary({ records }: { records: NormalizedRecord[] }) {
  if (records.length === 0) {
    return <Typography color="text.secondary">データがありません</Typography>;
  }

  const latest = records[records.length - 1];
  const avgMetric = (key: keyof NormalizedRecord['forehead'], area: 'forehead' | 'cheek') =>
    (records.reduce((s, r) => s + r[area][key], 0) / records.length).toFixed(1);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        データセット概要（全 {records.length} 件）
      </Typography>
      <Box display="flex" gap={4} flexWrap="wrap" mt={2}>
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>肌状態データセット</Typography>
          <Box mt={1}>
            {(Object.keys(METRIC_LABELS) as Array<keyof NormalizedRecord['forehead']>).map((key) => (
              <Box key={key} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">{METRIC_LABELS[key]}（平均）</Typography>
                <Box display="flex" gap={1}>
                  <ScoreChip value={parseFloat(avgMetric(key, 'forehead'))} />
                  <ScoreChip value={parseFloat(avgMetric(key, 'cheek'))} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>使用化粧品データセット（最新）</Typography>
          <Box mt={1}>
            <Typography variant="body2">化粧水: {latest.cosmetics.toner || '未使用'}</Typography>
            <Typography variant="body2">美容液: {latest.cosmetics.essence || '未使用'}</Typography>
            <Typography variant="body2">乳液: {latest.cosmetics.lotion || '未使用'}</Typography>
          </Box>
        </Box>
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>外部要因データセット（統計）</Typography>
          <Box mt={1}>
            <Typography variant="body2">出張率: {((records.filter((r) => r.factors.businessTrip).length / records.length) * 100).toFixed(0)}%</Typography>
            <Typography variant="body2">飲酒率: {((records.filter((r) => r.factors.alcohol).length / records.length) * 100).toFixed(0)}%</Typography>
            <Typography variant="body2">平均睡眠: {(records.reduce((s, r) => s + r.factors.sleepHours, 0) / records.length).toFixed(1)}時間</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function handleCsvDownload() {
  const a = document.createElement('a');
  a.href = '/api/export/csv';
  a.click();
}

export default function DataTable() {
  const { records, loading, error, refetch } = useSkinData('all');
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>データビュー</Typography>
        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleCsvDownload}>
          CSV ダウンロード
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        記録したデータを確認・編集・削除できます
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Card elevation={0}>
          <CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="正規化済みデータ一覧" />
              <Tab label="データセット概要" />
            </Tabs>
            {tab === 0 && <NormalizedTable records={records} onRefetch={refetch} />}
            {tab === 1 && <DatasetSummary records={records} />}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
