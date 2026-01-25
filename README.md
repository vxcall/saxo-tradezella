# Saxo から Tradezella への Chrome 拡張機能

この拡張機能は Saxo Bank の取引履歴 Excel ファイルを Tradezella の `generic.csv` 形式に変換し、Tradezella ページの隠しアップロード入力を自動でセットします。

## セットアップ

1. 依存関係をインストール:
   ```bash
   npm install
   ```
2. 拡張機能をビルド:
   ```bash
   npm run build
   ```
3. Chrome に拡張機能を読み込む:
   - Open `chrome://extensions`
   - **Developer mode** を有効化
   - **Load unpacked** をクリックしてこのフォルダを選択

## 使い方

- Saxo trader go に移動し、「資産管理」タブをクリックしてから「口座管理」に戻すリンクをクリック
<img width="923" height="319" alt="image" src="https://github.com/user-attachments/assets/413ef8a3-b390-42b1-8e8b-28c0aa45ffb9" />

- 続いて「取引履歴」を開き、取引履歴を Excel ファイルとしてエクスポート。
<img width="400" height="232" alt="image" src="https://github.com/user-attachments/assets/8f69fd17-3833-4941-9948-f1f505a4ec5c" />

- Tradezella にアクセスしてインポートページを開く。
- 右下のパネルに Saxo の `.xlsx` ファイルをドラッグ＆ドロップ。
- 拡張機能が generic CSV に変換し、除外したい行を削除できる。
- 「Upload CSV」ボタンがアップロード入力を自動でセット。

初期状態
<img width="1157" height="580" alt="image" src="https://github.com/user-attachments/assets/4503f365-9cbd-4ab0-be71-bfce0e2ecea7" />

ドラッグ＆ドロップ後
<img width="1169" height="560" alt="image" src="https://github.com/user-attachments/assets/bb6b9889-c53f-4cde-ad74-570ebbd69762" />

アップロード成功！
<img width="1173" height="169" alt="image" src="https://github.com/user-attachments/assets/c98e2652-d537-4836-a60c-5e5229f528b9" />
