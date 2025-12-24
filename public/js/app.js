// グローバル変数
let allAssignments = [];
let sortedAssignments = []; // 学籍番号順でソート済み
let filteredAssignments = []; // フィルタリング後の課題リスト
let displayedCount = 0; // 表示済みの数
const ITEMS_PER_PAGE = 30; // 1回に表示するアイテム数
let imageObserver = null;
let scrollObserver = null; // 無限スクロール用
let currentDetailIndex = -1; // 現在の詳細ビューのインデックス
let selectedTags = new Set(); // 選択されたタグのセット
let allAvailableTags = new Set(); // 利用可能なすべてのタグ

// DOM要素
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const containerEl = document.getElementById('assignmentsContainer');
const galleryView = document.getElementById('galleryView');
const detailView = document.getElementById('detailView');
const detailContainer = document.getElementById('detailContainer');
const backButton = document.getElementById('backButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const tagFilterEl = document.getElementById('tagFilter');
const tagFilterListEl = document.getElementById('tagFilterList');
const selectedTagsEl = document.getElementById('selectedTags');
const filterResultsEl = document.getElementById('filterResults');
const clearFiltersBtn = document.getElementById('clearFilters');

// タグ生成関数（ルール記述からタグを抽出）
// 改善: 重複タグを統合し、より明確な分類体系に整理
const generateTags = (assignmentB1, assignmentB2) => {
    const tags = new Set();
    const text = (assignmentB1 || '') + ' ' + (assignmentB2 || '');
    const lowerText = text.toLowerCase();

    // 【生成手法】- 作品の生成プロセスや手法に関するタグ
    // ジェネラティブ: 反復、再帰、自動生成などのシステム的な生成手法
    if (/(反復|繰り返し|ループ|再帰|再帰的|再現|生成|自動|アルゴリズム|システム|手続き|プロセス|繋げ|連鎖|続ける)/.test(text)) {
        tags.add('ジェネラティブ');
    }
    // 確率的: ランダム性や偶然性を利用した生成
    if (/(サイコロ|ランダム|確率|偶然|任意|出た目)/.test(text)) {
        tags.add('確率的');
    }
    // パターン: 規則的な模様や構造
    if (/(パターン|模様|規則的|構造|幾何学模様)/.test(text)) {
        tags.add('パターン');
    }

    // 【データタイプ】- 可視化されるデータの種類に関するタグ
    // 時系列: 時間の経過を表現
    if (/(時間|時|日|時間帯|1時間|24時間|時計|時刻|リズム|一日|毎日)/.test(text)) {
        tags.add('時系列');
    }
    // データ可視化: データや記録を視覚的に表現（感情データを含む）
    if (/(データ|記録|計測|残量|バッテリー|歩数|睡眠|感情|気分|起伏|内面|状態|可視化|自分)/.test(text)) {
        tags.add('データ可視化');
    }
    // 生活データ: 日常生活や行動に関するデータ
    if (/(生活|日常|行動|活動|行動パターン)/.test(text)) {
        tags.add('生活データ');
    }

    // 【表現要素】- 使用される視覚的な要素に関するタグ
    // 幾何学: 幾何学的な図形を使用
    if (/(幾何|図形|幾何学|幾何学的|正方形|円|三角形|四角形|多角形)/.test(text)) {
        tags.add('幾何学');
    }
    // 記号・文字: 記号や文字を使用
    if (/(記号|矢印|文字|漢字|ひらがな|カタカナ|キプソル)/.test(text)) {
        tags.add('記号・文字');
    }
    // 線: 線を使用
    if (/(線|直線|曲線|波線|破線|放射|放射線)/.test(text)) {
        tags.add('線');
    }
    // 点: 点を使用
    if (/(点|ドット|点を打つ)/.test(text)) {
        tags.add('点');
    }
    // 色彩: 色や配色に関する要素
    if (/(色|カラー|配色|3色|色相|色相環|濃淡)/.test(text)) {
        tags.add('色彩');
    }

    // 【空間・配置】- 空間的な配置や関係性に関するタグ
    // 空間配置: 位置、配置、空間的な構造（位置関係を含む）
    if (/(座標|位置|配置|空間|場所|中心|中央|角|端|縁|外側|内側)/.test(text)) {
        tags.add('空間配置');
    }
    // 関係性: 要素間の接続や関係
    if (/(接する|交わる|重なる|重ね|繋が|繋げ|埋め尽く)/.test(text)) {
        tags.add('関係性');
    }
    // スケーリング: サイズや拡張に関する要素
    if (/(拡張|広が|広げ|拡大|縮小|大きさ|サイズ)/.test(text)) {
        tags.add('スケーリング');
    }
    // 順序性: 順序や並びに関する要素
    if (/(交互|順番|順序|順|並び)/.test(text)) {
        tags.add('順序性');
    }

    return Array.from(tags);
};

// タグの分類を取得する関数
const getTagCategory = (tag) => {
    // 【生成手法】
    if (['ジェネラティブ', '確率的', 'パターン'].includes(tag)) {
        return 'generation';
    }
    // 【データタイプ】
    if (['時系列', 'データ可視化', '生活データ'].includes(tag)) {
        return 'data';
    }
    // 【表現要素】
    if (['幾何学', '記号・文字', '線', '点', '色彩', '単色'].includes(tag)) {
        return 'expression';
    }
    // 【空間・配置】
    if (['空間配置', '関係性', 'スケーリング', '順序性'].includes(tag)) {
        return 'spatial';
    }
    // 【評価】
    if (['教員による評価'].includes(tag)) {
        return 'evaluation';
    }
    return 'default';
};

// デバウンス関数（モダンな実装）
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Intersection Observer APIを使ったLazy Loadingの初期化
const initLazyLoading = () => {
    // ブラウザサポートチェック
    if (!('IntersectionObserver' in window)) {
        // フォールバック: すべての画像を即座に読み込む
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
        return;
    }

    const imageOptions = {
        root: null,
        rootMargin: '50px', // 50px手前から読み込み開始
        threshold: 0.01
    };

    imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const placeholder = img.parentElement.querySelector('.image-placeholder');

                // 画像の読み込み
                img.src = img.dataset.src;
                img.removeAttribute('data-src');

                // ローディング状態の管理
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                    if (placeholder) placeholder.style.display = 'none';
                });

                img.addEventListener('error', () => {
                    img.classList.add('error');
                    if (placeholder) {
                        placeholder.textContent = '画像の読み込みに失敗しました';
                        placeholder.classList.add('error');
                    }
                });

                observer.unobserve(img);
            }
        });
    }, imageOptions);
};

