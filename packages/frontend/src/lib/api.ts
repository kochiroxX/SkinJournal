// ============================================================
// [Refactor] PBI-17: APIクライアント抽象化
// useSkinData.ts と CosmeticsMasterEditor で fetch が直接呼ばれており、
// Content-Type 設定・レスポンス検証・エラー処理が重複していたため一元化。
// ============================================================

import { ApiResponse } from '../types';

const API_BASE = '/api';

// [Refactor] 共通の fetch ラッパー。成功時は data を返し、失敗時は Error を throw する
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'APIエラーが発生しました');
  return json.data as T;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = {
  get: <T>(path: string) =>
    request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
