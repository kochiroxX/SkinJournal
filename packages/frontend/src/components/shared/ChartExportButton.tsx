// ============================================================
// [Add] PBI-43: グラフ個別ダウンロード・クリップボードコピーボタン
// 各グラフカードに取り付ける共有コンポーネント。
// - ダウンロード: PNG をローカル保存
// - コピー: PNG をクリップボードにコピー（非対応ブラウザはダウンロードにフォールバック）
// SnsExportButton（ダッシュボード全体書き出し）の代替として個別グラフに配置する。
// ============================================================

import { useState } from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { toPng } from 'html-to-image';

interface Props {
  /** エクスポート対象要素の ref */
  targetRef: React.RefObject<HTMLElement>;
  /** ダウンロード時のファイル名（拡張子なし） */
  filename?: string;
}

export default function ChartExportButton({ targetRef, filename = 'skin-journal-chart' }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);

  const capture = async (): Promise<string | null> => {
    if (!targetRef.current) return null;
    return toPng(targetRef.current, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;

      // Clipboard API でコピーを試みる
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        // 非対応ブラウザはダウンロードにフォールバック
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Box display="flex" gap={0.5}>
      <Tooltip title="クリップボードにコピー">
        <span>
          <IconButton
            size="small"
            onClick={handleCopy}
            disabled={copying || downloading}
            sx={{ color: 'text.secondary' }}
          >
            {copying ? <CircularProgress size={16} /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="PNG ダウンロード">
        <span>
          <IconButton
            size="small"
            onClick={handleDownload}
            disabled={downloading || copying}
            sx={{ color: 'text.secondary' }}
          >
            {downloading ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
