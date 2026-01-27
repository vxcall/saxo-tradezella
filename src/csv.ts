import { HEADER } from './constants';

export function buildCsvFromMappedRows(rows: string[][]): string {
  const lines: string[] = [];
  lines.push(toCsvRow(HEADER));

  for (const row of rows) {
    lines.push(toCsvRow(row));
  }

  return lines.join('\n');
}

export function buildCsvFilename(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  const stamp = new Date();
  const date = `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(
    stamp.getDate()
  ).padStart(2, '0')}`;
  return `${base}_tradezella_${date}.csv`;
}

function toCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',');
}

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
