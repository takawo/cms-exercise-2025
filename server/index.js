import express from 'express';
import cors from 'cors';
import { getAssignments } from './notion.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// デバッグ用エンドポイント: 環境変数の状態を確認
app.get('/api/debug', (req, res) => {
  res.json({
    hasApiKey: !!process.env.NOTION_API_KEY,
    hasDatabaseId: !!process.env.NOTION_DATABASE_ID,
    databaseId: process.env.NOTION_DATABASE_ID ? process.env.NOTION_DATABASE_ID.substring(0, 8) + '...' : '未設定',
    nodeEnv: process.env.NODE_ENV || '未設定'
  });
});

// APIエンドポイント: すべての課題データを取得
app.get('/api/assignments', async (req, res) => {
  try {
    console.log('=== APIリクエスト受信 ===');
    console.log('環境変数チェック:');
    console.log('- NOTION_API_KEY:', process.env.NOTION_API_KEY ? '設定済み' : '未設定');
    console.log('- NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '設定済み' : '未設定');
    
    const assignments = await getAssignments();
    console.log(`取得成功: ${assignments.length}件のレコード`);
    res.json(assignments);
  } catch (error) {
    console.error('=== APIエラー発生 ===');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    console.error('エラースタック:', error.stack);
    
    const errorMessage = error.message || 'データの取得に失敗しました';
    res.status(500).json({ 
      error: errorMessage,
      type: error.constructor.name,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// ルート: メインページ
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

