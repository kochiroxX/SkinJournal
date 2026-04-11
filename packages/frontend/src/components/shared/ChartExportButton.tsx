// ============================================================
// [Add] PBI-43: グラフ個別ダウンロード・クリップボードコピーボタン
// 各グラフカードに取り付ける共有コンポーネント。
// - ダウンロード: PNG をローカル保存
// - コピー: PNG をクリップボードにコピー（非対応ブラウザはダウンロードにフォールバック）
// SnsExportButton（ダッシュボード全体書き出し）の代替として個別グラフに配置する。
// [Fix] エクスポート失敗時にアイコンを赤くしてユーザーに通知する。
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { toPng } from 'html-to-image';

interface Props {
  /** エクスポート対象要素の ref */
  targetRef: React.RefObject<HTMLElement>;
  /** ダウンロード時のファイル名（拡張子なし） */
  filename?: string;
}

type ButtonState = 'idle' | 'loading' | 'error';

export default function ChartExportButton({ targetRef, filename = 'skin-journal-chart' }: Props) {
  const [downloadState, setDownloadState] = useState<ButtonState>('idle');
  const [copyState, setCopyState]         = useState<ButtonState>('idle');

  // アンマウント時にタイマーをクリアしてメモリリークを防ぐ
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);
      if (copyTimerRef.current)     clearTimeout(copyTimerRef.current);
    };
  }, []);

  const capture = async (): Promise<string | null> => {
    if (!targetRef.current) return null;
    return toPng(targetRef.current, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
  };

  const handleDownload = async () => {
    setDownloadState('loading');
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadState('idle');
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadState('error');
      // [Fix] 3秒後にアイコンをリセット
      downloadTimerRef.current = setTimeout(() => setDownloadState('idle'), 3000);
    }
  };

  const handleCopy = async () => {
    setCopyState('loading');
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;

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
      setCopyState('idle');
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyState('error');
      // [Fix] 3秒後にアイコンをリセット
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  const copyLabel =
    copyState === 'error' ? 'コピーに失敗しました' : 'クリップボードにコピー';
  const downloadLabel =
    downloadState === 'error' ? 'ダウンロードに失敗しました' : 'PNG ダウンロード';

  return (
    <Box display="flex" gap={0.5}>
      <Tooltip title={copyLabel}>
        <span>
          <IconButton
            size="small"
            onClick={handleCopy}
            disabled={copyState === 'loading' || downloadState === 'loading'}
            sx={{ color: copyState === 'error' ? 'error.main' : 'text.secondary' }}
          >
            {copyState === 'loading' ? (
              <CircularProgress size={16} />
            ) : copyState === 'error' ? (
              <ErrorOutlineIcon fontSize="small" />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={downloadLabel}>
        <span>
          <IconButton
            size="small"
            onClick={handleDownload}
            disabled={downloadState === 'loading' || copyState === 'loading'}
            sx={{ color: downloadState === 'error' ? 'error.main' : 'text.secondary' }}
          >
            {downloadState === 'loading' ? (
              <CircularProgress size={16} />
            ) : downloadState === 'error' ? (
              <ErrorOutlineIcon fontSize="small" />
            ) : (
              <DownloadIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
