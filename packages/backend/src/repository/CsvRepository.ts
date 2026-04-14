// ============================================================
// Repository層: ローカル CSV ファイルとの読み書きをカプセル化
// ============================================================

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import logger from '../utils/logger';
import { RawSheetRow, SkinEntryInput } from '../types';

const CSV_HEADERS = [
  'timestamp',
  'foreheadTone', 'foreheadMoisture', 'foreheadOil', 'foreheadElasticity',
  'cheekTone', 'cheekMoisture', 'cheekOil', 'cheekElasticity',
  // [Add] PBI-33: 下地カラムを lotion の後に追加
  'toner', 'essence', 'lotion', 'primer',
  'businessTrip', 'alcohol', 'sleepHours', 'notes',
];

function escapeField(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// [Refactor] PBI-19: appendRow と updateRow で同一のフィールドマッピングが重複していたため
// ヘルパー関数として抽出。変換ロジックをここに一元化する。
function entryToFields(timestamp: string, entry: SkinEntryInput): (string | number | boolean)[] {
  return [
    timestamp,
    entry.forehead.tone,
    entry.forehead.moisture,
    entry.forehead.oil,
    entry.forehead.elasticity,
    entry.cheek.tone,
    entry.cheek.moisture,
    entry.cheek.oil,
    entry.cheek.elasticity,
    entry.cosmetics.toner,
    entry.cosmetics.essence,
    entry.cosmetics.lotion,
    // [Add] PBI-33: 下地フィールドを追加
    entry.cosmetics.primer,
    entry.factors.businessTrip ? 'TRUE' : 'FALSE',
    entry.factors.alcohol ? 'TRUE' : 'FALSE',
    entry.factors.sleepHours,
    entry.factors.notes,
  ];
}

function entryToRawRow(timestamp: string, entry: SkinEntryInput): RawSheetRow {
  return {
    timestamp,
    foreheadTone:       String(entry.forehead.tone),
    foreheadMoisture:   String(entry.forehead.moisture),
    foreheadOil:        String(entry.forehead.oil),
    foreheadElasticity: String(entry.forehead.elasticity),
    cheekTone:          String(entry.cheek.tone),
    cheekMoisture:      String(entry.cheek.moisture),
    cheekOil:           String(entry.cheek.oil),
    cheekElasticity:    String(entry.cheek.elasticity),
    toner:              entry.cosmetics.toner,
    essence:            entry.cosmetics.essence,
    lotion:             entry.cosmetics.lotion,
    // [Add] PBI-33: 下地フィールドを追加
    primer:             entry.cosmetics.primer,
    businessTrip:       entry.factors.businessTrip ? 'TRUE' : 'FALSE',
    alcohol:            entry.factors.alcohol ? 'TRUE' : 'FALSE',
    sleepHours:         String(entry.factors.sleepHours),
    notes:              entry.factors.notes,
  };
}

export class CsvRepository {
  private csvPath: string;

  constructor() {
    // __dirname = dist/repository/ or src/repository/  →  ../../data = packages/backend/data/
    const dataDir = process.env.DATA_DIR ?? path.join(__dirname, '../../data');
    this.csvPath = path.join(dataDir, 'skin_data.csv');
    this.ensureFile(dataDir);
  }

  private ensureFile(dataDir: string): void {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.csvPath)) {
      fs.writeFileSync(this.csvPath, CSV_HEADERS.join(',') + '\n', 'utf-8');
      logger.info(`Created new CSV file: ${this.csvPath}`);
    } else {
      this.migrateIfNeeded();
    }
  }

  /**
   * PBI-33 以前に作成された CSV には primer 列がない。
   * ヘッダーに primer が含まれていなければ全行を読み込み直して書き直す。
   *
   * 移行処理の注意点:
   * - 16列行（PBI-33以前）: lotion の後に primer='' を挿入して17列に変換する
   * - 17列行（PBI-33以降、旧ヘッダーで追記されたもの）: すでに正しい順序なのでそのまま使う
   * csv-parse に渡す前に行ごとのフィールド数を確認し、ヘッダー列名とのズレを防ぐ。
   */
  private migrateIfNeeded(): void {
    const content = fs.readFileSync(this.csvPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const header = lines[0] ?? '';
    if (header.includes('primer')) return;

    logger.info('Migrating CSV: adding primer column');

    const NEW_COL_COUNT = 17;

    // lotion の旧インデックス（0始まり）: 11番目
    const LOTION_IDX = 11;

    const migrated: RawSheetRow[] = [];

    for (const line of lines.slice(1)) {
      // CSV フィールドを素朴に分割（引用符なしフィールドのみ想定）
      const fields = line.split(',');

      let f: string[];
      if (fields.length >= NEW_COL_COUNT) {
        // すでに17列で書かれた行: そのまま使用（primer は field[12]）
        f = fields;
      } else {
        // 16列以下の古い行: lotion の直後に primer='' を挿入して17列に変換
        f = [...fields.slice(0, LOTION_IDX + 1), '', ...fields.slice(LOTION_IDX + 1)];
      }

      migrated.push({
        timestamp:          f[0]  ?? '',
        foreheadTone:       f[1]  ?? '0',
        foreheadMoisture:   f[2]  ?? '0',
        foreheadOil:        f[3]  ?? '0',
        foreheadElasticity: f[4]  ?? '0',
        cheekTone:          f[5]  ?? '0',
        cheekMoisture:      f[6]  ?? '0',
        cheekOil:           f[7]  ?? '0',
        cheekElasticity:    f[8]  ?? '0',
        toner:              f[9]  ?? '',
        essence:            f[10] ?? '',
        lotion:             f[11] ?? '',
        primer:             f[12] ?? '',
        businessTrip:       f[13] ?? 'FALSE',
        alcohol:            f[14] ?? 'FALSE',
        sleepHours:         f[15] ?? '0',
        notes:              f[16] ?? '',
      });
    }

    this.writeAllRows(migrated);
    logger.info(`Migration complete: ${migrated.length} rows rewritten with primer column`);

    // 旧ヘッダーで書き込まれた17列行（カラムシフトが生じた行）を修正する
    this.repairShiftedRows();
  }

  /**
   * マイグレーション後に businessTrip が空文字、sleepHours が 'FALSE' になっている行を修復する。
   * これは旧16列ヘッダー下で新17列データが追記された場合に発生するシフトの副作用。
   * 具体的なパターン: businessTrip='' かつ sleepHours が数値でない場合
   *   → alcohol → businessTrip, sleepHours(旧alcohol) → alcohol, notes(旧sleepHours) → sleepHours, notes='' に補正
   */
  private repairShiftedRows(): void {
    const content = fs.readFileSync(this.csvPath, 'utf-8');
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    let repaired = 0;
    const fixed: RawSheetRow[] = rows.map((r) => {
      const sleepIsNaN = isNaN(parseFloat(r['sleepHours'] ?? ''));
      const btIsEmpty  = (r['businessTrip'] ?? '') === '';
      if (btIsEmpty && sleepIsNaN) {
        repaired++;
        return {
          timestamp:          r['timestamp']          ?? '',
          foreheadTone:       r['foreheadTone']       ?? '0',
          foreheadMoisture:   r['foreheadMoisture']   ?? '0',
          foreheadOil:        r['foreheadOil']        ?? '0',
          foreheadElasticity: r['foreheadElasticity'] ?? '0',
          cheekTone:          r['cheekTone']          ?? '0',
          cheekMoisture:      r['cheekMoisture']      ?? '0',
          cheekOil:           r['cheekOil']           ?? '0',
          cheekElasticity:    r['cheekElasticity']    ?? '0',
          toner:              r['toner']              ?? '',
          essence:            r['essence']            ?? '',
          lotion:             r['lotion']             ?? '',
          primer:             r['primer']             ?? '',
          businessTrip:       r['alcohol']            ?? 'FALSE', // alcohol は元 businessTrip
          alcohol:            r['sleepHours']         ?? 'FALSE', // sleepHours は元 alcohol
          sleepHours:         r['notes']              ?? '0',     // notes は元 sleepHours
          notes:              '',                                  // 元 notes は空だった
        };
      }
      return {
        timestamp:          r['timestamp']          ?? '',
        foreheadTone:       r['foreheadTone']       ?? '0',
        foreheadMoisture:   r['foreheadMoisture']   ?? '0',
        foreheadOil:        r['foreheadOil']        ?? '0',
        foreheadElasticity: r['foreheadElasticity'] ?? '0',
        cheekTone:          r['cheekTone']          ?? '0',
        cheekMoisture:      r['cheekMoisture']      ?? '0',
        cheekOil:           r['cheekOil']           ?? '0',
        cheekElasticity:    r['cheekElasticity']    ?? '0',
        toner:              r['toner']              ?? '',
        essence:            r['essence']            ?? '',
        lotion:             r['lotion']             ?? '',
        primer:             r['primer']             ?? '',
        businessTrip:       r['businessTrip']       ?? 'FALSE',
        alcohol:            r['alcohol']            ?? 'FALSE',
        sleepHours:         r['sleepHours']         ?? '0',
        notes:              r['notes']              ?? '',
      };
    });

    if (repaired > 0) {
      this.writeAllRows(fixed);
      logger.info(`Repaired ${repaired} shifted rows`);
    }
  }

  /** CSVから全行を読み込む */
  async loadAllRows(): Promise<RawSheetRow[]> {
    const content = fs.readFileSync(this.csvPath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    logger.info(`Loaded ${records.length} rows from CSV`);

    return records.map((r): RawSheetRow => ({
      timestamp: r['timestamp'] ?? '',
      foreheadTone: r['foreheadTone'] ?? '0',
      foreheadMoisture: r['foreheadMoisture'] ?? '0',
      foreheadOil: r['foreheadOil'] ?? '0',
      foreheadElasticity: r['foreheadElasticity'] ?? '0',
      cheekTone: r['cheekTone'] ?? '0',
      cheekMoisture: r['cheekMoisture'] ?? '0',
      cheekOil: r['cheekOil'] ?? '0',
      cheekElasticity: r['cheekElasticity'] ?? '0',
      toner: r['toner'] ?? '',
      essence: r['essence'] ?? '',
      lotion: r['lotion'] ?? '',
      // [Add] PBI-33: 旧データとの後方互換のため '' をデフォルト値に設定
      primer: r['primer'] ?? '',
      businessTrip: r['businessTrip'] ?? 'FALSE',
      alcohol: r['alcohol'] ?? 'FALSE',
      sleepHours: r['sleepHours'] ?? '0',
      notes: r['notes'] ?? '',
    }));
  }

  /** 新しいエントリを CSV に追記する */
  async appendRow(entry: SkinEntryInput): Promise<void> {
    const timestamp = entry.date
      ? `${entry.date}T00:00:00.000`
      : new Date().toISOString();
    // [Refactor] PBI-19: entryToFields ヘルパーに委譲（updateRow との重複を排除）
    const fields = entryToFields(timestamp, entry);
    fs.appendFileSync(this.csvPath, fields.map(escapeField).join(',') + '\n', 'utf-8');
    logger.info(`Appended new row at ${timestamp}`);
  }

  /** timestamp が一致する行を更新して CSV 全体を書き直す */
  async updateRow(timestamp: string, entry: SkinEntryInput): Promise<boolean> {
    const rows = await this.loadAllRows();
    const index = rows.findIndex((r) => r.timestamp === timestamp);
    if (index === -1) return false;

    const newTimestamp = entry.date ? `${entry.date}T00:00:00.000` : timestamp;
    // [Refactor] PBI-19: entryToRawRow ヘルパーに委譲（appendRow との重複を排除）
    const updated: RawSheetRow = entryToRawRow(newTimestamp, entry);
    rows[index] = updated;
    this.writeAllRows(rows);
    logger.info(`Updated row with timestamp: ${timestamp}`);
    return true;
  }

  /** timestamp が一致する行を削除して CSV 全体を書き直す */
  async deleteRow(timestamp: string): Promise<boolean> {
    const rows = await this.loadAllRows();
    const filtered = rows.filter((r) => r.timestamp !== timestamp);
    if (filtered.length === rows.length) return false;
    this.writeAllRows(filtered);
    logger.info(`Deleted row with timestamp: ${timestamp}`);
    return true;
  }

  /** CSV ファイルのパスを返す（ダウンロード用） */
  getCsvPath(): string {
    return this.csvPath;
  }

  private writeAllRows(rows: RawSheetRow[]): void {
    const lines = rows.map((r) =>
      [
        r.timestamp, r.foreheadTone, r.foreheadMoisture, r.foreheadOil, r.foreheadElasticity,
        r.cheekTone, r.cheekMoisture, r.cheekOil, r.cheekElasticity,
        // [Add] PBI-33: 下地フィールドを追加
        r.toner, r.essence, r.lotion, r.primer,
        r.businessTrip, r.alcohol, r.sleepHours, r.notes,
      ].map(escapeField).join(',')
    );
    fs.writeFileSync(this.csvPath, CSV_HEADERS.join(',') + '\n' + lines.join('\n') + (lines.length ? '\n' : ''), 'utf-8');
  }
}