// データ取得（静的JSONファイルから読み込み）
const fetchAssignments = async () => {
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        // 静的JSONファイルからデータを取得
        const response = await fetch('data/assignments.json');

        if (!response.ok) {
            throw new Error(`データファイルの読み込みに失敗しました: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('データ形式が正しくありません');
        }

        allAssignments = data;

        // すべてのタグを収集
        collectAllTags();

        // 学籍番号順でソート
        sortedAssignments = [...allAssignments].sort((a, b) => {
            const idA = a.studentId || '';
            const idB = b.studentId || '';
            return idA.localeCompare(idB, 'ja', { numeric: true, sensitivity: 'base' });
        });

        // フィルタリング後のリストを初期化
        filteredAssignments = [...sortedAssignments];

        displayedCount = 0;
        loadingEl.style.display = 'none';

        // タグフィルターUIを初期化
        initTagFilter();

        await renderAssignments();
    } catch (error) {
        console.error('エラー:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';

        // エラーメッセージを表示（改行をサポート）
        const errorText = error.message || 'データの取得に失敗しました';
        errorEl.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">エラーが発生しました</div>
            <div style="margin-bottom: 10px;">${escapeHtml(errorText)}</div>
            <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
                <strong>確認事項:</strong><br>
                1. data/assignments.jsonファイルが存在するか確認してください<br>
                2. ファイルパスが正しいか確認してください
            </div>
        `;
    }
};

// HTMLエスケープ（セキュリティ対策）
const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
};

// 無限スクロール用のオブザーバーを初期化
const initInfiniteScroll = () => {
    if (scrollObserver) {
        scrollObserver.disconnect();
    }

    // スクロール監視用のセンチネル要素を作成
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '20px';
    containerEl.appendChild(sentinel);

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && displayedCount < filteredAssignments.length) {
                loadMoreItems();
            }
        });
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });

    scrollObserver.observe(sentinel);
};

