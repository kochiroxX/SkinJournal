import { useState, useEffect, useCallback } from 'react';
import {
  NormalizedRecord,
  CosmeticsMaster,
  SkinEntryInput,
  PeriodFilter,
  ApiResponse,
} from '../types';

const API_BASE = '/api';

export function useSkinData(period: PeriodFilter = 'all') {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/records?period=${period}`);
      const json: ApiResponse<NormalizedRecord[]> = await res.json();
      if (json.success && json.data) {
        setRecords(json.data);
      } else {
        setError(json.error ?? 'データ取得エラー');
      }
    } catch {
      setError('サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export function useCosmeticsMaster() {
  const [master, setMaster] = useState<CosmeticsMaster>({
    toners: [],
    essences: [],
    lotions: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/cosmetics-master`)
      .then((res) => res.json())
      .then((json: ApiResponse<CosmeticsMaster>) => {
        if (json.success && json.data) setMaster(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { master, loading };
}

export async function submitEntry(entry: SkinEntryInput): Promise<void> {
  const res = await fetch(`${API_BASE}/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  const json: ApiResponse<null> = await res.json();
  if (!json.success) throw new Error(json.error ?? '保存に失敗しました');
}

export async function updateRecord(timestamp: string, entry: SkinEntryInput): Promise<void> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(timestamp)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  const json: ApiResponse<null> = await res.json();
  if (!json.success) throw new Error(json.error ?? '更新に失敗しました');
}

export async function deleteRecord(timestamp: string): Promise<void> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(timestamp)}`, {
    method: 'DELETE',
  });
  const json: ApiResponse<null> = await res.json();
  if (!json.success) throw new Error(json.error ?? '削除に失敗しました');
}
