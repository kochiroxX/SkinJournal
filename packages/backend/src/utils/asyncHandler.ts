// ============================================================
// [Refactor] PBI-19: バックエンドリファクタリング
// AppController の全ルートハンドラで同一の try-catch パターンが
// 10箇所以上繰り返されていたため、HOF（高階関数）としてラップして排除。
// ============================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * async ルートハンドラを包んで、未処理の Promise rejection を
 * Express の next(err) に転送する。
 * エラーハンドリングミドルウェア（index.ts）で一元処理される。
 */
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
