// ============================================================
// [Add] #57 #60: SnsPage 週次/月次モード・分析タブ追加
// ============================================================

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
// 既存コンポーネント
import LoadingBox from '../shared/LoadingBox';
import PageHeader from '../shared/PageHeader';
import EmptyStateBox from '../shared/EmptyStateBox';
// 分析タブ用（Dashboard からimport）
import CosmeticsRadarChart from '../Dashboard/CosmeticsRadarChart';
import FactorsRadarChart from '../Dashboard/FactorsRadarChart';
// SnsPage カード
import PeriodSummaryCard from './PeriodSummaryCard';
import PeriodTrendChart from './PeriodTrendChart';
import CombinedBeforeAfterCard from './CombinedBeforeAfterCard';
import CosmeticsRankingCard from './CosmeticsRankingCard';
import FactorsInsightCard from './FactorsInsightCard';
import CompactCalendarHeatmap from './CompactCalendarHeatmap';
// フック・ユーティリティ
import { useSkinData, useCosmeticsMaster } from '../../hooks/useSkinData';
import { useNotifications } from '../../hooks/useNotifications';
import { CardTheme, CardSize, CARD_THEMES, CARD_SIZES } from '../../constants';
import { getPrevWeekRange, getPrevMonthRange, filterByDateRange } from '../../utils/dateRange';

export default function SnsPage() {
  const [mainTab, setMainTab] = useState<number>(0);
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const [theme, setTheme] = useState<CardTheme>('pastel');
  const [size, setSize] = useState<CardSize>('square');

  const { records: allRecords, loading, error } = useSkinData('all');
  const { master } = useCosmeticsMaster();
  const { requestPermission, permission } = useNotifications(allRecords);

  const range = mode === 'weekly' ? getPrevWeekRange() : getPrevMonthRange();
  const filteredRecords = filterByDateRange(allRecords, range.start, range.end);

  // 前期間のレコード（比較用）
  const prevRange =
    mode === 'weekly'
      ? {
          start: new Date(range.start.getTime() - 7 * 86400000),
          end: new Date(range.end.getTime() - 7 * 86400000),
        }
      : {
          start: new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1),
          end: new Date(range.start.getTime() - 1),
        };
  const prevRecords = filterByDateRange(allRecords, prevRange.start, prevRange.end);

  return (
    <Box>
      <PageHeader title="SNS出力" subtitle="肌ケアの記録をSNSでシェアしましょう" />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* メインタブ */}
      <Tabs
        value={mainTab}
        onChange={(_: unknown, v: number) => setMainTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="SNS出力" />
        <Tab label="分析ツール" />
      </Tabs>

      {loading ? (
        <LoadingBox />
      ) : (
        <>
          {/* ── SNS出力タブ ── */}
          {mainTab === 0 && (
            <Box>
              {/* コントロールバー */}
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={mode}
                  onChange={(_: unknown, v: 'weekly' | 'monthly' | null) => {
                    if (v) setMode(v);
                  }}
                >
                  <ToggleButton value="weekly">週次</ToggleButton>
                  <ToggleButton value="monthly">月次</ToggleButton>
                </ToggleButtonGroup>

                {/* テーマ選択 */}
                <Box display="flex" gap={0.5}>
                  {(Object.entries(CARD_THEMES) as [CardTheme, typeof CARD_THEMES[CardTheme]][]).map(
                    ([key, t]) => (
                      <Chip
                        key={key}
                        label={t.label}
                        size="small"
                        onClick={() => setTheme(key)}
                        variant={theme === key ? 'filled' : 'outlined'}
                        sx={{ bgcolor: theme === key ? t.chipColor : undefined, fontSize: 11 }}
                      />
                    )
                  )}
                </Box>

                {/* サイズ選択 */}
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={size}
                  onChange={(_: unknown, v: CardSize | null) => {
                    if (v) setSize(v);
                  }}
                >
                  {(Object.entries(CARD_SIZES) as [CardSize, typeof CARD_SIZES[CardSize]][]).map(
                    ([key, s]) => (
                      <ToggleButton key={key} value={key} sx={{ fontSize: 11 }}>
                        {s.icon} {s.label}
                      </ToggleButton>
                    )
                  )}
                </ToggleButtonGroup>

                {/* 通知許可ボタン */}
                {permission === 'default' && (
                  <Button
                    size="small"
                    startIcon={<NotificationsNoneIcon />}
                    onClick={requestPermission}
                    variant="outlined"
                  >
                    通知を許可
                  </Button>
                )}
              </Box>

              {/* 期間ラベル */}
              <Typography variant="body2" color="text.secondary" mb={2}>
                {mode === 'weekly' ? '前週' : '前月'}: {range.label}
              </Typography>

              {filteredRecords.length === 0 ? (
                <EmptyStateBox message={`${range.label} の期間にデータがありません`} />
              ) : (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* サマリーカード */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                          サマリー
                        </Typography>
                        <PeriodSummaryCard
                          records={filteredRecords}
                          prevRecords={prevRecords}
                          label={range.label}
                          mode={mode}
                          theme={theme}
                          size={size}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 推移グラフ */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                          推移グラフ
                        </Typography>
                        <PeriodTrendChart
                          records={filteredRecords}
                          period={mode}
                          theme={theme}
                          size={size}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 複合BeforeAfter */}
                  <Grid item xs={12}>
                    <Card elevation={0}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                          肌変化レポート（週・月・3ヶ月）
                        </Typography>
                        <CombinedBeforeAfterCard records={allRecords} theme={theme} size={size} />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* ── 分析ツールタブ ── */}
          {mainTab === 1 && (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      コスメランキング
                    </Typography>
                    <CosmeticsRankingCard
                      records={allRecords}
                      master={master}
                      theme="minimal"
                      size="square"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      生活習慣インサイト
                    </Typography>
                    <FactorsInsightCard records={allRecords} theme="minimal" size="square" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      コスメ比較レーダー
                    </Typography>
                    <CosmeticsRadarChart records={allRecords} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      生活習慣比較レーダー
                    </Typography>
                    <FactorsRadarChart records={allRecords} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      90日カレンダー
                    </Typography>
                    <CompactCalendarHeatmap records={allRecords} theme="minimal" size="square" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
