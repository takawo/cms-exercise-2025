# メディア表現発展演習Ⅰ - 課題提出データ表示ページ

Notion APIを使用して、課題提出データを取得・表示するWebアプリケーションです。

## 機能

- 課題A（画像）と課題B（テキスト）を1ページに表示
- 学籍番号・氏名での検索機能（デバウンス付き）
- グループ（A/B/C）でのフィルタリング
- 画像の拡大表示（クリックでモーダル表示、ESCキーで閉じる）
- レスポンシブデザイン対応

## モダンな実装

### パフォーマンス最適化

- **Lazy Loading**: Intersection Observer APIを使用した画像の遅延読み込み
- **デバウンス**: 検索入力のデバウンス処理（300ms）でAPI呼び出しを最適化
- **仮想DOM風のレンダリング**: DocumentFragmentを使用した効率的なDOM操作
- **CSS最適化**: `will-change`と`contain`プロパティによるレンダリング最適化

### モダンなJavaScript

- ES6+構文（アロー関数、async/await、テンプレートリテラル）
- Intersection Observer APIによるLazy Loading
- イベントデリゲーションとモダンなイベントハンドリング
- エラーハンドリングの改善

### アクセシビリティ

- 適切なARIAラベル
- キーボードナビゲーション対応（ESCキーでモーダルを閉じる）
- スクリーンリーダー対応
- セマンティックHTML

### UX改善

- 画像読み込み中のプレースホルダー表示
- スムーズなアニメーションとトランジション
- ローディング状態の視覚的フィードバック
- エラー状態の適切な表示

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を記述してください：

```
NOTION_API_KEY=ntn_h3527324670H8Ke9gPMsdjT8AG74hKxHQeXJslaYvJP2R5
NOTION_DATABASE_ID=20c0d23eb3fe8066a5fdffcc67c24e88
```

### 3. サーバーの起動

```bash
npm start
```

開発モード（ファイル変更を自動検知）：

```bash
npm run dev
```

### 4. ブラウザでアクセス

<http://localhost:3000> にアクセスしてください。

## プロジェクト構造

```
プロジェクトルート/
├── server/
│   ├── index.js      # Expressサーバー
│   └── notion.js     # Notion APIクライアント
├── public/
│   ├── index.html    # メインページ
│   ├── css/
│   │   └── style.css # スタイルシート
│   └── js/
│       └── app.js    # フロントエンドJavaScript
├── .env              # 環境変数（要作成）
├── .gitignore
├── package.json
└── README.md
```

## Notion APIの設定

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 新しい統合を作成
3. APIキーを取得
4. データベースに統合を接続（データベースの右上の「...」→「接続」→統合を選択）

## データベース構造

以下のプロパティが必要です：

- **Aa 名前**: タイトル型（学籍番号）
- **課題A**: ファイル型（画像）
- **課題B-1**: リッチテキスト型（レポート1部）
- **課題B-2**: リッチテキスト型（レポート2部）
- **グループ**: セレクト型（Aグループ/Bグループ/Cグループ）- オプション
- **氏名**: リッチテキスト型 - オプション

## 注意事項

- `.env` ファイルはGitにコミットしないでください（`.gitignore`に含まれています）
- Notion APIキーは機密情報です。公開リポジトリには含めないでください
- データベースへのアクセス権限が統合に付与されていることを確認してください

## トラブルシューティング

### データが表示されない場合

1. `.env` ファイルが正しく作成されているか確認
2. Notion APIキーが正しいか確認
3. データベースIDが正しいか確認
4. データベースに統合が接続されているか確認
5. サーバーのコンソールでエラーメッセージを確認

### CORSエラーが発生する場合

`server/index.js` でCORSが有効になっていることを確認してください。

## GitHub Pagesでの公開

このプロジェクトをGitHub Pagesで公開する方法については、[GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md)を参照してください。

### クイックスタート

1. GitHubリポジトリを作成
2. コードをプッシュ
3. GitHub Pagesの設定で「Deploy from a branch」を選択し、`main`ブランチの`/public`フォルダを指定
4. または、GitHub Actionsを使用する場合は、`.github/workflows/deploy.yml`が自動的にデプロイします

**注意**: GitHub Pagesは静的ファイルのみをホストするため、APIエンドポイント（`/api/assignments`）は別のサーバー（Vercel、Netlify等）でホストする必要があります。

APIを別のサーバーでホストする場合、`public/config.js`でAPIベースURLを設定してください：

```javascript
window.API_BASE_URL = 'https://your-api-server.vercel.app';
```

## ライセンス

MIT
