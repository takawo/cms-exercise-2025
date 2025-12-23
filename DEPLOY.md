# デプロイ手順

## GitHub Pagesへのデプロイ

### 1. リポジトリの準備

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit"

# GitHubリポジトリを作成し、リモートを追加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pagesの設定

#### 方法A: GitHub Actionsを使用（推奨）

1. GitHubリポジトリの「Settings」→「Pages」に移動
2. 「Source」で「GitHub Actions」を選択
3. `main`ブランチにプッシュすると、自動的にデプロイされます

#### 方法B: ブランチから直接デプロイ

1. GitHubリポジトリの「Settings」→「Pages」に移動
2. 「Source」で「Deploy from a branch」を選択
3. 「Branch」で「main」を選択
4. 「Folder」で「/public」を選択
5. 「Save」をクリック

### 3. APIエンドポイントの設定

GitHub Pagesは静的ファイルのみをホストするため、APIエンドポイントは別のサーバーでホストする必要があります。

#### VercelでAPIをホストする場合

1. [Vercel](https://vercel.com)にアカウントを作成
2. プロジェクトをインポート
3. 環境変数を設定：
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
4. デプロイ後、URLを取得（例: `https://your-app.vercel.app`）

#### config.jsの更新

`public/config.js`を編集して、APIベースURLを設定：

```javascript
window.API_BASE_URL = 'https://your-app.vercel.app';
```

このファイルをコミットしてプッシュ：

```bash
git add public/config.js
git commit -m "Update API base URL"
git push
```

### 4. デプロイの確認

数分後、GitHub PagesのURL（`https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`）にアクセスして、サイトが正しく表示されるか確認してください。

## ローカル開発サーバー

開発時は、Expressサーバーを使用：

```bash
npm install
npm start
```

<http://localhost:3000> にアクセスしてください。
