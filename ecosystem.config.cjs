// pm2 設定ファイル（Mac mini 常時稼働環境 - PBI-04）
module.exports = {
  apps: [
    {
      name: 'skin-journal-backend',
      script: 'packages/backend/dist/index.js',
      cwd: '/path/to/SkinJournal',  // Mac mini 上のパスに変更すること
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_file: 'logs/pm2-combined.log',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
    },
  ],
};
