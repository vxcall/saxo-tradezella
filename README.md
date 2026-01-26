# Saxo-Tradezella
Tradezellaでトレードのジャーナルを書きたいけどサクソバンク証券に対応していなくてできない！と思っていませんか？
この拡張機能は、サクソバンク証券の取引履歴ExcelファイルをTradezellaのcsvフォーマットに準拠した形式に変換し、Tradezellaにアップロードできる拡張機能です。

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
   - `chrome://extensions`を開く
   - 右上の**デベロッパーモード** を有効化
   - **パッケージ化されていない拡張機能を読み込む** をクリックしてsaxo-tradezellaフォルダを選択

## 使い方

### サクソバンク証券からデータをダウンロード

- [サクソバンクの口座管理](https://www.saxotrader.com/d/myAccount)にアクセス
- 続いて「取引履歴」を開き、取引履歴を Excel ファイルとしてエクスポート。
<img width="400" height="232" alt="image" src="https://github.com/user-attachments/assets/8f69fd17-3833-4941-9948-f1f505a4ec5c" />

### Tradezellaでデータのアップロード

- TradezellaにアクセスしてFile Uploadのページを開く。
- すると右下にパネルがでてくるので、そこにサクソバンク証券でダウンロードした `.xlsx` ファイルをドラッグ＆ドロップ。

<img width="500" alt="image" src="https://github.com/user-attachments/assets/938c130e-3274-4769-9099-d2785b11f603" />

- 拡張機能が generic CSV に変換し、トレード一覧を出してくれるので除外したい行を適宜削除。(普通は必要ないです)
  
<img width="500" alt="image" src="https://github.com/user-attachments/assets/bb6b9889-c53f-4cde-ad74-570ebbd69762" />

- Upload CSVボタンを押すとそのままアップロードしてくれます。

### Happy Journaling Days!
