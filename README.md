# SkinJournal

肌状態をトラッキングし、BI ダッシュボードで可視化する自己完結型の肌マネジメント・システムです。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | React + Vite + TypeScript + MUI + Recharts |
| Backend | Node.js + Express + TypeScript + Winston |
| データ | Google Sheets API |
| リモートアクセス | Tailscale |
| プロセス管理 | pm2 |

## アーキテクチャ（4層構造）

```
Repository層 (GSheetLoader)      ← Google Sheets との通信
    ↓
Domain層 (DataProcessor)         ← データ正規化・3種データセット生成
    ↓
Orchestration層 (AppController)  ← API ルーティング
    ↓
Presentation層 (React + MUI)     ← UI / ダッシュボード
```

## ファイル構成

```
SkinJournal/
├── package.json                     # モノレポルート（npm workspaces）
├── .eslintrc.js                     # ESLint 設定
├── .prettierrc                      # Prettier 設定
├── .gitignore
├── ecosystem.config.cjs             # pm2 設定（Mac mini 本番環境）
├── README.md
│
├── packages/
│   ├── backend/                     # Node.js + Express サーバー
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example             # 環境変数テンプレート
│   │   └── src/
│   │       ├── index.ts             # エントリーポイント（Express起動）
│   │       ├── types/
│   │       │   └── index.ts         # 全型定義（SkinMetrics, NormalizedRecord など）
│   │       ├── repository/
│   │       │   └── GSheetLoader.ts  # Repository層: Google Sheets API 通信
│   │       ├── domain/
│   │       │   └── DataProcessor.ts # Domain層: 正規化・3種データセット生成
│   │       ├── orchestration/
│   │       │   └── AppController.ts # Orchestration層: API ルーティング
│   │       └── utils/
│   │           └── logger.ts        # Winston ロガー
│   │
│   └── frontend/                    # React + Vite + MUI
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts           # Vite設定（APIプロキシ・コードスプリット）
│       ├── index.html
│       ├── public/
│       │   └── favicon.svg
│       └── src/
│           ├── main.tsx             # エントリーポイント
│           ├── App.tsx              # MUIテーマ・ルーティング定義
│           ├── types/
│           │   └── index.ts         # Frontend 型定義
│           ├── hooks/
│           │   └── useSkinData.ts   # データ取得・送信カスタムフック
│           └── components/
│               ├── Layout/
│               │   └── index.tsx    # レスポンシブレイアウト（Drawer + AppBar）
│               ├── InputForm/       # PBI-01: 高機能入力フォーム
│               │   ├── index.tsx    # フォーム全体・送信ロジック
│               │   ├── SkinMetricsInput.tsx   # 肌指標スライダー
│               │   ├── CosmeticsSelector.tsx  # 化粧品マスタ選択
│               │   └── ExternalFactorsInput.tsx # ライフログ入力
│               ├── Dashboard/       # PBI-03: インタラクティブ・ダッシュボード
│               │   ├── index.tsx    # サマリーカード・タブ切り替え
│               │   ├── TrendChart.tsx          # 推移グラフ（Recharts）
│               │   ├── SkinRadarChart.tsx       # レーダーチャート（最新肌状態）
│               │   ├── PeriodSelector.tsx       # 期間トグル（週/月/全期間）
│               │   └── SnsExportButton.tsx      # SNS用画像書き出し
│               └── DataTable/       # PBI-02: データテーブルビュー
│                   └── index.tsx    # 正規化済みデータ一覧・データセット概要
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Cloud 設定

1. Google Cloud Console で Sheets API を有効化
2. サービスアカウントを作成し、`credentials.json` をダウンロード
3. `packages/backend/` に `credentials.json` を配置
4. 対象スプレッドシートをサービスアカウントのメールアドレスと共有

### 3. 環境変数の設定

```bash
cp packages/backend/.env.example packages/backend/.env
# .env を編集して SPREADSHEET_ID などを設定
```

### 4. スプレッドシートの列構成

| 列 | 内容 |
|---|---|
| A | タイムスタンプ |
| B | おでこ・白さ |
| C | おでこ・水分 |
| D | おでこ・油分 |
| E | おでこ・弾力 |
| F | ほお・白さ |
| G | ほお・水分 |
| H | ほお・油分 |
| I | ほお・弾力 |
| J | 化粧水 |
| K | 美容液 |
| L | 乳液 |
| M | 出張（TRUE/FALSE） |
| N | 飲酒（TRUE/FALSE） |
| O | 睡眠時間 |
| P | メモ |

## 開発環境の起動

```bash
# バックエンド・フロントエンド同時起動
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 本番環境（Mac mini + pm2）

```bash
# ビルド
npm run build

# pm2 で起動
pm2 start ecosystem.config.cjs

# 起動確認
pm2 status
pm2 logs skin-journal-backend
```

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/records?period=week\|month\|all` | 正規化済みレコード一覧 |
| GET | `/api/datasets` | 3種データセット |
| GET | `/api/latest` | 最新レコードと平均スコア |
| POST | `/api/entry` | 新規エントリ保存 |
| GET | `/api/cosmetics-master` | 化粧品マスタ |
| GET | `/health` | ヘルスチェック |

## Git 運用ルール

- Branch: `feature/pbi-XX-description` → Develop → Main
- Commit prefix: `[Add]` `[Fix]` `[Update]` `[Docs]`
