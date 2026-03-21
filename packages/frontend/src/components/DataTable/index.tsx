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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import { useSkinData } from '../../hooks/useSkinData';
import { NormalizedRecord, SkinMetrics } from '../../types';

// スコアに応じた色付き表示
function ScoreChip({ value }: { value: number }) {
  const color = value >= 7 ? 'success' : value >= 4 ? 'warning' : 'error';
  return (
    <Chip
      label={value.toFixed(1)}
      color={color}
      size="small"
      sx={{ fontWeight: 700, minWidth: 48 }}
    />
  );
}

function MetricsCell({ metrics }: { metrics: SkinMetrics }) {
  return (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      <Tooltip title="白さ">
        <Chip label={`白:${metrics.tone}`} size="small" variant="outlined" />
      </Tooltip>
      <Tooltip title="水分">
        <Chip label={`水:${metrics.moisture}`} size="small" variant="outlined" sx={{ borderColor: '#2196f3', color: '#2196f3' }} />
      </Tooltip>
      <Tooltip title="油分">
        <Chip label={`油:${metrics.oil}`} size="small" variant="outlined" sx={{ borderColor: '#ff9800', color: '#ff9800' }} />
      </Tooltip>
      <Tooltip title="弾力">
        <Chip label={`弾:${metrics.elasticity}`} size="small" variant="outlined" sx={{ borderColor: '#4caf50', color: '#4caf50' }} />
      </Tooltip>
    </Box>
  );
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckCircleIcon fontSize="small" color="success" />
  ) : (
    <CancelIcon fontSize="small" color="disabled" />
  );
}

// 正規化済みデータのテーブル
function NormalizedTable({ records }: { records: NormalizedRecord[] }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginated = [...records]
    .reverse()
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {new Date(r.timestamp).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <MetricsCell metrics={r.forehead} />
                </TableCell>
                <TableCell>
                  <MetricsCell metrics={r.cheek} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.cosmetics.toner || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.cosmetics.essence || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.cosmetics.lotion || '—'}</Typography>
                </TableCell>
                <TableCell align="center">
                  <BoolIcon value={r.factors.businessTrip} />
                </TableCell>
                <TableCell align="center">
                  <BoolIcon value={r.factors.alcohol} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.factors.sleepHours}h</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 120 }}>
                  <Typography variant="caption" noWrap>
                    {r.factors.notes || '—'}
                  </Typography>
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
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="表示件数:"
      />
    </>
  );
}

// データセット別サマリー
function DatasetSummary({ records }: { records: NormalizedRecord[] }) {
  if (records.length === 0) {
    return <Typography color="text.secondary">データがありません</Typography>;
  }

  const latest = records[records.length - 1];

  const avgMetric = (key: keyof NormalizedRecord['forehead'], area: 'forehead' | 'cheek') =>
    (records.reduce((s, r) => s + r[area][key], 0) / records.length).toFixed(2);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        データセット概要（全 {records.length} 件）
      </Typography>

      <Box display="flex" gap={4} flexWrap="wrap" mt={2}>
        {/* 肌状態データセット */}
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            肌状態データセット
          </Typography>
          <Box mt={1}>
            {(['tone', 'moisture', 'oil', 'elasticity'] as const).map((key) => (
              <Box key={key} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">
                  {key === 'tone' ? '白さ' : key === 'moisture' ? '水分' : key === 'oil' ? '油分' : '弾力'} (平均)
                </Typography>
                <Box display="flex" gap={1}>
                  <ScoreChip value={parseFloat(avgMetric(key, 'forehead'))} />
                  <ScoreChip value={parseFloat(avgMetric(key, 'cheek'))} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 使用化粧品データセット */}
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            使用化粧品データセット（最新）
          </Typography>
          <Box mt={1}>
            <Typography variant="body2">化粧水: {latest.cosmetics.toner || '未使用'}</Typography>
            <Typography variant="body2">美容液: {latest.cosmetics.essence || '未使用'}</Typography>
            <Typography variant="body2">乳液: {latest.cosmetics.lotion || '未使用'}</Typography>
          </Box>
        </Box>

        {/* 外部要因データセット */}
        <Box flex={1} minWidth={200}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            外部要因データセット（統計）
          </Typography>
          <Box mt={1}>
            <Typography variant="body2">
              出張率: {((records.filter((r) => r.factors.businessTrip).length / records.length) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2">
              飲酒率: {((records.filter((r) => r.factors.alcohol).length / records.length) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2">
              平均睡眠: {(records.reduce((s, r) => s + r.factors.sleepHours, 0) / records.length).toFixed(1)}時間
            </Typography>
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
  const { records, loading, error } = useSkinData('all');
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>
          データビュー
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleCsvDownload}
        >
          CSV ダウンロード
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        記録したデータを確認・CSV形式でダウンロードできます
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Card elevation={0}>
          <CardContent>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="正規化済みデータ一覧" />
              <Tab label="データセット概要" />
            </Tabs>

            {tab === 0 && <NormalizedTable records={records} />}
            {tab === 1 && <DatasetSummary records={records} />}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
