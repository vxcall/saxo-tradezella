import * as XLSX from 'xlsx';

type Row = Record<string, unknown>;

type ParsedDateTime = {
  date: string;
  time: string;
};

const HEADER = [
  'Date',
  'Time',
  'Symbol',
  'Buy/Sell',
  'Quantity',
  'Price',
  'Spread',
  'Expiration',
  'Strike',
  'Call/Put',
  'Commission',
  'Fees',
];

const PANEL_ID = 'tradezella-saxo-drop-panel';
const STATUS_ID = 'tradezella-saxo-drop-status';
const LIST_ID = 'tradezella-saxo-row-list';
const SELECT_BUTTON_ID = 'tradezella-saxo-select';
const UPLOAD_BUTTON_ID = 'tradezella-saxo-upload';
const UPLOAD_SELECTOR = 'input[name="fileUpload"][type="file"]';

const SPREAD_BY_ASSET_TYPE: Record<string, string> = {
  FxSpot: 'Stock',
  CfdOnFutures: 'Stock',
};

let currentRows: string[][] = [];
let currentSourceName = '';

function ensurePanel(): HTMLElement {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    return existing;
  }

  const style = document.createElement('style');
  style.textContent = `
#${PANEL_ID} {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 999999;
  width: 360px;
  background: #111827;
  color: #f9fafb;
  border: 2px dashed #60a5fa;
  border-radius: 12px;
  padding: 14px;
  font: 600 13px/1.4 "Segoe UI", Tahoma, sans-serif;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  cursor: default;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
#${PANEL_ID}.active {
  border-color: #34d399;
  background: #0f172a;
  transform: translateY(-4px);
}
#${PANEL_ID} .title {
  font-size: 13px;
  letter-spacing: 0.2px;
}
#${PANEL_ID} .hint {
  font-weight: 400;
  color: #cbd5f5;
  margin-top: 6px;
  font-size: 12px;
}
#${PANEL_ID} .status {
  font-weight: 600;
  color: #fcd34d;
  margin-top: 10px;
  font-size: 12px;
}
#${PANEL_ID} .status.ok {
  color: #34d399;
}
#${PANEL_ID} .status.error {
  color: #f87171;
}
#${PANEL_ID} .actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
#${PANEL_ID} button {
  appearance: none;
  border: 1px solid #475569;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
#${PANEL_ID} button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
#${PANEL_ID} .list {
  margin-top: 10px;
  max-height: 240px;
  overflow: auto;
  border: 1px solid #1f2937;
  border-radius: 8px;
  background: #0b1220;
}
#${PANEL_ID} .row {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #1f2937;
  align-items: center;
  font-weight: 500;
  font-size: 11px;
}
#${PANEL_ID} .row:last-child {
  border-bottom: none;
}
#${PANEL_ID} .row button {
  border-color: #ef4444;
  background: transparent;
  color: #f87171;
  padding: 2px 6px;
  font-size: 11px;
}
#${PANEL_ID} .row-text {
  color: #e2e8f0;
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}
`;

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="title">Saxo .xlsx to Tradezella CSV</div>
    <div class="hint">Drop a file here or pick one to preview rows.</div>
    <div class="actions">
      <button type="button" id="${SELECT_BUTTON_ID}">Select File</button>
      <button type="button" id="${UPLOAD_BUTTON_ID}" disabled>Upload CSV</button>
    </div>
    <div class="status" id="${STATUS_ID}">Waiting for file...</div>
    <div class="list" id="${LIST_ID}"></div>
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(panel);

  return panel;
}

function setStatus(message: string, state: 'ok' | 'error' | 'info' = 'info') {
  const status = document.getElementById(STATUS_ID);
  if (!status) return;
  status.textContent = message;
  status.classList.remove('ok', 'error');
  if (state === 'ok') status.classList.add('ok');
  if (state === 'error') status.classList.add('error');
}

function setupDropZone(panel: HTMLElement) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx,.xls';
  fileInput.style.display = 'none';
  panel.appendChild(fileInput);

  const selectButton = panel.querySelector<HTMLButtonElement>(`#${SELECT_BUTTON_ID}`);
  const uploadButton = panel.querySelector<HTMLButtonElement>(`#${UPLOAD_BUTTON_ID}`);
  const list = panel.querySelector<HTMLDivElement>(`#${LIST_ID}`);

  if (!selectButton || !uploadButton || !list) {
    return;
  }

  selectButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  uploadButton.addEventListener('click', () => {
    void uploadCurrentRows();
  });

  list.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button[data-index]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (!Number.isNaN(index)) {
      currentRows.splice(index, 1);
      renderRows();
      updateStatusAfterEdit();
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      void handleFile(file);
    }
  });

  panel.addEventListener('dragover', (event) => {
    event.preventDefault();
    panel.classList.add('active');
  });

  panel.addEventListener('dragleave', () => {
    panel.classList.remove('active');
  });

  panel.addEventListener('drop', (event) => {
    event.preventDefault();
    panel.classList.remove('active');
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void handleFile(file);
    }
  });
}

