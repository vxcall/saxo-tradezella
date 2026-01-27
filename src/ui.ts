import {
  BACK_BUTTON_ID,
  DOWNLOAD_BUTTON_ID,
  DROPZONE_ID,
  LIST_ID,
  PANEL_ID,
  SELECT_BUTTON_ID,
  STATUS_ID,
  UPLOAD_BUTTON_ID,
} from './constants';

export type StatusState = 'ok' | 'error' | 'info';

export type PanelHandlers = {
  onFileSelected: (file: File) => void;
  onUpload: () => void;
  onDownload: () => void;
  onBack: () => void;
  onRemoveRow: (index: number) => void;
};

let panelEl: HTMLElement | null = null;
let panelReady = false;
let fileInput: HTMLInputElement | null = null;
let listEl: HTMLDivElement | null = null;
let dropzoneEl: HTMLDivElement | null = null;
let selectButton: HTMLButtonElement | null = null;
let uploadButton: HTMLButtonElement | null = null;
let downloadButton: HTMLButtonElement | null = null;
let backButton: HTMLButtonElement | null = null;

export function ensurePanelReady(handlers: PanelHandlers): HTMLElement {
  if (!panelEl) {
    panelEl = ensurePanel();
  }
  if (!panelReady) {
    setupDropZone(panelEl, handlers);
    renderRows([]);
    setStatus('', 'info');
    panelReady = true;
  }
  return panelEl;
}

export function renderRows(rows: string[][]): void {
  if (!listEl) {
    listEl = document.getElementById(LIST_ID) as HTMLDivElement | null;
  }
  if (!dropzoneEl) {
    dropzoneEl = document.getElementById(DROPZONE_ID) as HTMLDivElement | null;
  }
  if (!listEl || !dropzoneEl) return;
  const list = listEl;

  list.innerHTML = '';
  if (rows.length === 0) {
    updateEmptyState(rows.length);
    return;
  }

  rows.forEach((row, index) => {
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

  updateEmptyState(rows.length);
}

export function updateActionButtons(rowCount: number): void {
  if (!selectButton) {
    selectButton = document.getElementById(SELECT_BUTTON_ID) as HTMLButtonElement | null;
  }
  if (!uploadButton) {
    uploadButton = document.getElementById(UPLOAD_BUTTON_ID) as HTMLButtonElement | null;
  }
  if (!downloadButton) {
    downloadButton = document.getElementById(DOWNLOAD_BUTTON_ID) as HTMLButtonElement | null;
  }
  const hasRows = rowCount > 0;

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

export function updateEmptyState(rowCount: number): void {
  if (!listEl) {
    listEl = document.getElementById(LIST_ID) as HTMLDivElement | null;
  }
  if (!dropzoneEl) {
    dropzoneEl = document.getElementById(DROPZONE_ID) as HTMLDivElement | null;
  }
  if (!backButton) {
    backButton = document.getElementById(BACK_BUTTON_ID) as HTMLButtonElement | null;
  }
  if (!listEl || !dropzoneEl) return;
  const hasRows = rowCount > 0;
  dropzoneEl.style.display = hasRows ? 'none' : 'flex';
  listEl.style.display = hasRows ? '' : 'none';
  if (backButton) backButton.style.display = hasRows ? 'inline-flex' : 'none';
  updateActionButtons(rowCount);
}

export function setStatus(message: string, state: StatusState = 'info'): void {
  const status = document.getElementById(STATUS_ID);
  if (!status) return;
  status.textContent = message;
  status.classList.remove('ok', 'error');
  if (state === 'ok') status.classList.add('ok');
  if (state === 'error') status.classList.add('error');
  status.style.display = message ? '' : 'none';
}

function formatRowDisplay(row: string[]): string {
  return row.join(' | ');
}

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
    <div class="status" id="${STATUS_ID}"></div>
    <div class="list" id="${LIST_ID}"></div>
    <div class="actions">
      <button type="button" id="${SELECT_BUTTON_ID}">Select File</button>
      <button type="button" id="${UPLOAD_BUTTON_ID}" disabled>Upload CSV</button>
      <button type="button" id="${DOWNLOAD_BUTTON_ID}" disabled>Download CSV</button>
    </div>
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(panel);

  return panel;
}

function setupDropZone(panel: HTMLElement, handlers: PanelHandlers): void {
  fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx';
  fileInput.style.display = 'none';
  panel.appendChild(fileInput);

  selectButton = panel.querySelector<HTMLButtonElement>(`#${SELECT_BUTTON_ID}`);
  uploadButton = panel.querySelector<HTMLButtonElement>(`#${UPLOAD_BUTTON_ID}`);
  downloadButton = panel.querySelector<HTMLButtonElement>(`#${DOWNLOAD_BUTTON_ID}`);
  listEl = panel.querySelector<HTMLDivElement>(`#${LIST_ID}`);
  dropzoneEl = panel.querySelector<HTMLDivElement>(`#${DROPZONE_ID}`);
  backButton = panel.querySelector<HTMLButtonElement>(`#${BACK_BUTTON_ID}`);
  const hintEl = panel.querySelector<HTMLDivElement>('.hint');

  if (!selectButton || !uploadButton || !downloadButton || !listEl || !dropzoneEl || !backButton || !fileInput || !hintEl) {
    return;
  }

  const setHintVisible = (visible: boolean) => {
    hintEl.style.display = visible ? '' : 'none';
  };

  selectButton.addEventListener('click', () => {
    if (!fileInput) return;
    fileInput.value = '';
    fileInput.click();
  });

  dropzoneEl.addEventListener('click', () => {
    if (!fileInput) return;
    fileInput.value = '';
    fileInput.click();
  });

  uploadButton.addEventListener('click', () => {
    handlers.onUpload();
  });

  downloadButton.addEventListener('click', () => {
    handlers.onDownload();
  });

  backButton.addEventListener('click', () => {
    if (fileInput) {
      fileInput.value = '';
    }
    setHintVisible(true);
    handlers.onBack();
  });

  listEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button[data-index]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (!Number.isNaN(index)) {
      handlers.onRemoveRow(index);
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput?.files?.[0];
    if (file) {
      setHintVisible(false);
      handlers.onFileSelected(file);
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
      setHintVisible(false);
      handlers.onFileSelected(file);
    }
  });
}