// すべてのタグを収集
const collectAllTags = () => {
    allAvailableTags.clear();
    allAssignments.forEach(assignment => {
        const tags = assignment.tags || [];
        tags.forEach(tag => allAvailableTags.add(tag));
    });
};

// タグフィルターUIを初期化
const initTagFilter = () => {
    if (!tagFilterEl || !tagFilterListEl) return;

    // タグフィルターを表示
    tagFilterEl.style.display = 'block';

    // タグボタンを生成（使用頻度順にソート）
    const tagCounts = {};
    allAssignments.forEach(assignment => {
        const tags = assignment.tags || [];
        tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Array.from(allAvailableTags).sort((a, b) => {
        return (tagCounts[b] || 0) - (tagCounts[a] || 0);
    });

    tagFilterListEl.innerHTML = sortedTags.map(tag => {
        const count = tagCounts[tag] || 0;
        const isSelected = selectedTags.has(tag);
        const category = getTagCategory(tag);
        return `
            <button 
                class="tag-filter-btn tag-filter-btn-${category} ${isSelected ? 'active' : ''}" 
                data-tag="${escapeHtml(tag)}"
                data-tag-category="${category}"
                aria-label="${escapeHtml(tag)}で絞り込む (${count}件)"
            >
                ${escapeHtml(tag)} <span class="tag-count">(${count})</span>
            </button>
        `;
    }).join('');

    // タグボタンのクリックイベント
    tagFilterListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.tag-filter-btn');
        if (!btn) return;

        const tag = btn.dataset.tag;
        toggleTag(tag);
    });

    // クリアボタンのイベント
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            selectedTags.clear();
            applyFilters();
        });
    }

    // 初期状態の更新
    updateSelectedTagsDisplay();
    applyFilters();
};

// タグの選択/解除を切り替え
const toggleTag = (tag) => {
    if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
    } else {
        selectedTags.add(tag);
    }
    updateSelectedTagsDisplay();
    applyFilters();
};

// 選択されたタグの表示を更新
const updateSelectedTagsDisplay = () => {
    if (!selectedTagsEl) return;

    if (selectedTags.size === 0) {
        selectedTagsEl.innerHTML = '';
        return;
    }

    selectedTagsEl.innerHTML = `
        <div class="selected-tags-label">選択中のタグ:</div>
        <div class="selected-tags-list">
            ${Array.from(selectedTags).map(tag => {
        const category = getTagCategory(tag);
        return `
                <span class="selected-tag tag-${category}" data-tag-category="${category}">
                    ${escapeHtml(tag)}
                    <button class="remove-tag-btn" data-tag="${escapeHtml(tag)}" aria-label="${escapeHtml(tag)}を解除">×</button>
                </span>
            `;
    }).join('')}
        </div>
    `;

    // 削除ボタンのイベント
    selectedTagsEl.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tag = e.target.closest('.remove-tag-btn').dataset.tag;
            toggleTag(tag);
        });
    });
};

