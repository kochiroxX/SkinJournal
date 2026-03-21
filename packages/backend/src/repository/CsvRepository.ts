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
  'toner', 'essence', 'lotion',
  'businessTrip', 'alcohol', 'sleepHours', 'notes',
];

function escapeField(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
    const fields = [
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
      entry.factors.businessTrip ? 'TRUE' : 'FALSE',
      entry.factors.alcohol ? 'TRUE' : 'FALSE',
      entry.factors.sleepHours,
      entry.factors.notes,
    ];

    fs.appendFileSync(this.csvPath, fields.map(escapeField).join(',') + '\n', 'utf-8');
    logger.info(`Appended new row at ${timestamp}`);
  }

  /** timestamp が一致する行を更新して CSV 全体を書き直す */
  async updateRow(timestamp: string, entry: SkinEntryInput): Promise<boolean> {
    const rows = await this.loadAllRows();
    const index = rows.findIndex((r) => r.timestamp === timestamp);
    if (index === -1) return false;

    const newTimestamp = entry.date ? `${entry.date}T00:00:00.000` : timestamp;
    const updated: RawSheetRow = {
      timestamp: newTimestamp,
      foreheadTone: String(entry.forehead.tone),
      foreheadMoisture: String(entry.forehead.moisture),
      foreheadOil: String(entry.forehead.oil),
      foreheadElasticity: String(entry.forehead.elasticity),
      cheekTone: String(entry.cheek.tone),
      cheekMoisture: String(entry.cheek.moisture),
      cheekOil: String(entry.cheek.oil),
      cheekElasticity: String(entry.cheek.elasticity),
      toner: entry.cosmetics.toner,
      essence: entry.cosmetics.essence,
      lotion: entry.cosmetics.lotion,
      businessTrip: entry.factors.businessTrip ? 'TRUE' : 'FALSE',
      alcohol: entry.factors.alcohol ? 'TRUE' : 'FALSE',
      sleepHours: String(entry.factors.sleepHours),
      notes: entry.factors.notes,
    };
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
        r.toner, r.essence, r.lotion,
        r.businessTrip, r.alcohol, r.sleepHours, r.notes,
      ].map(escapeField).join(',')
    );
    fs.writeFileSync(this.csvPath, CSV_HEADERS.join(',') + '\n' + lines.join('\n') + (lines.length ? '\n' : ''), 'utf-8');
  }
}
