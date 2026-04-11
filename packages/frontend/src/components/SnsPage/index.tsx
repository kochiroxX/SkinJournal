// ============================================================
// [Add] PBI-37: SNS出力用画面（Twitter 最適化レイアウト）
// [Add] PBI-38: 生成AI向けプロンプト生成
// ============================================================

import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  OutlinedInput,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpaIcon from '@mui/icons-material/Spa';
import SkinRadarChart from '../Dashboard/SkinRadarChart';
import TrendChart from '../Dashboard/TrendChart';
import CalendarHeatmap from '../Dashboard/CalendarHeatmap';
import LoadingBox from '../shared/LoadingBox';
import PageHeader from '../shared/PageHeader';
import ChartExportButton from '../shared/ChartExportButton';
import { useSkinData } from '../../hooks/useSkinData';
import { NormalizedRecord, SkinMetrics } from '../../types';
import { formatFullDate } from '../../utils/format';
import { METRIC_COLORS, METRIC_LABELS, SCALE_MAX } from '../../constants';

// ============================================================
// スコアに応じた色・ラベルを返すユーティリティ
// ============================================================
function scoreColor(v: number): string {
  if (v >= 75) return '#4caf50';
  if (v >= 55) return '#ff9800';
  return '#e91e63';
}
function scoreLabel(avg: number): string {
  if (avg >= 80) return '絶好調 ✨';
  if (avg >= 65) return '良好 💪';
  if (avg >= 50) return 'まずまず 🌿';
  return 'ケア強化 🌙';
}

// ============================================================
// [Add] PBI-38: 生成AI向けプロンプト生成
// ChatGPT / Claude 等に貼り付けてSNS投稿文を作成させるためのプロンプト
// ============================================================
function generateAiPrompt(record: NormalizedRecord): string {
  const date = formatFullDate(record.timestamp);
  const avg = Math.round(
    (record.forehead.tone + record.forehead.moisture + record.forehead.oil + record.forehead.elasticity +
     record.cheek.tone + record.cheek.moisture + record.cheek.oil + record.cheek.elasticity) / 8
  );

  const cosmeticSection = [
    record.cosmetics.toner   && `　化粧水: ${record.cosmetics.toner}`,
    record.cosmetics.essence && `　美容液: ${record.cosmetics.essence}`,
    record.cosmetics.lotion  && `　乳液: ${record.cosmetics.lotion}`,
    record.cosmetics.primer  && `　下地: ${record.cosmetics.primer}`,
  ].filter(Boolean);

  // [Fix] sleepHours === 0 は falsy のため !== undefined で判定する
  const lifelogSection = [
    record.factors.sleepHours !== undefined && record.factors.sleepHours > 0 && `　睡眠: ${record.factors.sleepHours}時間`,
    record.factors.businessTrip && '　出張あり',
    record.factors.alcohol && '　飲酒あり',
  ].filter(Boolean) as string[];

  return [
    'あなたはSNS投稿の文章作成アシスタントです。',
    '以下の肌ケア記録データをもとに、Twitter（X）への投稿文を作成してください。',
    '',
    '【要件】',
    '・前向きで共感を呼ぶトーン',
    '・絵文字を適度に使用',
    '・140文字以内（日本語）',
    '・関連ハッシュタグを末尾に3〜5個追加',
    '・数値をそのまま羅列せず、感想・体験として語りかける文章にする',
    '・「SkinJournal」アプリで記録していることを自然に盛り込んでもOK',
    '',
    '【肌データ】',
    `記録日: ${date}`,
    `総合スコア: ${avg} / ${SCALE_MAX}（${scoreLabel(avg)}）`,
    '',
    'おでこ',
    `　肌色: ${record.forehead.tone}　水分量: ${record.forehead.moisture}　油分量: ${record.forehead.oil}　弾性力: ${record.forehead.elasticity}`,
    '',
    'ほお',
    `　肌色: ${record.cheek.tone}　水分量: ${record.cheek.moisture}　油分量: ${record.cheek.oil}　弾性力: ${record.cheek.elasticity}`,
    ...(cosmeticSection.length > 0 ? ['', '使用コスメ', ...cosmeticSection] : []),
    ...(lifelogSection.length > 0 ? ['', 'ライフログ', ...lifelogSection] : []),
  ].join('\n');
}