// フィルターを適用
const applyFilters = () => {
    if (selectedTags.size === 0) {
        filteredAssignments = [...sortedAssignments];
    } else {
        filteredAssignments = sortedAssignments.filter(assignment => {
            const assignmentTags = assignment.tags || [];
            const assignmentTagSet = new Set(assignmentTags);
            // 選択されたすべてのタグを含む課題のみ表示（AND検索）
            return Array.from(selectedTags).every(tag => assignmentTagSet.has(tag));
        });
    }

    // タグボタンの状態を更新
    if (tagFilterListEl) {
        tagFilterListEl.querySelectorAll('.tag-filter-btn').forEach(btn => {
            const tag = btn.dataset.tag;
            if (selectedTags.has(tag)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 結果数を表示
    updateFilterResults();

    // 表示を更新
    displayedCount = 0;
    renderAssignments();
};

// フィルター結果を更新
const updateFilterResults = () => {
    if (!filterResultsEl) return;

    if (selectedTags.size === 0) {
        filterResultsEl.textContent = `全${sortedAssignments.length}件`;
    } else {
        filterResultsEl.textContent = `${filteredAssignments.length}件が見つかりました`;
    }
};

// 追加のアイテムを読み込む
const loadMoreItems = () => {
    const nextBatch = filteredAssignments.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);
    if (nextBatch.length === 0) return;

    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    tempDiv.innerHTML = nextBatch.map((assignment) => {
        const assignmentAContent = assignment.assignmentA
            ? `
                <div class="image-wrapper">
                    <div class="image-placeholder">画像を読み込んでいます...</div>
                    <img 
                        data-src="${escapeHtml(assignment.assignmentA)}" 
                        alt="課題A - ${escapeHtml(assignment.studentId)}" 
                        class="assignment-a-image lazy-load"
                        data-assignment-id="${assignment.id}"
                        loading="lazy"
                    >
                </div>
            `
            : '<div class="no-image">画像がありません</div>';

        // タグを取得
        const tags = assignment.tags || [];
        const tagsHTML = tags.length > 0
            ? `<div class="assignment-tags">${tags.map(tag => {
                const category = getTagCategory(tag);
                return `<span class="tag tag-${category}" data-tag-category="${category}">${escapeHtml(tag)}</span>`;
            }).join('')}</div>`
            : '';

        return `
            <div class="assignment-card" data-assignment-id="${assignment.id}">
                <div class="assignment-content">
                    <div class="assignment-a">
                        ${assignmentAContent}
                    </div>
                    ${tagsHTML}
                </div>
            </div>
        `;
    }).join('');

    // センチネルを一時的に削除
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
        sentinel.remove();
    }

    // DOMに追加
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    containerEl.appendChild(fragment);

    displayedCount += nextBatch.length;

    // Lazy Loadingの初期化
    if (imageObserver) {
        document.querySelectorAll('img.lazy-load[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // カードクリックイベントはイベントデリゲーションで処理（loadMoreItems内では設定しない）

    // センチネルを再追加
    const newSentinel = document.createElement('div');
    newSentinel.id = 'scroll-sentinel';
    newSentinel.style.height = '20px';
    containerEl.appendChild(newSentinel);
    if (scrollObserver) {
        scrollObserver.observe(newSentinel);
    }
};

// 課題カードのレンダリング（モダンな実装）
const renderAssignments = async () => {
    if (filteredAssignments.length === 0) {
        containerEl.innerHTML = '<div class="no-results">該当する課題が見つかりませんでした。</div>';
        return;
    }

    // 既存のオブザーバーをクリーンアップ
    if (imageObserver) {
        imageObserver.disconnect();
    }
    if (scrollObserver) {
        scrollObserver.disconnect();
    }

    // コンテナをクリア
    containerEl.innerHTML = '';
    displayedCount = 0;

    // 最初の30個を読み込む
    loadMoreItems();

    // 無限スクロールを初期化
    initInfiniteScroll();

    // Lazy Loadingの初期化
    initLazyLoading();
};

// テキストの前後の空白とインデントを削除
const trimText = (text) => {
    if (!text) return '';

    // まず、すべての空白文字（スペース、タブ、改行前後の空白など）を処理
    let cleaned = String(text)
        .replace(/\r\n/g, '\n') // Windows改行を統一
        .replace(/\r/g, '\n') // Mac改行を統一
        .split('\n') // 行ごとに分割
        .map(line => {
            // 各行の前後の空白を完全に削除
            // 行内の連続する空白（スペース、タブ、全角スペースなど）を1つのスペースに置換
            return line
                .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '') // 前後の全種類の空白を削除
                .replace(/[\s\u3000]+/g, ' '); // 連続する空白を1つのスペースに
        })
        .filter(line => line.trim().length > 0) // 空行を削除
        .join('\n') // 再度結合
        .replace(/\n\s+/g, '\n') // 改行後の空白を削除
        .replace(/\s+\n/g, '\n') // 改行前の空白を削除
        .replace(/\n{3,}/g, '\n\n') // 3つ以上の連続する改行を2つに
        .trim(); // 最終的な前後の空白を削除

    return cleaned;
};

// 詳細ビューの表示
const showDetailView = (assignmentId) => {
    // フィルタリング後のリストから検索（フィルター適用時）
    // 見つからない場合は全リストから検索
    let assignment = filteredAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
        assignment = sortedAssignments.find(a => a.id === assignmentId);
    }

    if (!assignment) {
        console.error('課題が見つかりません:', assignmentId);
        return;
    }

    // 現在のインデックスを取得（フィルタリング後のリスト内でのインデックス）
    currentDetailIndex = filteredAssignments.findIndex(a => a.id === assignmentId);
    if (currentDetailIndex === -1) {
        currentDetailIndex = sortedAssignments.findIndex(a => a.id === assignmentId);
    }

    // テキストを整形（インデントを削除）
    const ruleText = trimText(assignment.assignmentB1 || '');
    const reflectionText = trimText(assignment.assignmentB2 || '');

    // タグを取得
    const tags = assignment.tags || [];
    const tagsHTML = tags.length > 0
        ? `<div class="detail-tags">${tags.map(tag => {
            const category = getTagCategory(tag);
            return `<span class="tag tag-${category}" data-tag-category="${category}">${escapeHtml(tag)}</span>`;
        }).join('')}</div>`
        : '';

    const detailHTML = `
        <div class="detail-header">
            <h2>${escapeHtml(assignment.studentId)}</h2>
            ${tagsHTML}
        </div>
        <div class="detail-content">
            <div class="detail-image-section">
                <h3>自分が設定したルールに基づいて描いたポストカード</h3>
                <div class="detail-image-wrapper">
                    ${assignment.assignmentA
            ? `<img src="${escapeHtml(assignment.assignmentA)}" alt="課題A - ${escapeHtml(assignment.studentId)}">`
            : '<div class="no-image">画像がありません</div>'
        }
                </div>
            </div>
            ${ruleText || reflectionText ? `
            <div class="detail-report-section">
                ${ruleText ? `
                <div class="detail-rule-section">
                    <h3>描画のためのルール設定</h3>
                    <div class="detail-report-text">
                        ${escapeHtml(ruleText)}
                    </div>
                </div>
                ` : ''}
                ${reflectionText ? `
                <div class="detail-reflection-section">
                    <h3>ルールに基づく描画についての考察</h3>
                    <div class="detail-report-text">
                        ${escapeHtml(reflectionText)}
                    </div>
                </div>
                ` : ''}
            </div>
            ` : `
            <div class="detail-report-section">
                <div class="detail-report-text empty">
                    レポートがありません
                </div>
            </div>
            `}
        </div>
    `;

    detailContainer.innerHTML = detailHTML;

    // ビューの切り替え
    galleryView.style.display = 'none';
    detailView.style.display = 'block';

    // 詳細ページでは常にコンパクトヘッダーを表示（PREV/NEXT遷移時も維持）
    const fullHeader = document.getElementById('fullHeader');
    const compactHeader = document.getElementById('compactHeader');
    const headerSpacer = document.querySelector('.header-overview-spacer');
    if (fullHeader && compactHeader) {
        // 強制的にコンパクトヘッダーを表示
        fullHeader.classList.add('hidden');
        compactHeader.classList.add('visible');
        isCompactMode = true; // 詳細ページでは常にコンパクトモード

        // コンパクトヘッダーの高さに合わせてスペーサーを調整
        if (headerSpacer) {
            headerSpacer.classList.add('compact');
            headerSpacer.classList.remove('visible');
        }
    }

    // タグフィルターを非表示
    if (tagFilterEl) {
        tagFilterEl.style.display = 'none';
    }

    // スクロールをトップに（instantで即座に移動してヘッダー切り替えを防ぐ）
    window.scrollTo({ top: 0, behavior: 'instant' });

    // URLハッシュを更新（ブラウザの戻るボタン対応）
    window.location.hash = `detail/${assignmentId}`;

    // NEXT/PREVボタンの状態を更新
    updateNavigationButtons();
};

// ナビゲーションボタンの状態を更新
const updateNavigationButtons = () => {
    const currentList = filteredAssignments.length > 0 ? filteredAssignments : sortedAssignments;
    const hasPrev = currentDetailIndex > 0;
    const hasNext = currentDetailIndex < currentList.length - 1;

    prevButton.disabled = !hasPrev;
    nextButton.disabled = !hasNext;

    if (hasPrev) {
        prevButton.style.opacity = '1';
        prevButton.style.cursor = 'pointer';
    } else {
        prevButton.style.opacity = '0.5';
        prevButton.style.cursor = 'not-allowed';
    }

    if (hasNext) {
        nextButton.style.opacity = '1';
        nextButton.style.cursor = 'pointer';
    } else {
        nextButton.style.opacity = '0.5';
        nextButton.style.cursor = 'not-allowed';
    }
};

// 前の課題を表示
const showPrevDetail = () => {
    const currentList = filteredAssignments.length > 0 ? filteredAssignments : sortedAssignments;
    if (currentDetailIndex > 0) {
        const prevAssignment = currentList[currentDetailIndex - 1];
        showDetailView(prevAssignment.id);
    }
};

// 次の課題を表示
const showNextDetail = () => {
    const currentList = filteredAssignments.length > 0 ? filteredAssignments : sortedAssignments;
    if (currentDetailIndex < currentList.length - 1) {
        const nextAssignment = currentList[currentDetailIndex + 1];
        showDetailView(nextAssignment.id);
    }
};

// ギャラリービューに戻る
const showGalleryView = () => {
    galleryView.style.display = 'block';
    detailView.style.display = 'none';

    // ギャラリービューに戻ったら通常のヘッダー表示に戻す
    const fullHeader = document.getElementById('fullHeader');
    const compactHeader = document.getElementById('compactHeader');
    const headerSpacer = document.querySelector('.header-overview-spacer');
    if (fullHeader && compactHeader) {
        // スクロール位置に応じてヘッダーを表示
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (headerSpacer) {
            headerSpacer.classList.remove('compact');
        }
        if (currentScrollTop <= scrollThreshold) {
            fullHeader.classList.remove('hidden');
            compactHeader.classList.remove('visible');
            isCompactMode = false;
            // フルヘッダーの高さに戻す
            if (headerSpacer) {
                headerSpacer.classList.add('visible');
            }
        } else {
            fullHeader.classList.add('hidden');
            compactHeader.classList.add('visible');
            isCompactMode = true;
            // コンパクトヘッダーの高さに設定
            if (headerSpacer) {
                headerSpacer.classList.add('compact');
            }
        }
    }

    // タグフィルターを表示（ギャラリービューでは表示）
    if (tagFilterEl && allAssignments.length > 0) {
        tagFilterEl.style.display = 'block';
    }

    window.location.hash = '';
};

// 戻るボタンのイベント
backButton.addEventListener('click', showGalleryView);

// NEXT/PREVボタンのイベント
prevButton.addEventListener('click', showPrevDetail);
nextButton.addEventListener('click', showNextDetail);

// キーボードナビゲーション（左右矢印キー）
document.addEventListener('keydown', (e) => {
    if (detailView.style.display !== 'none') {
        if (e.key === 'ArrowLeft') {
            showPrevDetail();
        } else if (e.key === 'ArrowRight') {
            showNextDetail();
        }
    }
});

// ブラウザの戻るボタン対応
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#detail/')) {
        const assignmentId = window.location.hash.replace('#detail/', '');
        showDetailView(assignmentId);
    } else {
        showGalleryView();
    }
});

