// pm2 設定ファイル（Mac mini 常時稼働環境）
module.exports = {
  apps: [
    {
      name: 'skin-journal-backend',
      script: 'packages/backend/dist/index.js',
      cwd: '/path/to/SkinJournal',  // Mac mini 上の絶対パスに変更すること
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Tailscale IP をカンマ区切りで追加（例: http://100.x.x.x:3001）
        CORS_ORIGIN: 'http://localhost:5173',
        // DATA_DIR: '/path/to/SkinJournal/packages/backend/data',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'packages/backend/logs/pm2-error.log',
      out_file: 'packages/backend/logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
