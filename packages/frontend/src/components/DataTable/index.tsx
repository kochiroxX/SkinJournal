// ============================================================
// PBI-02: データテーブルビュー（生データ・正規化済みデータの確認）
// [Add] PBI-34: モバイル対応（スマホではカード表示）と詳細・編集・削除ポップアップ化
//   - sm 以上: 従来のテーブル表示（ヘッダー列を省略可能な項目を隠す）
//   - xs のみ: レコードをカード形式で表示し、タップでポップアップを開く
// ============================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  TextField,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSkinData, updateRecord, deleteRecord } from '../../hooks/useSkinData';
import { NormalizedRecord, SkinMetrics, SkinEntryInput } from '../../types';
import { METRIC_LABELS, METRIC_COLORS } from '../../constants';
// [Refactor] PBI-14: 共有コンポーネントを使用
import LoadingBox from '../shared/LoadingBox';
import ScoreChip from '../shared/ScoreChip';
import ConfirmDialog from '../shared/ConfirmDialog';
// [Refactor] PBI-16: MetricSliderGroup を使用（EditDialog 内のインライン実装を置き換え）
import MetricSliderGroup from '../shared/MetricSliderGroup';
// [Refactor] PBI-17: useSnackbar フックを使用
import { useSnackbar } from '../../hooks/useSnackbar';
// [Refactor] PBI-18: 日付フォーマット関数を utils/format.ts に委譲
import { formatDateTime } from '../../utils/format';