// ヘッダーオーバーレイのスクロール制御（コンパクトヘッダー対応）
let lastScrollTop = 0;
let scrollThreshold = 150; // この値以上スクロールするとコンパクトヘッダーに切り替え
let isCompactMode = false;

const initHeaderScrollControl = () => {
    const fullHeader = document.getElementById('fullHeader');
    const compactHeader = document.getElementById('compactHeader');
    if (!fullHeader || !compactHeader) return;

    const handleScroll = () => {
        // 詳細ページが表示されている場合は、スクロールイベントを無視
        if (detailView.style.display !== 'none') {
            return;
        }

        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScrollTop > scrollThreshold) {
            // スクロールダウン時
            if (currentScrollTop > lastScrollTop && !isCompactMode) {
                fullHeader.classList.add('hidden');
                compactHeader.classList.add('visible');
                isCompactMode = true;
            }
            // スクロールアップ時
            else if (currentScrollTop < lastScrollTop && isCompactMode) {
                // スクロールアップ時はコンパクトヘッダーを維持（ドロワーが開いている場合は閉じる）
                if (document.getElementById('headerDrawer').classList.contains('open')) {
                    closeDrawer();
                }
            }
        } else {
            // 上部に戻った場合はフルヘッダーを表示
            if (isCompactMode) {
                fullHeader.classList.remove('hidden');
                compactHeader.classList.remove('visible');
                isCompactMode = false;
                closeDrawer();
            }
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    // スクロールイベントをデバウンス
    const debouncedHandleScroll = debounce(handleScroll, 10);
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });

    // 初期の高さを設定
    const updateSpacerHeight = () => {
        const height = fullHeader.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    updateSpacerHeight();
    window.addEventListener('resize', debounce(updateSpacerHeight, 100));
};

