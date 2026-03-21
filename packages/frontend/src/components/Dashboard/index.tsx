// ============================================================
// PBI-03: インタラクティブ・ダッシュボード
// ============================================================

import { useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Typography,
  Alert,
} from '@mui/material';
// [Refactor] PBI-14: CircularProgress は LoadingBox 内に移動したためここでは不要
import PeriodSelector from './PeriodSelector';
import TrendChart from './TrendChart';
import SkinRadarChart from './SkinRadarChart';
import CosmeticsChart from './CosmeticsChart';
import FactorsChart from './FactorsChart';
import SnsExportButton from './SnsExportButton';
// [Refactor] PBI-14: 共有コンポーネントを使用
import LoadingBox from '../shared/LoadingBox';
import PageHeader from '../shared/PageHeader';
import { useSkinData } from '../../hooks/useSkinData';
import { PeriodFilter } from '../../types';
import { SCALE_MAX, getScoreColor } from '../../constants';

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [tab, setTab] = useState(0);
  const { records, loading, error } = useSkinData(period);
  const exportRef = useRef<HTMLDivElement>(null);

  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <Box>
      {/* [Refactor] PBI-14: PageHeader を使用（タイトル + 右揃えコントロールの重複レイアウトを排除） */}
      <PageHeader
        title="ダッシュボード"
        actions={
          <>
            <PeriodSelector value={period} onChange={setPeriod} />
            <SnsExportButton targetRef={exportRef} filename="skin-journal-dashboard" />
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        // [Refactor] PBI-14: LoadingBox を使用
        <LoadingBox />
      ) : (
        <Box ref={exportRef}>
          <Grid container spacing={3}>
            {/* サマリーカード */}
            {latestRecord && (
              <>
                {[
                  { label: 'おでこ 水分量', value: latestRecord.forehead.moisture },
                  { label: 'ほお 水分量', value: latestRecord.cheek.moisture },
                  { label: 'おでこ 弾性力', value: latestRecord.forehead.elasticity },
                  { label: 'ほお 弾性力', value: latestRecord.cheek.elasticity },
                ].map(({ label, value }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Card elevation={0} sx={{ textAlign: 'center', py: 1 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color={`${getScoreColor(value)}.main`}
                        >
                          {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / {SCALE_MAX}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </>
            )}

            {/* グラフタブ */}
            <Grid item xs={12}>
              <Card elevation={0}>
                <CardContent>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="推移グラフ" />
                    <Tab label="レーダーチャート（最新）" />
                    <Tab label="化粧品比較" />
                    <Tab label="外部要因分析" />
                  </Tabs>

                  {tab === 0 && <TrendChart records={records} />}
                  {tab === 1 && <SkinRadarChart record={latestRecord} />}
                  {tab === 2 && <CosmeticsChart records={records} />}
                  {tab === 3 && <FactorsChart records={records} />}
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