// [Refactor] PBI-14: ScoreChip は shared/ScoreChip に移動済み。ここでは削除。

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
  // [Add] PBI-33: 下地フィールドを追加
  const [primer, setPrimer] = useState(record.cosmetics.primer);
  const [businessTrip, setBusinessTrip] = useState(record.factors.businessTrip);
  const [alcohol, setAlcohol] = useState(record.factors.alcohol);
  const [sleepHours, setSleepHours] = useState(record.factors.sleepHours);
  const [notes, setNotes] = useState(record.factors.notes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      forehead, cheek,
      // [Add] PBI-33: 下地フィールドを追加
      cosmetics: { toner, essence, lotion, primer },
      factors: { businessTrip, alcohol, sleepHours, notes },
    });
    setSaving(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>記録を編集</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {/* [Refactor] PBI-16: MetricSliderGroup（variant="compact"）を使用 */}
          <MetricSliderGroup label="おでこ" value={forehead} onChange={setForehead} variant="compact" />
          <MetricSliderGroup label="ほお" value={cheek} onChange={setCheek} variant="compact" />
          <Box>
            <Typography variant="subtitle2" gutterBottom>使用化粧品</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <TextField size="small" label="化粧水" value={toner} onChange={(e) => setToner(e.target.value)} fullWidth />
              <TextField size="small" label="美容液" value={essence} onChange={(e) => setEssence(e.target.value)} fullWidth />
              <TextField size="small" label="乳液" value={lotion} onChange={(e) => setLotion(e.target.value)} fullWidth />
              {/* [Add] PBI-33: 下地フィールドを追加 */}
              <TextField size="small" label="下地" value={primer} onChange={(e) => setPrimer(e.target.value)} fullWidth />
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

// ── [Add] PBI-34: 詳細ポップアップ ────────────────────────
function DetailDialog({
  record,
  onClose,
  onEdit,
  onDelete,
}: {
  record: NormalizedRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{formatDateTime(record.timestamp)}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* 肌指標 */}
          {(['forehead', 'cheek'] as const).map((area) => (
            <Box key={area}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {area === 'forehead' ? 'おでこ' : 'ほお'}
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                {(Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>).map((key) => (
                  <Box key={key} display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" color="text.secondary">{METRIC_LABELS[key]}:</Typography>
                    <ScoreChip value={record[area][key]} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

          <Divider />

          {/* 使用化粧品 */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>使用化粧品</Typography>
            <Box mt={0.5}>
              {[
                { label: '化粧水', value: record.cosmetics.toner },
                { label: '美容液', value: record.cosmetics.essence },
                { label: '乳液',   value: record.cosmetics.lotion },
                // [Add] PBI-33: 下地を追加
                { label: '下地',   value: record.cosmetics.primer },
              ].map(({ label, value }) => (
                <Typography key={label} variant="body2">{label}: {value || '未使用'}</Typography>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* ライフログ */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>ライフログ</Typography>
            <Box mt={0.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
              <Chip icon={<BoolIcon value={record.factors.businessTrip} />} label="出張" size="small" variant="outlined" />
              <Chip icon={<BoolIcon value={record.factors.alcohol} />} label="飲酒" size="small" variant="outlined" />
              <Typography variant="body2">睡眠: {record.factors.sleepHours}h</Typography>
              {record.factors.notes && (
                <Typography variant="body2" color="text.secondary">メモ: {record.factors.notes}</Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <Button color="error" startIcon={<DeleteIcon />} onClick={onDelete}>削除</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>編集</Button>
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
  const theme = useTheme();
  // [Add] PBI-34: モバイル判定（xs のみカードビュー）
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editRecord, setEditRecord] = useState<NormalizedRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NormalizedRecord | null>(null);
  // [Add] PBI-34: 詳細ポップアップ用
  const [detailRecord, setDetailRecord] = useState<NormalizedRecord | null>(null);
  // [Refactor] PBI-17: useSnackbar フックに委譲
  const { showSuccess, showError, snackbarEl } = useSnackbar();

  const paginated = [...records]
    .reverse()
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSave = async (entry: SkinEntryInput) => {
    try {
      await updateRecord(editRecord!.timestamp, entry);
      showSuccess('更新しました');
      setEditRecord(null);
      onRefetch();
    } catch {
      showError('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecord(deleteTarget!.timestamp);
      showSuccess('削除しました');
      setDeleteTarget(null);
      setDetailRecord(null);
      onRefetch();
    } catch {
      showError('削除に失敗しました');
    }
  };

  const pagination = (
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
  );

  return (
    <>
      {/* [Add] PBI-34: モバイルはカードビュー */}
      {isMobile ? (
        <Box>
          {paginated.map((r) => (
            <Card
              key={r.id}
              variant="outlined"
              sx={{ mb: 1, cursor: 'pointer' }}
              onClick={() => setDetailRecord(r)}
            >
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary">{formatDateTime(r.timestamp)}</Typography>
                    <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                      {(Object.keys(METRIC_LABELS) as Array<keyof SkinMetrics>).map((key) => (
                        <Chip
                          key={key}
                          label={`${METRIC_LABELS[key][0]}:${r.forehead[key]}`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: METRIC_COLORS[key], color: METRIC_COLORS[key], fontSize: 10 }}
                        />
                      ))}
                    </Box>
                    {r.cosmetics.toner && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                        化粧水: {r.cosmetics.toner}
                      </Typography>
                    )}
                  </Box>
                  <VisibilityIcon fontSize="small" color="action" sx={{ mt: 0.5, flexShrink: 0 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
          {pagination}
        </Box>
      ) : (
        // デスクトップはテーブル表示
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
                  {/* [Add] PBI-33: 下地カラムを追加 */}
                  <TableCell>下地</TableCell>
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
                      {/* [Refactor] PBI-18: formatDateTime を使用 */}
                      {formatDateTime(r.timestamp)}
                    </TableCell>
                    <TableCell><MetricsCell metrics={r.forehead} /></TableCell>
                    <TableCell><MetricsCell metrics={r.cheek} /></TableCell>
                    <TableCell><Typography variant="caption">{r.cosmetics.toner || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{r.cosmetics.essence || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{r.cosmetics.lotion || '—'}</Typography></TableCell>
                    {/* [Add] PBI-33: 下地カラムを追加 */}
                    <TableCell><Typography variant="caption">{r.cosmetics.primer || '—'}</Typography></TableCell>
                    <TableCell align="center"><BoolIcon value={r.factors.businessTrip} /></TableCell>
                    <TableCell align="center"><BoolIcon value={r.factors.alcohol} /></TableCell>
                    <TableCell><Typography variant="caption">{r.factors.sleepHours}h</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 120 }}>
                      <Typography variant="caption" noWrap>{r.factors.notes || '—'}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {/* [Add] PBI-34: 詳細ポップアップを開くボタンを追加 */}
                      <Tooltip title="詳細">
                        <IconButton size="small" onClick={() => setDetailRecord(r)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
          {pagination}
        </>
      )}

      {/* [Add] PBI-34: 詳細ポップアップ */}
      {detailRecord && !editRecord && (
        <DetailDialog
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={() => { setEditRecord(detailRecord); setDetailRecord(null); }}
          onDelete={() => setDeleteTarget(detailRecord)}
        />
      )}

      {editRecord && (
        <EditDialog record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSave} />
      )}

      {/* [Refactor] PBI-14: ConfirmDialog を使用（重複のダイアログ実装を排除） */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="記録を削除しますか？"
        message={deleteTarget ? `${formatDateTime(deleteTarget.timestamp)} の記録を削除します。この操作は元に戻せません。` : ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* [Refactor] PBI-17: useSnackbar から取得した要素を配置 */}
      {snackbarEl}
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
            {/* [Add] PBI-33: 下地を追加 */}
            <Typography variant="body2">下地: {latest.cosmetics.primer || '未使用'}</Typography>
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
        // [Refactor] PBI-14: LoadingBox を使用
        <LoadingBox />
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
