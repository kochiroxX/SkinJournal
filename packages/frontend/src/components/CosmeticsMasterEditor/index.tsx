// ============================================================
// 化粧品マスタ編集画面（メーカー / 品名 / 使用期間管理）
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { CosmeticItem, CosmeticsMaster, getItemStatus } from '../../types';

type Category = keyof CosmeticsMaster;

const CATEGORY_CONFIG: { key: Category; label: string }[] = [
  { key: 'toners',   label: '化粧水' },
  { key: 'essences', label: '美容液' },
  { key: 'lotions',  label: '乳液'  },
];

const STATUS_CHIP: Record<'active' | 'upcoming' | 'expired', { label: string; color: 'success' | 'default' | 'warning' }> = {
  active:   { label: '使用中',   color: 'success' },
  upcoming: { label: '使用前',   color: 'warning' },
  expired:  { label: '使用終了', color: 'default' },
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return iso.replace(/-/g, '/');
}

// ── アイテム追加フォーム ──────────────────────────────────────
function AddItemForm({ onAdd }: { onAdd: (item: CosmeticItem) => void }) {
  const [maker, setMaker]         = useState('');
  const [name, setName]           = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onAdd({
      id: generateId(),
      maker: maker.trim(),
      name: trimmedName,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setMaker('');
    setName('');
    setStartDate('');
    setEndDate('');
    nameRef.current?.focus();
  };

  return (
    <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end" mb={2}>
      <TextField
        size="small"
        label="メーカー"
        placeholder="例: SKII"
        value={maker}
        onChange={(e) => setMaker(e.target.value)}
        sx={{ width: 160 }}
      />
      <TextField
        inputRef={nameRef}
        size="small"
        label="品名 *"
        placeholder="例: フェイシャル トリートメント"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ flex: 1, minWidth: 180 }}
      />
      <TextField
        size="small"
        type="date"
        label="使用開始"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 155 }}
      />
      <TextField
        size="small"
        type="date"
        label="使用終了"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 155 }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        disabled={!name.trim()}
        sx={{ height: 40 }}
      >
        追加
      </Button>
    </Box>
  );
}

