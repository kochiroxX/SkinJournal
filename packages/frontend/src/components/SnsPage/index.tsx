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
// スコアに応じた色・ラベルを返すユーティリティ（スコア範囲 20-70 を想定）
// ============================================================
function scoreColor(v: number): string {
  if (v >= 60) return '#388e3c'; // 落ち着いたグリーン
  if (v >= 45) return '#e65100'; // 落ち着いたオレンジ
  return '#c62828';               // 落ち着いたレッド
}
function scoreBgColor(v: number): string {
  if (v >= 60) return '#e8f5e9';
  if (v >= 45) return '#fff3e0';
  return '#fce4ec';
}
function scoreLabel(avg: number): string {
  if (avg >= 65) return '絶好調 ✨';
  if (avg >= 55) return '良好 💪';
  if (avg >= 45) return 'まずまず 🌿';
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

// 指標バブル: conic-gradient リングで % を表現し、内側に数値を表示
function MetricBubble({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, (value - 20) / 50 * 100)));
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.75}>
      <Box
        sx={{
          width: { xs: 60, sm: 68 },
          height: { xs: 60, sm: 68 },
          borderRadius: '50%',
          background: `conic-gradient(${color} ${pct}%, ${color}22 0%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: { xs: 46, sm: 52 },
            height: { xs: 46, sm: 52 },
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 800, color, lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: { xs: 10, sm: 11 }, color: '#757575', lineHeight: 1, textAlign: 'center' }}>
        {label}
      </Typography>
    </Box>
  );
}

function ScoreSummaryCard({ record }: SummaryCardProps) {
  const avg = Math.round(
    (record.forehead.tone + record.forehead.moisture + record.forehead.oil + record.forehead.elasticity +
     record.cheek.tone + record.cheek.moisture + record.cheek.oil + record.cheek.elasticity) / 8
  );
  const color   = scoreColor(avg);
  const bgColor = scoreBgColor(avg);

  // 進捗バー用に 20-70 レンジを 0-100% に正規化
  const progressPct = Math.round(Math.min(100, Math.max(0, (avg - 20) / 50 * 100)));

  return (
    <Box
      sx={{
        background: 'linear-gradient(150deg, #fff8f9 0%, #fce4ec 55%, #ede7f6 100%)',
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* ── ヘッダー ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={0.5}>
          <SpaIcon sx={{ color: '#e91e63', fontSize: 16 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#c2185b', letterSpacing: 0.5 }}>
            SkinJournal
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 11, color: '#9e9e9e' }}>
          {formatFullDate(record.timestamp)}
        </Typography>
      </Box>

      {/* ── 総合スコア（conic-gradient リング） ── */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: 2,
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        }}
      >
        {/* スコアサークル（conic-gradient リング） */}
        <Box
          sx={{
            width: { xs: 64, sm: 72 },
            height: { xs: 64, sm: 72 },
            borderRadius: '50%',
            background: `conic-gradient(${color} ${progressPct}%, ${color}22 0%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 50, sm: 56 },
              height: { xs: 50, sm: 56 },
              borderRadius: '50%',
              bgcolor: bgColor,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 900, lineHeight: 1, color }}>
              {avg}
            </Typography>
            <Typography sx={{ fontSize: 8, color: '#bdbdbd', lineHeight: 1.2 }}>
              /{SCALE_MAX}
            </Typography>
          </Box>
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography sx={{ fontSize: 10, color: '#9e9e9e', mb: 0.3 }}>総合スコア</Typography>
          <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: '#212121', lineHeight: 1.2 }}>
            {scoreLabel(avg)}
          </Typography>
        </Box>
      </Box>

      {/* ── おでこ / ほお 指標（2×2 バブルグリッド） ── */}
      <Grid container spacing={1.5}>
        {(['forehead', 'cheek'] as const).map((area) => (
          <Grid item xs={6} key={area}>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderTop: `3px solid ${area === 'forehead' ? '#e91e63' : '#7986cb'}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: area === 'forehead' ? '#e91e63' : '#7986cb',
                  mb: 1.5,
                }}
              >
                {area === 'forehead' ? 'おでこ' : 'ほお'}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: { xs: 1.5, sm: 2 },
                  justifyItems: 'center',
                }}
              >
                {METRIC_ORDER.map((key) => (
                  <MetricBubble
                    key={key}
                    label={METRIC_LABELS[key]}
                    value={record[area][key]}
                    color={METRIC_COLORS[key]}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── 使用コスメタグ ── */}
      {(record.cosmetics.toner || record.cosmetics.essence || record.cosmetics.lotion || record.cosmetics.primer) && (
        <Box display="flex" flexWrap="wrap" gap={0.75}>
          {[
            { label: '化粧水', value: record.cosmetics.toner },
            { label: '美容液', value: record.cosmetics.essence },
            { label: '乳液',   value: record.cosmetics.lotion },
            { label: '下地',   value: record.cosmetics.primer },
          ].filter((c) => c.value).map((c) => (
            <Box key={c.label} sx={{ bgcolor: '#fce4ec', borderRadius: 1.5, px: 1.2, py: 0.4 }}>
              <Typography sx={{ fontSize: 10, color: '#c2185b' }}>
                {c.label}: {c.value}
              </Typography>
            </Box>
          ))}
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
            <Grid item xs={12} md={6}>
              <Card elevation={0}>
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
          <Grid item xs={12} md={6}>
            <Card elevation={0}>
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
                    bgcolor: '#fafafa',
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
