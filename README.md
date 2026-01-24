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
- The extension converts it to the generic CSV, then lets you delete rows that you wanna exclude.
- 'Upload CSV' button sets the upload input automatically.

First state
<img width="1157" height="580" alt="image" src="https://github.com/user-attachments/assets/4503f365-9cbd-4ab0-be71-bfce0e2ecea7" />

After Drag & Drop
<img width="1169" height="560" alt="image" src="https://github.com/user-attachments/assets/bb6b9889-c53f-4cde-ad74-570ebbd69762" />

Upload succeeded!
<img width="1173" height="169" alt="image" src="https://github.com/user-attachments/assets/c98e2652-d537-4836-a60c-5e5229f528b9" />