async function handleFile(file: File) {
  if (!file.name.toLowerCase().match(/\.xls(x)?$/)) {
    setStatus('Please drop a .xlsx file.', 'error');
    return;
  }

  setStatus('Reading file...');

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    const sheetName =
      workbook.SheetNames.find((name) => name === 'TradesWithAdditionalInfo') ||
      workbook.SheetNames.find((name) => name === 'Trades') ||
      workbook.SheetNames[0];

    if (!sheetName) {
      setStatus('No sheet found in workbook.', 'error');
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
      defval: '',
      raw: true,
    });

    if (rows.length === 0) {
      setStatus('Sheet has no rows.', 'error');
      return;
    }

    setStatus(`Mapping ${rows.length} rows...`);
    const mappedRows: string[][] = [];
    for (const row of rows) {
      const mapped = mapRow(row);
      if (mapped) mappedRows.push(mapped);
    }

    if (mappedRows.length === 0) {
      setStatus('No mappable rows found.', 'error');
      currentRows = [];
      renderRows();
      updateUploadButton();
      return;
    }

    currentRows = mappedRows;
    currentSourceName = file.name;
    renderRows();
    updateStatusAfterEdit();
  } catch (error) {
    console.error('Tradezella extension error', error);
    setStatus('Failed to convert file. See console.', 'error');
  }
}

function buildCsvFromMappedRows(rows: string[][]): string {
  const lines: string[] = [];
  lines.push(toCsvRow(HEADER));

  for (const row of rows) {
    lines.push(toCsvRow(row));
  }

  return lines.join('\n');
}

function mapRow(row: Row): string[] | null {
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
    const num = typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, ''));
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
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
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

function toCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',');
}

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsvFilename(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  const stamp = new Date();
  const date = `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(
    stamp.getDate()
  ).padStart(2, '0')}`;
  return `${base}_tradezella_${date}.csv`;
}

function renderRows() {
  const list = document.getElementById(LIST_ID);
  if (!list) return;

  list.innerHTML = '';
  if (currentRows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'row';
    const text = document.createElement('div');
    text.className = 'row-text';
    text.textContent = 'No rows loaded.';
    empty.appendChild(text);
    list.appendChild(empty);
    return;
  }

  currentRows.forEach((row, index) => {
    const item = document.createElement('div');
    item.className = 'row';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'x';
    remove.dataset.index = String(index);
    remove.setAttribute('aria-label', 'Remove row');

    const text = document.createElement('div');
    text.className = 'row-text';
    text.textContent = formatRowDisplay(row);

    item.appendChild(remove);
    item.appendChild(text);
    list.appendChild(item);
  });
}

function formatRowDisplay(row: string[]): string {
  return row.join(' | ');
}

function updateUploadButton() {
  const button = document.getElementById(UPLOAD_BUTTON_ID) as HTMLButtonElement | null;
  if (!button) return;
  button.disabled = currentRows.length === 0;
}

function updateStatusAfterEdit() {
  updateUploadButton();
  if (currentRows.length === 0) {
    setStatus('No rows loaded.', 'info');
    return;
  }
  setStatus(`Ready to upload ${currentRows.length} rows.`, 'ok');
}

async function uploadCurrentRows() {
  if (currentRows.length === 0) {
    setStatus('No rows to upload.', 'error');
    return;
  }

  const uploadInput = document.querySelector(UPLOAD_SELECTOR) as HTMLInputElement | null;
  if (!uploadInput) {
    setStatus('Upload input not found on page.', 'error');
    return;
  }

  const csv = buildCsvFromMappedRows(currentRows);
  const csvFile = new File([csv], buildCsvFilename(currentSourceName || 'saxo_trades'), {
    type: 'text/csv',
  });

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(csvFile);
  uploadInput.files = dataTransfer.files;
  uploadInput.dispatchEvent(new Event('change', { bubbles: true }));

  setStatus(`Uploaded ${csvFile.name}`, 'ok');
}

function init() {
  const panel = ensurePanel();
  setupDropZone(panel);
  renderRows();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