// ============================================================
// スコアサマリーカード（正方形出力用・一目で状態がわかるデザイン）
// ============================================================
interface SummaryCardProps {
  record: NormalizedRecord;
}

const METRIC_ORDER: (keyof SkinMetrics)[] = ['tone', 'moisture', 'oil', 'elasticity'];

function MetricRow({ label, value }: { label: string; value: number; color: string }) {
  return (
    <Box mb={0.8}>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={0.25}>
        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{label}</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: '#fff' }}>
          {value}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.2)',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'rgba(255,255,255,0.9)',
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
}

function ScoreSummaryCard({ record }: SummaryCardProps) {
  const avg = Math.round(
    (record.forehead.tone + record.forehead.moisture + record.forehead.oil + record.forehead.elasticity +
     record.cheek.tone + record.cheek.moisture + record.cheek.oil + record.cheek.elasticity) / 8
  );
  const color = scoreColor(avg);

  return (
    // [Add] PBI-37: aspectRatio 1:1 で正方形出力（Twitter 1:1 推奨）
    <Box
      sx={{
        aspectRatio: '1 / 1',
        background: `linear-gradient(145deg, ${color}cc 0%, ${color} 50%, #1a1a2e 100%)`,
        borderRadius: 3,
        p: { xs: 2.5, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Noto Sans JP", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー: ブランド + 日付 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <SpaIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 }}>
            SkinJournal
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
          {formatFullDate(record.timestamp)}
        </Typography>
      </Box>

      {/* 総合スコア */}
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* スコアサークル */}
        <Box
          sx={{
            width: { xs: 64, sm: 76 },
            height: { xs: 64, sm: 76 },
            borderRadius: '50%',
            background: `conic-gradient(rgba(255,255,255,0.9) ${avg}%, rgba(255,255,255,0.15) 0%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 900, lineHeight: 1, color: '#fff' }}>
              {avg}
            </Typography>
            <Typography sx={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
              / {SCALE_MAX}
            </Typography>
          </Box>
        </Box>

        <Box flex={1}>
          <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', mb: 0.4 }}>総合スコア</Typography>
          <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            {scoreLabel(avg)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={avg}
            sx={{
              mt: 1,
              height: 5,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2.5 },
            }}
          />
        </Box>
      </Box>

      {/* おでこ / ほお 指標 */}
      <Grid container spacing={1.5} sx={{ flex: 1 }}>
        {(['forehead', 'cheek'] as const).map((area) => (
          <Grid item xs={6} key={area}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.10)',
                borderRadius: 2,
                p: { xs: 1.2, sm: 1.5 },
                height: '100%',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: area === 'forehead' ? '#f48fb1' : '#90caf9',
                  }}
                />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {area === 'forehead' ? 'おでこ' : 'ほお'}
                </Typography>
              </Box>
              {METRIC_ORDER.map((key) => (
                <MetricRow
                  key={key}
                  label={METRIC_LABELS[key]}
                  value={record[area][key]}
                  color={METRIC_COLORS[key]}
                />
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* 使用コスメタグ */}
      {(record.cosmetics.toner || record.cosmetics.essence || record.cosmetics.lotion || record.cosmetics.primer) && (
        <Box mt={1.5}>
          <Box display="flex" flexWrap="wrap" gap={0.6}>
            {[
              { label: '化粧水', value: record.cosmetics.toner },
              { label: '美容液', value: record.cosmetics.essence },
              { label: '乳液',   value: record.cosmetics.lotion },
              { label: '下地',   value: record.cosmetics.primer },
            ].filter((c) => c.value).map((c) => (
              <Box key={c.label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1.5, px: 1, py: 0.3 }}>
                <Typography sx={{ fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>
                  {c.label}: {c.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ============================================================
// SNSページ本体
// ============================================================
export default function SnsPage() {
  const { records, loading, error } = useSkinData('all');
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [prompt, setPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const summaryRef  = useRef<HTMLDivElement>(null);
  // [Add] PBI-37: レーダーも正方形でエクスポート
  const radarRef    = useRef<HTMLDivElement>(null);
  const trendRef    = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // [Add] PBI-38: 生成AIプロンプトを生成
  const handleGeneratePrompt = () => {
    if (!latestRecord) return;
    setPrompt(generateAiPrompt(latestRecord));
  };

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Box>
      <PageHeader
        title="SNS出力"
        subtitle="グラフをダウンロード・コピーしてTwitter（X）に投稿しましょう"
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <LoadingBox />
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>

          {/* ── スコアサマリー（正方形・SNS画像メイン） ── */}
          {latestRecord && (
            <Grid item xs={12} sm={6} md={5}>
              <Card elevation={0} sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>スコアサマリー</Typography>
                      <Typography variant="caption" color="text.secondary">1:1 正方形（Twitter推奨）</Typography>
                    </Box>
                    <ChartExportButton targetRef={summaryRef} filename="sns-skin-summary" />
                  </Box>
                  <Box ref={summaryRef}>
                    <ScoreSummaryCard record={latestRecord} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ── レーダーチャート（正方形） ── */}
          <Grid item xs={12} sm={6} md={7}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>最新肌状態</Typography>
                    <Typography variant="caption" color="text.secondary">1:1 正方形</Typography>
                  </Box>
                  <ChartExportButton targetRef={radarRef} filename="sns-skin-radar" />
                </Box>
                {/* [Add] PBI-37: 正方形コンテナ */}
                <Box
                  ref={radarRef}
                  sx={{
                    aspectRatio: '1 / 1',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: { xs: 1, sm: 2 },
                    overflow: 'hidden',
                  }}
                >
                  <SkinRadarChart record={latestRecord} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── 生成AIプロンプト ── */}
          <Grid item xs={12}>
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={1}
                  mb={1.5}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>生成AIプロンプト</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ChatGPT / Claude 等に貼り付けてSNS投稿文を作成できます
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleGeneratePrompt}
                    disabled={!latestRecord}
                    variant="outlined"
                    fullWidth={isMobile}
                  >
                    プロンプトを生成
                  </Button>
                </Box>
                <OutlinedInput
                  multiline
                  rows={isMobile ? 8 : 12}
                  fullWidth
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="「プロンプトを生成」ボタンで最新の肌データからAIプロンプトを作成します。そのままChatGPT・Claude等に貼り付けてください。"
                  endAdornment={
                    prompt ? (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <Tooltip title={copied ? 'コピーしました！' : 'クリップボードにコピー'}>
                          <IconButton size="small" onClick={handleCopyPrompt}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null
                  }
                  sx={{ fontSize: 13 }}
                />
                {!latestRecord && (
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                    ※ 肌データを記録するとプロンプトを生成できます
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ── 推移グラフ（横長） ── */}
          <Grid item xs={12}>
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>推移グラフ</Typography>
                    <Typography variant="caption" color="text.secondary">横長（16:9 相当）</Typography>
                  </Box>
                  <ChartExportButton targetRef={trendRef} filename="sns-skin-trend" />
                </Box>
                <Box ref={trendRef} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                  <TrendChart records={records} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── 365日カレンダー（横長） ── */}
          <Grid item xs={12}>
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>365日カレンダー</Typography>
                    <Typography variant="caption" color="text.secondary">横長</Typography>
                  </Box>
                  <ChartExportButton targetRef={calendarRef} filename="sns-skin-calendar" />
                </Box>
                <Box ref={calendarRef} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                  <CalendarHeatmap records={records} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}
