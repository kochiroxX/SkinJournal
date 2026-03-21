// ============================================================
// 肌データ取得・操作フック
// ============================================================

// [Refactor] PBI-17: 各関数の fetch を lib/api.ts に委譲し、
// Content-Type 設定・レスポンス検証・エラー処理の重複を排除した。

import { useState, useEffect, useCallback } from 'react';
import {
  NormalizedRecord,
  CosmeticsMaster,
  SkinEntryInput,
  PeriodFilter,
} from '../types';
import { api } from '../lib/api';

export function useSkinData(period: PeriodFilter = 'all') {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<NormalizedRecord[]>(`/records?period=${period}`);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ取得エラー');
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
    api
      .get<CosmeticsMaster>('/cosmetics-master')
      .then(setMaster)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { master, loading };
}

export async function submitEntry(entry: SkinEntryInput): Promise<void> {
  await api.post<null>('/entry', entry);
}

export async function updateRecord(timestamp: string, entry: SkinEntryInput): Promise<void> {
  await api.put<null>(`/records/${encodeURIComponent(timestamp)}`, entry);
}

export async function deleteRecord(timestamp: string): Promise<void> {
  await api.delete<null>(`/records/${encodeURIComponent(timestamp)}`);
}
