# WebClass Drop

WebClass のレポート提出など、**ファイル選択付きのフォーム**にドラッグ＆ドロップ用の領域を足すブラウザ拡張機能です。実際のアップロードは従来どおり WebClass の「レポート提出」等のボタンで行います。

**利用する大学の WebClass ドメイン**は、**設定ページ**で追加します。初回インストール時に設定タブが自動で開きます。あとからも拡張アイコンのポップアップから「設定を開く」で同じ画面に行けます。

## 機能

- **許可したドメインだけ**で動作（設定でオリジンを追加するときにブラウザの許可ダイアログが出ます）
- **ドラッグ＆ドロップ**または**クリック**で `input[type=file]` にファイルを割り当て
- **指定形式がある課題**では、その形式だけ選べるよう `accept` の補完と検証（`data-type-limit`、`.tips` の表記、`accept` から推定）
- **PDF・画像**のプレビュー、Office 系はアイコン＋メタ情報
- **選択を解除**ボタン
- ポップアップから機能のオン／オフ（設定は `storage` に保存）

## インストール（開発用）

1. Chrome で `chrome://extensions` を開く
2. **デベロッパーモード**をオン
3. **パッケージ化されていない拡張機能を読み込む**で、このリポジトリのルート（`manifest.json` があるフォルダ）を選択
4. 開いた**設定**タブで、WebClass を表示しているブラウザのアドレスバーから **https:// からドメインまで**（例: `https://webclass.example.ac.jp`）をコピーして貼り付け、「追加」する
5. WebClass のページを**再読み込み**する

## アイコン（`icons/`）

| ファイル | 用途 |
|----------|------|
| `icons/icon48.png` | 拡張機能管理画面・ツールバー用（48px） |
| `icons/icon128.png` | 拡張機能管理画面・ストア用（128px） |
| `icons/Icon1024.png` | Chrome ウェブストア掲載用などの高解像度ソース（マニフェストには未登録） |

`manifest.json` の `icons` と `action.default_icon` では **48 / 128** を参照しています。

## プロジェクト構成

```
manifest.json
background.js
icons/
  icon48.png
  icon128.png
  Icon1024.png
popup/
  popup.html
  popup.css
  popup.js
options/
  options.html
  options.css
  options.js
content/
  content.js
  content.css
legal/
  terms.html
  privacy.html
  legal.css
```

## 規約・ポリシー

- [利用規約](https://wcd.ouma3.org/terms.html)
- [プライバシーポリシー](https://wcd.ouma3.org/privacy.html)

（拡張機能内ポップアップからも開けます。）
