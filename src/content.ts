import readXlsxFile, { readSheetNames } from 'read-excel-file';

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
const DOWNLOAD_BUTTON_ID = 'tradezella-saxo-download';
const DROPZONE_ID = 'tradezella-saxo-dropzone';
const BACK_BUTTON_ID = 'tradezella-saxo-back';
const UPLOAD_SELECTOR = 'input[name="fileUpload"][type="file"]';
const TARGET_PATHS = [
  '/ftux-add-trade/generic/upload',
  '/tracking/add-trade/file_upload',
];

const SPREAD_BY_ASSET_TYPE: Record<string, string> = {
  FxSpot: 'Stock',
  CfdOnFutures: 'Stock',
};

let currentRows: string[][] = [];
let currentSourceName = '';
let panelReady = false;
let panelEl: HTMLElement | null = null;
let routeWatcherStarted = false;
let lastUrl = window.location.href;

function ensurePanel(): HTMLElement {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    return existing;
  }

  const style = document.createElement('style');
  style.textContent = `
#${PANEL_ID} {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 999999;
  width: 360px;
  max-width: min(360px, calc(100vw - 32px));
  background: linear-gradient(145deg, rgba(12, 20, 36, 0.98), rgba(15, 23, 42, 0.98));
  color: #e2e8f0;
  border: 1px solid rgba(71, 85, 105, 0.45);
  border-radius: 18px;
  padding: 16px 16px 14px;
  font: 600 12.5px/1.5 "Space Grotesk", "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(6px);
  cursor: default;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
#${PANEL_ID},
#${PANEL_ID} * {
  box-sizing: border-box;
}
#${PANEL_ID}.active {
  border-color: rgba(56, 189, 248, 0.8);
  box-shadow: 0 22px 48px rgba(56, 189, 248, 0.2);
  transform: translateY(-4px);
}
#${PANEL_ID} .title {
  font-size: 13.5px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
#${PANEL_ID} .header {
  display: flex;
  align-items: center;
  gap: 8px;
}
#${PANEL_ID} #${BACK_BUTTON_ID} {
  width: 28px;
  min-height: 28px;
  padding: 0;
  border-radius: 999px;
  font-size: 14px;
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(100, 116, 139, 0.5);
  display: none;
}
#${PANEL_ID} #${BACK_BUTTON_ID}:hover {
  border-color: rgba(148, 163, 184, 0.9);
  background: rgba(51, 65, 85, 0.9);
}
#${PANEL_ID} .hint {
  font-weight: 500;
  color: #94a3b8;
  margin-top: 6px;
  font-size: 12px;
}
#${PANEL_ID} .status {
  font-weight: 600;
  color: #fbbf24;
  margin-top: 12px;
  font-size: 12px;
}
#${PANEL_ID} .status.ok {
  color: #22c55e;
}
#${PANEL_ID} .status.error {
  color: #f87171;
}
#${PANEL_ID} .actions {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
  position: static !important;
}
#${PANEL_ID} .actions button {
  min-width: 0;
  width: 100%;
}
#${PANEL_ID} button {
  position: static !important;
  appearance: none;
  border: 1px solid rgba(100, 116, 139, 0.6);
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
}
#${PANEL_ID} button:hover {
  border-color: rgba(96, 165, 250, 0.9);
  background: rgba(30, 41, 59, 0.9);
}
#${PANEL_ID} button:active {
  transform: translateY(1px);
}
#${PANEL_ID} button:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}
#${PANEL_ID} button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
#${PANEL_ID} #${UPLOAD_BUTTON_ID} {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-color: rgba(37, 99, 235, 0.9);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
}
#${PANEL_ID} #${UPLOAD_BUTTON_ID}:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  border-color: rgba(30, 64, 175, 0.9);
}
#${PANEL_ID} #${UPLOAD_BUTTON_ID}:disabled {
  background: #1f2937;
  border-color: #334155;
  box-shadow: none;
}
#${PANEL_ID} #${DOWNLOAD_BUTTON_ID} {
  background: rgba(30, 41, 59, 0.75);
  border-color: rgba(148, 163, 184, 0.55);
  box-shadow: none;
}
#${PANEL_ID} #${DOWNLOAD_BUTTON_ID}:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.9);
}
#${PANEL_ID} #${DOWNLOAD_BUTTON_ID}:disabled {
  background: #1f2937;
  border-color: #334155;
  color: #94a3b8;
  box-shadow: none;
}
#${PANEL_ID} .dropzone {
  margin-top: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px dashed rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5f5;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
#${PANEL_ID} .dropzone span {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}
#${PANEL_ID} .dropzone:hover {
  border-color: rgba(96, 165, 250, 0.7);
  background: rgba(30, 41, 59, 0.7);
}
#${PANEL_ID}.active .dropzone {
  border-color: rgba(56, 189, 248, 0.85);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.9);
}
#${PANEL_ID} .list {
  margin-top: 12px;
  max-height: 220px;
  overflow: auto;
  border: 1px solid rgba(51, 65, 85, 0.65);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.85);
}
#${PANEL_ID} .row {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid #1f2937;
  align-items: center;
  font-weight: 500;
  font-size: 11px;
}
#${PANEL_ID} .row:last-child {
  border-bottom: none;
}
#${PANEL_ID} .row button {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.14);
  color: #fca5a5;
  padding: 2px 8px;
  min-height: auto;
  font-size: 11px;
}
#${PANEL_ID} .row button:hover {
  border-color: #fb7185;
  background: rgba(248, 113, 113, 0.2);
}
#${PANEL_ID} .row-text {
  color: #e2e8f0;
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}
@media (max-width: 420px) {
  #${PANEL_ID} {
    right: 12px;
    bottom: 72px;
  }
  #${PANEL_ID} .actions {
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  }
}
`;

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="header">
      <button type="button" id="${BACK_BUTTON_ID}" aria-label="Go back">←</button>
      <div class="title">Saxo .xlsx to Tradezella CSV</div>
    </div>
    <div class="hint">Drop a file here or pick one to preview rows.</div>
    <div class="dropzone" id="${DROPZONE_ID}">
      Drag & drop your .xlsx file here
      <span>TradesWithAdditionalInfo / Trades supported</span>
    </div>
    <div class="actions">
      <button type="button" id="${SELECT_BUTTON_ID}">Select File</button>
      <button type="button" id="${UPLOAD_BUTTON_ID}" disabled>Upload CSV</button>
      <button type="button" id="${DOWNLOAD_BUTTON_ID}" disabled>Download CSV</button>
    </div>
    <div class="status" id="${STATUS_ID}"></div>
    <div class="list" id="${LIST_ID}"></div>
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(panel);

  return panel;
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

function isTargetPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return TARGET_PATHS.some((target) => path === target || path.startsWith(`${target}/`));
}

function ensurePanelReady() {
  if (!panelEl) {
    panelEl = ensurePanel();
  }
  if (!panelReady) {
    setupDropZone(panelEl);
    renderRows();
    setStatus('', 'info');
    panelReady = true;
  }
}

function updatePanelVisibility() {
  lastUrl = window.location.href;
  const shouldShow = isTargetPath(window.location.pathname);
  if (shouldShow) {
    ensurePanelReady();
    if (panelEl) {
      panelEl.style.display = '';
    }
  } else if (panelEl) {
    panelEl.style.display = 'none';
  }
}

function startRouteWatcher() {
  if (routeWatcherStarted) return;
  routeWatcherStarted = true;

  updatePanelVisibility();

  window.addEventListener('popstate', updatePanelVisibility);
  window.addEventListener('hashchange', updatePanelVisibility);

  window.setInterval(() => {
    if (window.location.href !== lastUrl) {
      updatePanelVisibility();
    }
  }, 500);
}

function setStatus(message: string, state: 'ok' | 'error' | 'info' = 'info') {
  const status = document.getElementById(STATUS_ID);
  if (!status) return;
  status.textContent = message;
  status.classList.remove('ok', 'error');
  if (state === 'ok') status.classList.add('ok');
  if (state === 'error') status.classList.add('error');
  status.style.display = message ? '' : 'none';
}

