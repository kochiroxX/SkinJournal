import { useRef, useState } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { NormalizedRecord, CosmeticsMaster } from '../../types';
import { CardTheme, CardSize, CARD_THEMES, COSMETIC_FIELD_LABELS } from '../../constants';
import { recordHealthScore } from '../../utils/metrics';
import ChartExportButton from '../shared/ChartExportButton';

interface Props {
  records: NormalizedRecord[];
  master: CosmeticsMaster;
  theme: CardTheme;
  size: CardSize;
}

type Category = 'toner' | 'essence' | 'lotion' | 'primer';
const CATEGORIES: Category[] = ['toner', 'essence', 'lotion', 'primer'];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_SIZES = ['2rem', '1.6rem', '1.4rem'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

export default function CosmeticsRankingCard({ records, theme, size: _size }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<Category>('toner');
  const t = CARD_THEMES[theme];

  const allScores = records.map((r) => recordHealthScore(r));
  const globalAvg = allScores.length > 0 ? allScores.reduce((s, v) => s + v, 0) / allScores.length : 50;

  const cosmeticNames = Array.from(
    new Set(records.map((r) => r.cosmetics[category]).filter(Boolean))
  );

  const ranked = cosmeticNames
    .map((name) => {
      const usedRecords = records.filter((r) => r.cosmetics[category] === name);
      const unusedRecords = records.filter((r) => r.cosmetics[category] !== name);
      if (usedRecords.length < 5) return null;
      const usedAvg = usedRecords.map((r) => recordHealthScore(r)).reduce((s, v) => s + v, 0) / usedRecords.length;
      const unusedAvg = unusedRecords.length > 0
        ? unusedRecords.map((r) => recordHealthScore(r)).reduce((s, v) => s + v, 0) / unusedRecords.length
        : globalAvg;
      const contribution = usedAvg - unusedAvg;
      return { name, contribution, usedCount: usedRecords.length };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  const podiumOrder = ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : ranked;
  const podiumIndexMap = ranked.length >= 3 ? [1, 0, 2] : [0];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <ToggleButtonGroup
          size="small"
          value={category}
          exclusive
          onChange={(_, v) => v && setCategory(v as Category)}
        >
          {CATEGORIES.map((c) => (
            <ToggleButton key={c} value={c} sx={{ fontSize: 11, px: 1, py: 0.3 }}>
              {COSMETIC_FIELD_LABELS[c]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ChartExportButton targetRef={cardRef} filename="cosmetics-ranking" />
      </Box>
      <Box
        ref={cardRef}
        sx={{
          background: t.background,
          borderRadius: 3,
          p: 3,
          border: `1px solid ${t.borderColor}`,
          minHeight: 200,
        }}
      >
        <Typography sx={{ fontSize: 12, color: t.subTextColor, mb: 2, textAlign: 'center' }}>
          {COSMETIC_FIELD_LABELS[category]} ランキング
        </Typography>

        {ranked.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography sx={{ fontSize: 14, color: t.subTextColor }}>
              データ不足（各コスメ5件以上の記録が必要）
            </Typography>
          </Box>
        )}
        {ranked.length > 0 && ranked.length < 3 && (
          <Box textAlign="center" py={3}>
            <Typography sx={{ fontSize: 14, color: t.subTextColor }}>
              ランキング表示には3種類以上必要です（現在 {ranked.length} 種類）
            </Typography>
          </Box>
        )}
        {ranked.length >= 3 && (
          <Box display="flex" alignItems="flex-end" justifyContent="center" gap={2}>
            {podiumOrder.map((item, podiumIdx) => {
              const rankIdx = podiumIndexMap[podiumIdx];
              const color = RANK_COLORS[rankIdx];
              const fontSize = RANK_SIZES[rankIdx];
              const label = RANK_LABELS[rankIdx];
              const podiumHeight = rankIdx === 0 ? 80 : rankIdx === 1 ? 60 : 50;

              return (
                <Box
                  key={item.name}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <Typography sx={{ fontSize: 10, color: t.subTextColor, mb: 0.5, textAlign: 'center' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color, fontWeight: 900 }}>{label.replace('st', '').replace('nd', '').replace('rd', '')}</Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: podiumHeight,
                      bgcolor: color,
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: fontSize, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                      {rankIdx + 1}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      border: `1px solid ${t.borderColor}`,
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      p: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 11, color: t.textColor, fontWeight: 700, wordBreak: 'break-all', lineHeight: 1.3 }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: item.contribution >= 0 ? '#4caf50' : '#f44336', fontWeight: 700, mt: 0.3 }}>
                      {item.contribution >= 0 ? '+' : ''}{item.contribution.toFixed(1)}点
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
