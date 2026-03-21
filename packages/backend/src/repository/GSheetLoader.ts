// ============================================================
// Repository層: Google Sheets API との通信をカプセル化
// ============================================================

import { google, sheets_v4 } from 'googleapis';
import path from 'path';
import logger from '../utils/logger';
import { RawSheetRow, SkinEntryInput } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class GSheetLoader {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string;
  private sheetName: string;

  constructor() {
    this.spreadsheetId = process.env.SPREADSHEET_ID ?? '';
    this.sheetName = process.env.SHEET_NAME ?? 'シート1';
  }

  /** Google Sheets クライアントを初期化する */
  private async getSheets(): Promise<sheets_v4.Sheets> {
    if (this.sheets) return this.sheets;

    const credentialsPath =
      process.env.GOOGLE_CREDENTIALS_PATH ??
      path.join(process.cwd(), 'credentials.json');

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    logger.info('Google Sheets client initialized');
    return this.sheets;
  }

  /** スプレッドシートから全行を取得する */
  async loadAllRows(): Promise<RawSheetRow[]> {
    const sheets = await this.getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A2:P`,
    });

    const rows = response.data.values ?? [];
    logger.info(`Loaded ${rows.length} rows from Google Sheets`);

    return rows.map((row): RawSheetRow => ({
      timestamp: row[0] ?? '',
      foreheadTone: row[1] ?? '0',
      foreheadMoisture: row[2] ?? '0',
      foreheadOil: row[3] ?? '0',
      foreheadElasticity: row[4] ?? '0',
      cheekTone: row[5] ?? '0',
      cheekMoisture: row[6] ?? '0',
      cheekOil: row[7] ?? '0',
      cheekElasticity: row[8] ?? '0',
      toner: row[9] ?? '',
      essence: row[10] ?? '',
      lotion: row[11] ?? '',
      businessTrip: row[12] ?? 'FALSE',
      alcohol: row[13] ?? 'FALSE',
      sleepHours: row[14] ?? '0',
      notes: row[15] ?? '',
    }));
  }

  /** 新しいエントリをスプレッドシートに書き込む */
  async appendRow(entry: SkinEntryInput): Promise<void> {
    const sheets = await this.getSheets();
    const now = new Date().toISOString();

    const row = [
      now,
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

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A:P`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    logger.info(`Appended new row at ${now}`);
  }
}
