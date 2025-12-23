import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Notionデータベースから課題提出データを取得
 */
export async function getAssignments() {
  // 環境変数のチェック
  if (!process.env.NOTION_API_KEY) {
    throw new Error('NOTION_API_KEYが設定されていません。.envファイルを確認してください。');
  }
  
  if (!DATABASE_ID) {
    throw new Error('NOTION_DATABASE_IDが設定されていません。.envファイルを確認してください。');
  }

  try {
    console.log('Notion APIに接続中...');
    console.log('データベースID:', DATABASE_ID);
    
    // まずデータベースの構造を取得してプロパティ名を確認
    const database = await notion.databases.retrieve({ database_id: DATABASE_ID });
    console.log('データベースのプロパティ:', Object.keys(database.properties));
    
    // ソート用のプロパティ名を探す（タイトル型のプロパティ）
    let sortProperty = null;
    for (const [key, value] of Object.entries(database.properties)) {
      if (value.type === 'title') {
        sortProperty = key;
        console.log(`ソートプロパティとして使用: ${sortProperty}`);
        break;
      }
    }
    
    // クエリオプションを構築
    const queryOptions = {
      database_id: DATABASE_ID,
    };
    
    // ソートプロパティが見つかった場合のみソートを追加
    if (sortProperty) {
      queryOptions.sorts = [
        {
          property: sortProperty,
          direction: 'ascending',
        },
      ];
    }
    
    const response = await notion.databases.query(queryOptions);

    console.log(`取得したレコード数: ${response.results.length}`);

    // データを整形
    const assignments = response.results.map((page) => {
      const properties = page.properties;
      
      // デバッグ用: 利用可能なプロパティ名をログ出力（最初の1件のみ）
      if (response.results.indexOf(page) === 0) {
        console.log('利用可能なプロパティ:', Object.keys(properties));
        console.log('プロパティの詳細:', Object.entries(properties).map(([key, value]) => ({
          name: key,
          type: value.type
        })));
      }
      
      // プロパティ名を動的に検出（複数の候補を試す）
      // 学籍番号（タイトル型のプロパティを探す）
      let studentId = '';
      const possibleStudentIdNames = ['Aa 名前', '名前', '学籍番号', 'ID'];
      for (const propName of possibleStudentIdNames) {
        if (properties[propName]?.type === 'title' && properties[propName]?.title?.[0]?.plain_text) {
          studentId = properties[propName].title[0].plain_text;
          break;
        }
      }
      // タイトル型のプロパティが見つからない場合、最初のタイトル型を使用
      if (!studentId) {
        for (const [key, value] of Object.entries(properties)) {
          if (value.type === 'title' && value.title?.[0]?.plain_text) {
            studentId = value.title[0].plain_text;
            break;
          }
        }
      }
      
      // 課題A（画像）- ファイル型のプロパティを探す
      let assignmentA = null;
      const possibleAssignmentANames = ['課題A', '課題 A', 'Assignment A'];
      for (const propName of possibleAssignmentANames) {
        if (properties[propName]?.type === 'files' && properties[propName]?.files?.length > 0) {
          assignmentA = properties[propName].files[0].file.url;
          break;
        }
      }
      // ファイル型のプロパティが見つからない場合、最初のファイル型を使用
      if (!assignmentA) {
        for (const [key, value] of Object.entries(properties)) {
          if (value.type === 'files' && value.files?.length > 0) {
            assignmentA = value.files[0].file.url;
            break;
          }
        }
      }
      
      // 課題B-1（テキスト）- リッチテキスト型のプロパティを探す
      let assignmentB1 = '';
      const possibleAssignmentB1Names = ['課題B-1', '課題B-1', '課題 B-1', 'Assignment B-1'];
      for (const propName of possibleAssignmentB1Names) {
        if (properties[propName]?.type === 'rich_text' && properties[propName]?.rich_text?.[0]?.plain_text) {
          assignmentB1 = properties[propName].rich_text[0].plain_text;
          break;
        }
      }
      
      // 課題B-2（テキスト）
      let assignmentB2 = '';
      const possibleAssignmentB2Names = ['課題B-2', '課題B-2', '課題 B-2', 'Assignment B-2'];
      for (const propName of possibleAssignmentB2Names) {
        if (properties[propName]?.type === 'rich_text' && properties[propName]?.rich_text?.[0]?.plain_text) {
          assignmentB2 = properties[propName].rich_text[0].plain_text;
          break;
        }
      }
      
      // 課題Bを結合
      const assignmentB = [assignmentB1, assignmentB2].filter(Boolean).join('\n\n');
      
      // グループ（セレクト型のプロパティを探す）
      let group = '';
      const possibleGroupNames = ['グループ', 'Group', 'group'];
      for (const propName of possibleGroupNames) {
        if (properties[propName]?.type === 'select' && properties[propName]?.select?.name) {
          group = properties[propName].select.name;
          break;
        }
      }
      
      // 氏名（リッチテキスト型のプロパティを探す）
      let name = '';
      const possibleNameNames = ['氏名', '名前', 'Name', 'name'];
      for (const propName of possibleNameNames) {
        // 学籍番号と同じプロパティでないことを確認
        if (propName !== 'Aa 名前' && properties[propName]?.type === 'rich_text' && properties[propName]?.rich_text?.[0]?.plain_text) {
          name = properties[propName].rich_text[0].plain_text;
          break;
        }
      }
      
      return {
        id: page.id,
        studentId,
        name,
        group,
        assignmentA, // 画像URL
        assignmentB, // テキスト（結合済み）
        assignmentB1,
        assignmentB2,
      };
    });

    return assignments;
  } catch (error) {
    console.error('Notion API エラー詳細:');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    
    if (error.code) {
      console.error('エラーコード:', error.code);
    }
    
    // Notion APIのエラータイプに応じた詳細なメッセージ
    if (error.code === 'object_not_found') {
      throw new Error('データベースが見つかりません。データベースIDが正しいか、統合がデータベースに接続されているか確認してください。');
    } else if (error.code === 'unauthorized') {
      throw new Error('認証に失敗しました。Notion APIキーが正しいか確認してください。');
    } else if (error.code === 'restricted_resource') {
      throw new Error('アクセス権限がありません。Notionデータベースに統合を接続してください。');
    } else if (error.message && error.message.includes('property')) {
      throw new Error(`プロパティが見つかりません: ${error.message}。データベースのプロパティ名を確認してください。`);
    }
    
    throw new Error(`Notion APIエラー: ${error.message || '不明なエラーが発生しました'}`);
  }
}

/**
 * 特定の学籍番号でフィルタリング
 */
export async function getAssignmentByStudentId(studentId) {
  const assignments = await getAssignments();
  return assignments.find((a) => a.studentId === studentId);
}

