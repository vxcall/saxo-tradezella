import readXlsxFile, { readSheetNames } from 'read-excel-file';

export async function readPreferredSheet(
  file: File
): Promise<{ sheetName: string; rows: unknown[][] } | null> {
  const sheetNames = await readSheetNames(file);
  const sheetName =
    sheetNames.find((name) => name === 'TradesWithAdditionalInfo') ||
    sheetNames.find((name) => name === 'Trades') ||
    sheetNames[0];

  if (!sheetName) {
    return null;
  }

  const rows = await readXlsxFile(file, { sheet: sheetName });
  return { sheetName, rows };
}