// ハンバーガーメニューのドロワー制御
const openDrawer = () => {
    const drawer = document.getElementById('headerDrawer');
    if (drawer) {
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
};

const closeDrawer = () => {
    const drawer = document.getElementById('headerDrawer');
    if (drawer) {
        drawer.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
};

const initHamburgerMenu = () => {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const toggleOverviewDrawer = document.getElementById('toggleOverviewDrawer');

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            openDrawer();
        });
    }

    if (drawerClose) {
        drawerClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDrawer();
        });
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', () => {
            closeDrawer();
        });
    }

    // ドロワー内の「授業の詳細」ボタン
    if (toggleOverviewDrawer && courseModal) {
        toggleOverviewDrawer.addEventListener('click', () => {
            closeDrawer();
            courseModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    // ESCキーでドロワーを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const drawer = document.getElementById('headerDrawer');
            if (drawer && drawer.classList.contains('open')) {
                closeDrawer();
            }
        }
    });
};

// 初期化（DOMContentLoadedを待つ）
const init = async () => {
    // ヘッダースクロール制御を初期化
    initHeaderScrollControl();

    // ハンバーガーメニューを初期化
    initHamburgerMenu();

    await fetchAssignments();

    // ハッシュが設定されている場合は詳細ビューを表示
    if (window.location.hash.startsWith('#detail/')) {
        const assignmentId = window.location.hash.replace('#detail/', '');
        showDetailView(assignmentId);
    }
};

