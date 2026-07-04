import { useEffect } from 'react';
import { NormalizedRecord } from '../types';
import { recordHealthScore } from '../utils/metrics';

export function useNotifications(records: NormalizedRecord[]) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const lastNotified = localStorage.getItem('lastNotifiedDate');
    const today = new Date().toDateString();
    if (lastNotified === today) return;

    if (records.length < 2) return;

    const latest = records[records.length - 1];
    const latestScore = recordHealthScore(latest);

    // トリガー1: 過去最高更新
    const historicalMax = Math.max(...records.slice(0, -1).map((r) => recordHealthScore(r)));
    if (latestScore > historicalMax) {
      new Notification('🏆 過去最高の肌スコアを記録！', {
        body: `今日のスコア: ${latestScore.toFixed(1)}点 — SNSで投稿してみましょう！`,
        tag: 'peak',
      });
      localStorage.setItem('lastNotifiedDate', today);
      return;
    }

    // トリガー2: 前日比±10点
    const latestDate = latest.timestamp.slice(0, 10);
    const prevRecord = [...records].slice(0, -1).reverse().find(r => r.timestamp.slice(0, 10) < latestDate);
    if (!prevRecord) return;
    const prevScore = recordHealthScore(prevRecord);
    const diff = latestScore - prevScore;
    if (Math.abs(diff) >= 10) {
      new Notification(diff > 0 ? '📈 肌コンディションが大幅改善！' : '📉 肌コンディションが低下', {
        body: `前回比 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}点 — 変化をSNSで共有しましょう`,
        tag: 'bigChange',
      });
      localStorage.setItem('lastNotifiedDate', today);
      return;
    }

    // トリガー3: 日曜日週次レポート
    if (new Date().getDay() === 0) {
      new Notification('📊 今週の肌レポートを投稿しよう', {
        body: 'SNS出力画面から週次レポートを確認・共有できます',
        tag: 'weeklyReport',
      });
      localStorage.setItem('lastNotifiedDate', today);
    }
  }, [records]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  return {
    requestPermission,
    permission: typeof Notification !== 'undefined' ? Notification.permission : ('default' as NotificationPermission),
  };
}
