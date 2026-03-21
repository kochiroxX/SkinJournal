// ============================================================
// SNS投稿用画像書き出し機能 (html-to-image)
// ============================================================

import { useState } from 'react';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { toPng } from 'html-to-image';

interface Props {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
}

const SNS_PRESETS = [
  { label: 'Instagram (1:1) 1080×1080', width: 1080, height: 1080 },
  { label: 'Twitter/X (16:9) 1280×720', width: 1280, height: 720 },
  { label: 'Instagram Story (9:16) 1080×1920', width: 1080, height: 1920 },
];

export default function SnsExportButton({ targetRef, filename = 'skin-journal' }: Props) {
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleExport = async (width: number, height: number) => {
    if (!targetRef.current) return;
    setAnchorEl(null);
    setLoading(true);

    try {
      const dataUrl = await toPng(targetRef.current, {
        width,
        height,
        style: { transform: `scale(${width / targetRef.current.offsetWidth})`, transformOrigin: 'top left' },
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${filename}_${width}x${height}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={loading}
      >
        SNS用画像を保存
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {SNS_PRESETS.map((preset) => (
          <MenuItem key={preset.label} onClick={() => handleExport(preset.width, preset.height)}>
            {preset.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