// カードクリックイベント（イベントデリゲーション）
if (containerEl) {
    containerEl.addEventListener('click', (e) => {
        // クリックされた要素が画像の場合
        if (e.target.classList.contains('assignment-a-image')) {
            const assignmentId = e.target.dataset.assignmentId;
            if (assignmentId) {
                e.preventDefault();
                e.stopPropagation();
                showDetailView(assignmentId);
            }
            return;
        }

        // クリックされた要素がカード内の要素の場合
        const card = e.target.closest('.assignment-card');
        if (card) {
            const assignmentId = card.dataset.assignmentId;
            if (assignmentId) {
                e.preventDefault();
                e.stopPropagation();
                showDetailView(assignmentId);
            }
        }
    });
}

// モーダル表示機能
const toggleOverview = document.getElementById('toggleOverview');
const courseModal = document.getElementById('courseModal');
const closeModal = document.getElementById('closeModal');

if (toggleOverview && courseModal) {
    // モーダルを開く
    toggleOverview.addEventListener('click', () => {
        courseModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 背景のスクロールを無効化
    });

    // モーダルを閉じる（×ボタン）
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            courseModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // 背景のスクロールを有効化
        });
    }

    // モーダルの背景をクリックしたときに閉じる
    courseModal.addEventListener('click', (e) => {
        // リンクがクリックされた場合は何もしない（リンクの動作を許可）
        if (e.target.closest('.course-material-link')) {
            return;
        }
        if (e.target === courseModal) {
            courseModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && courseModal.style.display === 'block') {
            courseModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // モーダル内のリンククリックを確実に処理
    const courseMaterialLink = courseModal.querySelector('.course-material-link');
    if (courseMaterialLink) {
        courseMaterialLink.addEventListener('click', (e) => {
            // リンクのデフォルト動作を許可（別タブで開く）
            // preventDefaultは呼ばない
            e.stopPropagation(); // モーダルのクリックイベントに伝播させない
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

