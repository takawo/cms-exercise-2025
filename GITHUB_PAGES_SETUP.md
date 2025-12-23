# GitHub Pages公開手順

このプロジェクトをGitHub Pagesで公開するための手順です。

## 前提条件

- GitHubアカウントを持っていること
- Gitがインストールされていること

## 手順

### 1. GitHubリポジトリの作成

1. GitHubにログインして、新しいリポジトリを作成します
2. リポジトリ名を入力（例: `media-expression-assignment-viewer`）
3. PublicまたはPrivateを選択
4. 「Initialize this repository with a README」はチェックしない
5. 「Create repository」をクリック

### 2. ローカルでGitリポジトリを初期化

```bash
cd "/Users/takawo/Library/CloudStorage/Dropbox/251223メディア表現発展演習Ⅰ_公開ページ"
git init
git add .
git commit -m "Initial commit"
```

### 3. GitHubリポジトリに接続

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git branch -M main
git push -u origin main
```

（`YOUR_USERNAME`と`YOUR_REPOSITORY_NAME`を実際の値に置き換えてください）

### 4. GitHub Pagesの設定

1. GitHubリポジトリのページで「Settings」タブをクリック
2. 左サイドバーから「Pages」を選択
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で「main」を選択
5. 「Folder」で「/ (root)」を選択
6. 「Save」をクリック

### 5. 静的ファイルの配置

GitHub Pagesは静的ファイルのみをホストするため、以下のいずれかの方法を選択してください：

#### 方法A: publicフォルダをルートにコピー（推奨）

```bash
# publicフォルダの内容をルートにコピー
cp -r public/* .
git add .
git commit -m "Add static files for GitHub Pages"
git push
```

#### 方法B: GitHub Actionsを使用して自動デプロイ

`.github/workflows/deploy.yml`ファイルを作成：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### 6. APIエンドポイントの設定

**重要**: GitHub Pagesは静的ファイルのみをホストするため、ExpressサーバーのAPIエンドポイント（`/api/assignments`）は動作しません。

以下のいずれかの方法でAPIをホストする必要があります：

#### オプション1: VercelでAPIをホスト

1. [Vercel](https://vercel.com)にアカウントを作成
2. プロジェクトをインポート
3. `vercel.json`を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    }
  ]
}
```

4. 環境変数を設定（Vercelダッシュボードで）
5. デプロイ

#### オプション2: Netlify Functionsを使用

1. [Netlify](https://www.netlify.com)にアカウントを作成
2. プロジェクトをインポート
3. `netlify.toml`を作成：

```toml
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### オプション3: 別のサーバーでAPIをホスト

APIエンドポイントを別のサーバーでホストし、`public/js/app.js`のAPI URLを変更：

```javascript
const response = await fetch('https://your-api-server.com/api/assignments');
```

### 7. フロントエンドのAPI URLを更新

APIを別のサーバーでホストする場合、`public/js/app.js`のAPI URLを更新してください：

```javascript
// 現在
const response = await fetch('/api/assignments');

// 変更後（例: Vercelでホストする場合）
const response = await fetch('https://your-app.vercel.app/api/assignments');
```

## 注意事項

- `.env`ファイルはGitにコミットしないでください（機密情報が含まれています）
- GitHub Pagesは静的ファイルのみをホストします
- APIエンドポイントは別のサービスでホストする必要があります
- CORSの設定を確認してください

## トラブルシューティング

### ページが表示されない場合

1. GitHub Pagesの設定で正しいブランチとフォルダが選択されているか確認
2. `.nojekyll`ファイルがルートに存在するか確認
3. ブラウザのコンソールでエラーを確認

### APIエラーが発生する場合

1. APIエンドポイントのURLが正しいか確認
2. CORSの設定を確認
3. 環境変数が正しく設定されているか確認

