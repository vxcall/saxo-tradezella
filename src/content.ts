import { buildCsvFilename, buildCsvFromMappedRows } from './csv';
import { TARGET_PATHS, UPLOAD_SELECTOR } from './constants';
import { buildRowsFromSheet, mapRow } from './parser';
import { readPreferredSheet } from './xlsx';
import {
  ensurePanelReady,
  renderRows,
  setStatus,
  updateActionButtons,
  type PanelHandlers,
} from './ui';

let currentRows: string[][] = [];
let currentSourceName = '';
let panelEl: HTMLElement | null = null;
let routeWatcherStarted = false;
let lastUrl = window.location.href;

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

function ensurePanelReadyWithHandlers() {
  if (!panelEl) {
    panelEl = ensurePanelReady(panelHandlers);
  }
}

function updatePanelVisibility() {
  lastUrl = window.location.href;
  const shouldShow = isTargetPath(window.location.pathname);
  if (shouldShow) {
    ensurePanelReadyWithHandlers();
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

function updateStatusAfterEdit() {
  updateActionButtons(currentRows.length);
  if (currentRows.length === 0) {
    setStatus('', 'info');
    return;
  }
  setStatus(`Ready to upload or download ${currentRows.length} rows.`, 'ok');
}

async function handleFile(file: File) {
  if (!file.name.toLowerCase().match(/\.xlsx$/)) {
    setStatus('Please drop a .xlsx file.', 'error');
    return;
  }

  setStatus('Reading file...');

  try {
    const sheet = await readPreferredSheet(file);

    if (!sheet) {
      setStatus('No sheet found in workbook.', 'error');
      return;
    }

    const rows = buildRowsFromSheet(sheet.rows);

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
      renderRows(currentRows);
      updateActionButtons(currentRows.length);
      return;
    }

    currentRows = mappedRows;
    currentSourceName = file.name;
    renderRows(currentRows);
    updateStatusAfterEdit();
  } catch (error) {
    console.error('Tradezella extension error', error);
    setStatus('Failed to convert file. See console.', 'error');
  }
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

const panelHandlers: PanelHandlers = {
  onFileSelected: (file) => {
    void handleFile(file);
  },
  onUpload: () => {
    void uploadCurrentRows();
  },
  onDownload: () => {
    downloadCurrentRows();
  },
  onBack: () => {
    currentRows = [];
    currentSourceName = '';
    renderRows(currentRows);
    updateStatusAfterEdit();
  },
  onRemoveRow: (index) => {
    currentRows.splice(index, 1);
    renderRows(currentRows);
    updateStatusAfterEdit();
  },
};

function init() {
  startRouteWatcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
