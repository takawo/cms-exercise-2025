# メディア表現発展演習Ⅰ - ルールに基づいて絵を描く

GitHub Pagesで公開する静的Webアプリケーションです。学生の課題作品をギャラリー形式で表示します。

## 公開URL

**GitHub Pages**: <https://takawo.github.io/cms-exercise-2025/>

## 機能

- 課題作品のギャラリー表示（Masonryレイアウト）
- マルチタグ検索機能（分類別カラーリング）
- 無限スクロール対応
- 画像のLazy Loading
- 詳細ビュー（作品の詳細情報とレポート表示）
- レスポンシブデザイン対応
- コンパクトヘッダー（スクロール時に自動切り替え）

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **ホスティング**: GitHub Pages
- **データ形式**: JSON（静的ファイル）

## プロジェクト構造

```text
プロジェクトルート/
├── public/
│   ├── index.html          # メインページ
│   ├── css/
│   │   └── style.css      # スタイルシート
│   ├── js/
│   │   └── app.js         # フロントエンドJavaScript
│   ├── data/
│   │   └── assignments.json  # 課題データ（JSON）
│   └── images/            # 課題画像
├── .gitignore
├── package.json
└── README.md
```

## GitHub Pagesでの公開

### セットアップ手順

1. **リポジトリをGitHubにプッシュ**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **GitHub Pagesの有効化**

   このプロジェクトはGitHub Actionsを使用して自動デプロイされます。

   - GitHubリポジトリの「Settings」→「Pages」に移動
   - 「Source」で「GitHub Actions」を選択
   - `.github/workflows/deploy.yml`が自動的に使用されます
   - `main`ブランチにプッシュすると、自動的にデプロイされます

   **注意**: 初回デプロイ時は、リポジトリの「Settings」→「Actions」→「General」で「Workflow permissions」を「Read and write permissions」に設定してください。

3. **サイトの確認**

   デプロイが完了すると（通常数分）、以下のURLでサイトにアクセスできます：

   ```text
   https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
   ```

   デプロイ状況は「Actions」タブで確認できます。

### データの更新

`public/data/assignments.json`ファイルを編集してコミット・プッシュすると、自動的にサイトが更新されます。

画像ファイルは`public/images/`フォルダに配置してください。

## 来年度のページ作成手順

このテンプレートを使用して、来年度も同様の形式でページを作成できます。

### 1. リポジトリの準備

**オプションA: 新しいリポジトリを作成する場合**

```bash
# このリポジトリをクローン
git clone https://github.com/takawo/cms-exercise-2025.git cms-exercise-2026
cd cms-exercise-2026

# 新しいリモートリポジトリを設定
git remote set-url origin https://github.com/YOUR_USERNAME/cms-exercise-2026.git
git push -u origin main
```

**オプションB: 既存のリポジトリをフォークする場合**

GitHub上でこのリポジトリをフォークし、フォークしたリポジトリをクローンしてください。

### 2. 年度情報の更新

以下のファイルで年度やタイトルを更新してください：

**`public/index.html`**

- タイトル（`<title>`タグ、`<h1>`、`<h2>`など）の年度を更新
- 例: 「2025」→「2026」

**`README.md`**

- プロジェクト名と年度を更新
- GitHub PagesのURLを更新

**`package.json`**

- プロジェクト名と説明を更新（必要に応じて）

### 3. データの準備

**`public/data/assignments.json`の更新**

既存のデータを削除し、新しい年度の課題データを追加してください。

データ形式の例：

```json
[
  {
    "id": "assignment-001",
    "title": "課題タイトル",
    "student": "学生名",
    "image": "images/001.jpg",
    "tags": ["タグ1", "タグ2"],
    "rule": "ルールの説明",
    "reflection": "振り返り"
  }
]
```

**画像ファイルの追加**

1. `public/images/`フォルダに課題画像を配置
2. 画像ファイル名は`assignments.json`の`image`フィールドと一致させる
3. 推奨形式: JPG（ファイルサイズを最適化）

### 4. モーダルコンテンツの更新（オプション）

**`public/index.html`のモーダルセクション（`#courseModal`）**

- 課題の説明文を更新
- 授業の狙いを更新
- 授業資料のリンクを更新（必要に応じて）
- `plotter.gif`を新しい画像に差し替える場合（`public/plotter.gif`を置き換え）

### 5. GitHub Pagesの設定

1. GitHubリポジトリの「Settings」→「Pages」に移動
2. 「Source」で「GitHub Actions」を選択（`.github/workflows/deploy.yml`が自動的に使用されます）
3. または、「Deploy from a branch」を選択し、「main」ブランチの「/ (root)」フォルダを指定

### 6. デプロイと確認

```bash
# 変更をコミット
git add .
git commit -m "2026年度のデータを追加"

# GitHubにプッシュ（自動的にデプロイされます）
git push origin main
```

数分後、GitHub PagesのURLでサイトが公開されます。

### 7. カスタマイズ（オプション）

**色の変更**

`public/css/style.css`の`:root`セクションでカラーパレットを変更できます：

```css
:root {
    --university-primary: #8B1538;  /* プライマリカラー */
    --university-accent: #C41E3A;   /* アクセントカラー */
    /* ... */
}
```

**タグ分類の変更**

タグの分類や色を変更する場合は、`public/css/style.css`のタグ関連のスタイルを編集してください。

### チェックリスト

- [ ] リポジトリ名とURLを更新
- [ ] `public/index.html`のタイトルと年度を更新
- [ ] `public/data/assignments.json`を新しいデータで更新
- [ ] `public/images/`に画像ファイルを追加
- [ ] モーダルのコンテンツを更新（必要に応じて）
- [ ] GitHub Pagesの設定を確認
- [ ] ローカルで動作確認
- [ ] デプロイ後に公開URLで確認

## ローカル開発

### 静的ファイルサーバーで確認

```bash
# publicフォルダに移動
cd public

# PythonのHTTPサーバーを使用
python3 -m http.server 8000

# または、npx serveを使用
npx serve .
```

ブラウザで `http://localhost:8000` にアクセスしてください。

## 機能詳細

### タグ検索機能

- **分類別カラーリング**: タグは4つの分類に分かれて色分けされています
  - **生成手法**（ブルー）: ジェネラティブ、確率的、パターン
  - **データタイプ**（グリーン）: 時系列、データ可視化、生活データ
  - **表現要素**（オレンジ）: 幾何学、記号・文字、線、点、色彩
  - **空間・配置**（パープル）: 空間配置、関係性、スケーリング、順序性

- **マルチタグ検索**: 複数のタグを選択してAND検索が可能

### パフォーマンス最適化

- **Lazy Loading**: Intersection Observer APIを使用した画像の遅延読み込み
- **無限スクロール**: 30件ずつ自動読み込み
- **CSS最適化**: `will-change`と`contain`プロパティによるレンダリング最適化

### アクセシビリティ

- 適切なARIAラベル
- キーボードナビゲーション対応
- スクリーンリーダー対応
- セマンティックHTML

## ブラウザサポート

- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

## ライセンス

MIT
