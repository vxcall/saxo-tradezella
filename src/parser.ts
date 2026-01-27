import { SPREAD_BY_ASSET_TYPE } from './constants';

type ParsedDateTime = {
  date: string;
  time: string;
};

export type Row = Record<string, unknown>;

export function buildRowsFromSheet(rows: unknown[][]): Row[] {
  if (rows.length === 0) return [];
  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((cell) => (cell === null || cell === undefined ? '' : String(cell).trim()));
  const mappedRows: Row[] = [];

  for (const row of rows.slice(1)) {
    const record: Row = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const cell = row?.[index];
      record[header] = cell === null || cell === undefined ? '' : cell;
    });
    mappedRows.push(record);
  }

  return mappedRows;
}

export function mapRow(row: Row): string[] | null {
  const dateTime = pickDateTime(row);
  if (!dateTime) {
    return null;
  }

  const symbol = pickValue(row, ['Underlying Instrument Symbol', '銘柄コード', '銘柄名']);
  if (!symbol) {
    return null;
  }

  const rawSide = pickValue(row, ['売買タイプ', 'Direction']);
  const rawQuantity = pickNumber(row, ['数量']);
  const rawPrice = pickNumber(row, ['価格']);
  const assetType = pickValue(row, ['Asset type']);
  const expiry = pickDate(row, ['ExpiryDate']);
  const strike = pickValue(row, ['ストライク']);
  const optionType = pickValue(row, ['Option Event Type']);

  const quantity = rawQuantity !== null ? Math.abs(rawQuantity) : null;
  const side = normalizeSide(rawSide, rawQuantity);
  const spread = normalizeSpread(assetType, optionType, strike);
  const expiration = expiry ? formatExpiry(expiry) : '';
  const callPut = normalizeCallPut(optionType);

  const price = rawPrice !== null ? String(rawPrice) : '';
  const quantityText = quantity !== null ? String(quantity) : '';
  const strikeText = sanitizeStrike(strike);

  return [
    dateTime.date,
    dateTime.time,
    symbol,
    side,
    quantityText,
    price,
    spread,
    expiration,
    strikeText,
    callPut,
    '',
    '',
  ];
}

function pickValue(row: Row, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function pickNumber(row: Row, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === '') continue;
    const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    if (!Number.isNaN(num)) return num;
  }
  return null;
}

function pickDate(row: Row, keys: string[]): Date | null {
  for (const key of keys) {
    const value = row[key];
    const date = parseDateTime(value);
    if (date) return date;
  }
  return null;
}

function pickDateTime(row: Row): ParsedDateTime | null {
  const dateValue = pickDate(row, ['Trade Execution Time', '取引時間']);
  if (!dateValue) return null;
  return {
    date: formatDate(dateValue),
    time: formatTime(dateValue),
  };
}

function parseDateTime(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return parseExcelSerialDate(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?)?$/
    );
    if (match) {
      const [, year, month, day, hour, minute, second, ms] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour ?? '0'),
        Number(minute ?? '0'),
        Number(second ?? '0'),
        Number(ms ?? '0')
      );
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function parseExcelSerialDate(value: number): Date | null {
  if (!Number.isFinite(value)) return null;
  const base = new Date(1899, 11, 30);
  const ms = Math.round(value * 24 * 60 * 60 * 1000);
  return new Date(base.getTime() + ms);
}

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatExpiry(date: Date): string {
  const year = date.getFullYear();
  if (year <= 1900) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const monthName = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][date.getMonth()];
  const yearShort = String(year).slice(-2);
  return `${day} ${monthName} ${yearShort}`;
}

function normalizeSide(value: string, quantity: number | null): string {
  const normalized = value.toLowerCase();
  if (normalized === 'buy' || value === '買') return 'Buy';
  if (normalized === 'sell' || value === '売') return 'Sell';
  if (quantity !== null && quantity < 0) return 'Sell';
  return 'Buy';
}

function normalizeSpread(assetType: string, optionType: string, strike: string): string {
  if (optionType || sanitizeStrike(strike)) return 'Single';
  if (assetType && SPREAD_BY_ASSET_TYPE[assetType]) return SPREAD_BY_ASSET_TYPE[assetType];
  return 'Stock';
}

function sanitizeStrike(value: string): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '-') return '';
  return trimmed;
}

function normalizeCallPut(value: string): string {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.includes('call')) return 'Call';
  if (lower.includes('put')) return 'Put';
  return '';
}