// ── 編集可能な行 ──────────────────────────────────────────────
function EditableRow({
  item,
  prevMaker,
  onUpdate,
  onDelete,
}: {
  item: CosmeticItem;
  prevMaker: string | null;
  onUpdate: (updated: CosmeticItem) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftMaker, setDraftMaker]       = useState(item.maker);
  const [draftName, setDraftName]         = useState(item.name);
  const [draftStart, setDraftStart]       = useState(item.startDate ?? '');
  const [draftEnd, setDraftEnd]           = useState(item.endDate ?? '');

  const handleConfirm = () => {
    if (!draftName.trim()) return;
    onUpdate({
      ...item,
      maker: draftMaker.trim(),
      name: draftName.trim(),
      startDate: draftStart || undefined,
      endDate: draftEnd || undefined,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraftMaker(item.maker);
    setDraftName(item.name);
    setDraftStart(item.startDate ?? '');
    setDraftEnd(item.endDate ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <TableRow sx={{ bgcolor: 'grey.50' }}>
        <TableCell>
          <TextField size="small" value={draftMaker} onChange={(e) => setDraftMaker(e.target.value)} placeholder="メーカー" sx={{ width: 140 }} />
        </TableCell>
        <TableCell>
          <TextField size="small" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="品名" fullWidth autoFocus />
        </TableCell>
        <TableCell>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            <TextField size="small" type="date" label="開始" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
            <TextField size="small" type="date" label="終了" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
          </Box>
        </TableCell>
        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="確定">
            <IconButton size="small" color="primary" onClick={handleConfirm} disabled={!draftName.trim()}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="キャンセル">
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>

        {/* 削除確認ダイアログ */}
        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <DialogTitle>削除の確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              「{item.maker ? `${item.maker} / ` : ''}{item.name}」を削除しますか？この操作は元に戻せません。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(false)}>キャンセル</Button>
            <Button color="error" variant="contained" onClick={() => { setConfirmDelete(false); onDelete(item.id); }}>
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </TableRow>
    );
  }

  const status = getItemStatus(item);
  const showMaker = prevMaker !== item.maker;

  return (
    <TableRow hover sx={{ opacity: status === 'expired' ? 0.6 : 1 }}>
      <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>
        {showMaker ? (item.maker || '—') : ''}
      </TableCell>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
          <Chip
            label={STATUS_CHIP[status].label}
            color={STATUS_CHIP[status].color}
            size="small"
            sx={{ height: 18, fontSize: 11 }}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {formatDate(item.startDate)} 〜 {formatDate(item.endDate)}
      </TableCell>
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="編集">
          <IconButton size="small" onClick={() => setEditing(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ── カテゴリ別テーブル ────────────────────────────────────────
function CategoryTable({
  items,
  onUpdate,
  onDelete,
}: {
  items: CosmeticItem[];
  onUpdate: (updated: CosmeticItem) => void;
  onDelete: (id: string) => void;
}) {
  // 使用中 → 使用前 → 使用終了、同グループ内はメーカー・品名順
  const statusOrder = { active: 0, upcoming: 1, expired: 2 };
  const sorted = [...items].sort(
    (a, b) =>
      statusOrder[getItemStatus(a)] - statusOrder[getItemStatus(b)] ||
      (a.maker || '').localeCompare(b.maker || '', 'ja') ||
      a.name.localeCompare(b.name, 'ja')
  );

  if (sorted.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        アイテムがありません
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
            <TableCell width={160}>メーカー</TableCell>
            <TableCell>品名</TableCell>
            <TableCell width={200}>使用期間</TableCell>
            <TableCell width={96} align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((item, i) => (
            <EditableRow
              key={item.id}
              item={item}
              prevMaker={i > 0 ? sorted[i - 1].maker : null}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── メインコンポーネント ──────────────────────────────────────
export default function CosmeticsMasterEditor() {
  const [master, setMaster] = useState<CosmeticsMaster>({ toners: [], essences: [], lotions: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetch('/api/cosmetics-master')
      .then((r) => r.json())
      .then((res) => { if (res.data) setMaster(res.data); })
      .catch(() => setSnackbar({ open: true, message: 'マスタの読み込みに失敗しました', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updated: CosmeticsMaster) => {
    try {
      const res = await fetch('/api/cosmetics-master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      setSnackbar({ open: true, message: '保存しました', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: '保存に失敗しました', severity: 'error' });
    }
  };

  const currentCategory = CATEGORY_CONFIG[tab].key;

  const handleAdd = (item: CosmeticItem) => {
    const updated = { ...master, [currentCategory]: [...master[currentCategory], item] };
    setMaster(updated);
    persist(updated);
  };

  const handleUpdate = (updatedItem: CosmeticItem) => {
    const updated = {
      ...master,
      [currentCategory]: master[currentCategory].map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    };
    setMaster(updated);
    persist(updated);
  };

  const handleDelete = (id: string) => {
    const updated = {
      ...master,
      [currentCategory]: master[currentCategory].filter((item) => item.id !== id),
    };
    setMaster(updated);
    persist(updated);
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>化粧品マスタ編集</Typography>
        <Typography variant="body2" color="text.secondary">
          入力フォームで選択できる化粧品をメーカー・品名・使用期間で管理します
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {CATEGORY_CONFIG.map((cat) => (
                <Tab
                  key={cat.key}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      {cat.label}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ bgcolor: 'primary.light', color: 'primary.dark', px: 0.8, borderRadius: 10, fontWeight: 700 }}
                      >
                        {master[cat.key].length}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              <AddItemForm onAdd={handleAdd} />
              <Divider sx={{ mb: 2 }} />
              <CategoryTable
                items={master[currentCategory]}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