function setupDropZone(panel: HTMLElement) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx';
  fileInput.style.display = 'none';
  panel.appendChild(fileInput);

  const selectButton = panel.querySelector<HTMLButtonElement>(`#${SELECT_BUTTON_ID}`);
  const uploadButton = panel.querySelector<HTMLButtonElement>(`#${UPLOAD_BUTTON_ID}`);
  const downloadButton = panel.querySelector<HTMLButtonElement>(`#${DOWNLOAD_BUTTON_ID}`);
  const list = panel.querySelector<HTMLDivElement>(`#${LIST_ID}`);
  const dropzone = panel.querySelector<HTMLDivElement>(`#${DROPZONE_ID}`);
  const backButton = panel.querySelector<HTMLButtonElement>(`#${BACK_BUTTON_ID}`);

  if (!selectButton || !uploadButton || !downloadButton || !list || !dropzone || !backButton) {
    return;
  }

  selectButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  dropzone.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  uploadButton.addEventListener('click', () => {
    void uploadCurrentRows();
  });

  downloadButton.addEventListener('click', () => {
    downloadCurrentRows();
  });

  backButton.addEventListener('click', () => {
    fileInput.value = '';
    currentRows = [];
    currentSourceName = '';
    renderRows();
    updateStatusAfterEdit();
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
  if (!file.name.toLowerCase().match(/\.xlsx$/)) {
    setStatus('Please drop a .xlsx file.', 'error');
    return;
  }

  setStatus('Reading file...');

  try {
    const sheetNames = await readSheetNames(file);
    const sheetName =
      sheetNames.find((name) => name === 'TradesWithAdditionalInfo') ||
      sheetNames.find((name) => name === 'Trades') ||
      sheetNames[0];

    if (!sheetName) {
      setStatus('No sheet found in workbook.', 'error');
      return;
    }

    const sheetRows = await readXlsxFile(file, { sheet: sheetName });
    const rows = buildRowsFromSheet(sheetRows);

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
      updateActionButtons();
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

function buildRowsFromSheet(rows: unknown[][]): Row[] {
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
    updateEmptyState();
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

  updateEmptyState();
}

function formatRowDisplay(row: string[]): string {
  return row.join(' | ');
}

function updateActionButtons() {
  const selectButton = document.getElementById(SELECT_BUTTON_ID) as HTMLButtonElement | null;
  const uploadButton = document.getElementById(UPLOAD_BUTTON_ID) as HTMLButtonElement | null;
  const downloadButton = document.getElementById(DOWNLOAD_BUTTON_ID) as HTMLButtonElement | null;
  const hasRows = currentRows.length > 0;

  if (selectButton) selectButton.style.display = hasRows ? 'none' : '';
  if (uploadButton) {
    uploadButton.style.display = hasRows ? '' : 'none';
    uploadButton.disabled = !hasRows;
  }
  if (downloadButton) {
    downloadButton.style.display = hasRows ? '' : 'none';
    downloadButton.disabled = !hasRows;
  }
}

function updateStatusAfterEdit() {
  updateActionButtons();
  if (currentRows.length === 0) {
    setStatus('', 'info');
    return;
  }
  setStatus(`Ready to upload or download ${currentRows.length} rows.`, 'ok');
}

function updateEmptyState() {
  const list = document.getElementById(LIST_ID);
  const dropzone = document.getElementById(DROPZONE_ID);
  const backButton = document.getElementById(BACK_BUTTON_ID);
  if (!list || !dropzone) return;
  const hasRows = currentRows.length > 0;
  dropzone.style.display = hasRows ? 'none' : 'flex';
  list.style.display = hasRows ? '' : 'none';
  if (backButton) backButton.style.display = hasRows ? 'inline-flex' : 'none';
  updateActionButtons();
}

function downloadCurrentRows() {
  if (currentRows.length === 0) {
    setStatus('No rows to download.', 'error');
    return;
  }

  const csv = buildCsvFromMappedRows(currentRows);
  const filename = buildCsvFilename(currentSourceName || 'saxo_trades');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  setStatus(`Downloaded ${filename}`, 'ok');
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
  startRouteWatcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
