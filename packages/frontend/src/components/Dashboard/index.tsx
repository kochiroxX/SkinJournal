// ============================================================
// PBI-03: インタラクティブ・ダッシュボード
// ============================================================

import { useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Typography,
  Alert,
} from '@mui/material';
import PeriodSelector from './PeriodSelector';
import TrendChart from './TrendChart';
import SkinRadarChart from './SkinRadarChart';
import SnsExportButton from './SnsExportButton';
import { useSkinData } from '../../hooks/useSkinData';
import { PeriodFilter } from '../../types';

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [tab, setTab] = useState(0);
  const { records, loading, error } = useSkinData(period);
  const exportRef = useRef<HTMLDivElement>(null);

  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={3}>
        <Typography variant="h5" fontWeight={700} flex={1}>
          ダッシュボード
        </Typography>
        <PeriodSelector value={period} onChange={setPeriod} />
        <SnsExportButton targetRef={exportRef} filename="skin-journal-dashboard" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Box ref={exportRef}>
          <Grid container spacing={3}>
            {/* サマリーカード */}
            {latestRecord && (
              <>
                {[
                  { label: 'おでこ 水分', value: latestRecord.forehead.moisture },
                  { label: 'ほお 水分', value: latestRecord.cheek.moisture },
                  { label: 'おでこ 弾力', value: latestRecord.forehead.elasticity },
                  { label: 'ほお 弾力', value: latestRecord.cheek.elasticity },
                ].map(({ label, value }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Card elevation={2} sx={{ textAlign: 'center', py: 1 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color={value >= 7 ? 'success.main' : value >= 4 ? 'warning.main' : 'error.main'}
                        >
                          {value.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / 10
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </>
            )}

            {/* グラフタブ */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="推移グラフ" />
                    <Tab label="レーダーチャート（最新）" />
                  </Tabs>

                  {tab === 0 && (
                    <TrendChart records={records} />
                  )}

                  {tab === 1 && (
                    <SkinRadarChart record={latestRecord} />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* データ件数 */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                期間内のレコード数: {records.length}件
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
