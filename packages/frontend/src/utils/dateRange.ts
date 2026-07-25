import { NormalizedRecord } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/** 前週の月曜日 00:00:00 〜 日曜日 23:59:59 */
export function getPrevWeekRange(): DateRange {
  const now = new Date();
  const day = now.getDay(); // 0=日, 1=月, ..., 6=土
  const daysToThisMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToThisMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const DOW = ['日','月','火','水','木','金','土'];
  const label = `${fmt(lastMonday)}(${DOW[lastMonday.getDay()]}) 〜 ${fmt(lastSunday)}(${DOW[lastSunday.getDay()]})`;

  return { start: lastMonday, end: lastSunday, label };
}

/** 前月の1日 00:00:00 〜 末日 23:59:59 */
export function getPrevMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const label = `${start.getFullYear()}年${start.getMonth() + 1}月`;
  return { start, end, label };
}

/** 過去 N 日間（今日から N 日前の 00:00:00 〜 今日 23:59:59） */
export function getPastDaysRange(days: number): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return { start, end, label: `過去${days}日間` };
}

/** records を start〜end でフィルタして timestamp 昇順に返す */
export function filterByDateRange(
  records: NormalizedRecord[],
  start: Date,
  end: Date
): NormalizedRecord[] {
  return records
    .filter(r => {
      const t = new Date(r.timestamp);
      return t >= start && t <= end;
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
