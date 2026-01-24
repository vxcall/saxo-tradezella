# Saxo to Tradezella Chrome Extension

This extension converts Saxo Bank trade history Excel files into Tradezella's `generic.csv` format and auto-fills the hidden upload input on the Tradezella page.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select this folder

## Usage

- Visit Tradezella and open the import page.
- Drag and drop a Saxo `.xlsx` file onto the bottom-right panel.
- The extension converts it to the generic CSV and sets the upload input automatically.

## Notes

- Mapping defaults are tuned for Saxo `TradesWithAdditionalInfo`/`Trades` sheets.
- If you need custom mapping (e.g., Spread values), edit `src/content.ts`.
