export const HEADER = [
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

export const PANEL_ID = 'tradezella-saxo-drop-panel';
export const STATUS_ID = 'tradezella-saxo-drop-status';
export const LIST_ID = 'tradezella-saxo-row-list';
export const SELECT_BUTTON_ID = 'tradezella-saxo-select';
export const UPLOAD_BUTTON_ID = 'tradezella-saxo-upload';
export const DOWNLOAD_BUTTON_ID = 'tradezella-saxo-download';
export const DROPZONE_ID = 'tradezella-saxo-dropzone';
export const BACK_BUTTON_ID = 'tradezella-saxo-back';
export const UPLOAD_SELECTOR = 'input[name="fileUpload"][type="file"]';
export const TARGET_PATHS = ['/ftux-add-trade/generic/upload', '/tracking/add-trade/file_upload'];

export const SPREAD_BY_ASSET_TYPE: Record<string, string> = {
  FxSpot: 'Stock',
  CfdOnFutures: 'Stock',
};
