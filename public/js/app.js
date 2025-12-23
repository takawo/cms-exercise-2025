// グローバル変数
let allAssignments = [];
let sortedAssignments = []; // 学籍番号順でソート済み
let displayedCount = 0; // 表示済みの数
const ITEMS_PER_PAGE = 30; // 1回に表示するアイテム数
let imageObserver = null;
let scrollObserver = null; // 無限スクロール用
let currentDetailIndex = -1; // 現在の詳細ビューのインデックス

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

// APIベースURLの取得（GitHub Pages対応）
const getApiBaseUrl = () => {
    return window.API_BASE_URL || '';
};

// デバッグ情報の取得
const checkDebugInfo = async () => {
    try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/debug`);
        const data = await response.json();
        console.log('デバッグ情報:', data);
        return data;
    } catch (error) {
        console.error('デバッグ情報の取得に失敗:', error);
        return null;
    }
};

// データ取得（モダンなasync/await実装）
const fetchAssignments = async () => {
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        // デバッグ情報を取得
        const debugInfo = await checkDebugInfo();
        if (debugInfo && (!debugInfo.hasApiKey || !debugInfo.hasDatabaseId)) {
            throw new Error('環境変数が正しく設定されていません。.envファイルを確認してください。');
        }

        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/assignments`);
        const data = await response.json();

        if (!response.ok) {
            // サーバーから返された詳細なエラーメッセージを使用
            const errorMessage = data.error || `HTTP error! status: ${response.status}`;
            const errorType = data.type || '';
            throw new Error(errorMessage + (errorType ? ` (${errorType})` : ''));
        }

        if (!Array.isArray(data)) {
            throw new Error('データ形式が正しくありません');
        }

        allAssignments = data;

        // 学籍番号順でソート
        sortedAssignments = [...allAssignments].sort((a, b) => {
            const idA = a.studentId || '';
            const idB = b.studentId || '';
            return idA.localeCompare(idB, 'ja', { numeric: true, sensitivity: 'base' });
        });

        displayedCount = 0;
        loadingEl.style.display = 'none';
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
                1. サーバーのコンソールログを確認してください<br>
                2. .envファイルが正しく設定されているか確認してください<br>
                3. Notionデータベースに統合が接続されているか確認してください
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
            if (entry.isIntersecting && displayedCount < sortedAssignments.length) {
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

// 追加のアイテムを読み込む
const loadMoreItems = () => {
    const nextBatch = sortedAssignments.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);
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

        return `
            <div class="assignment-card" data-assignment-id="${assignment.id}">
                <div class="assignment-content">
                    <div class="assignment-a">
                        ${assignmentAContent}
                    </div>
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
    if (sortedAssignments.length === 0) {
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
    const assignment = sortedAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
        console.error('課題が見つかりません:', assignmentId);
        return;
    }

    // 現在のインデックスを取得
    currentDetailIndex = sortedAssignments.findIndex(a => a.id === assignmentId);

    const nameDisplay = assignment.name ? ` / ${escapeHtml(assignment.name)}` : '';

    // テキストを整形（インデントを削除）
    const ruleText = trimText(assignment.assignmentB1 || '');
    const reflectionText = trimText(assignment.assignmentB2 || '');

    const detailHTML = `
        <div class="detail-header">
            <h2>${escapeHtml(assignment.studentId)}${nameDisplay}</h2>
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

    // スクロールをトップに
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // URLハッシュを更新（ブラウザの戻るボタン対応）
    window.location.hash = `detail/${assignmentId}`;

    // NEXT/PREVボタンの状態を更新
    updateNavigationButtons();
};

// ナビゲーションボタンの状態を更新
const updateNavigationButtons = () => {
    const hasPrev = currentDetailIndex > 0;
    const hasNext = currentDetailIndex < sortedAssignments.length - 1;

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
    if (currentDetailIndex > 0) {
        const prevAssignment = sortedAssignments[currentDetailIndex - 1];
        showDetailView(prevAssignment.id);
    }
};

// 次の課題を表示
const showNextDetail = () => {
    if (currentDetailIndex < sortedAssignments.length - 1) {
        const nextAssignment = sortedAssignments[currentDetailIndex + 1];
        showDetailView(nextAssignment.id);
    }
};

// ギャラリービューに戻る
const showGalleryView = () => {
    galleryView.style.display = 'block';
    detailView.style.display = 'none';
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

// ヘッダーオーバーレイのスクロール制御
let lastScrollTop = 0;
let scrollThreshold = 100; // この値以上スクロールすると非表示
let isHeaderVisible = true;

const initHeaderScrollControl = () => {
    const headerCard = document.querySelector('.header-overview-card');
    if (!headerCard) return;

    const handleScroll = () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScrollTop > scrollThreshold) {
            // スクロールダウン時
            if (currentScrollTop > lastScrollTop && isHeaderVisible) {
                headerCard.classList.add('hidden');
                isHeaderVisible = false;
            }
            // スクロールアップ時
            else if (currentScrollTop < lastScrollTop && !isHeaderVisible) {
                headerCard.classList.remove('hidden');
                isHeaderVisible = true;
            }
        } else {
            // 上部に戻った場合は常に表示
            if (!isHeaderVisible) {
                headerCard.classList.remove('hidden');
                isHeaderVisible = true;
            }
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    // スクロールイベントをデバウンス
    const debouncedHandleScroll = debounce(handleScroll, 10);
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });

    // 初期の高さを設定
    const updateSpacerHeight = () => {
        const height = headerCard.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    updateSpacerHeight();
    window.addEventListener('resize', debounce(updateSpacerHeight, 100));
};

// 初期化（DOMContentLoadedを待つ）
const init = async () => {
    // ヘッダースクロール制御を初期化
    initHeaderScrollControl();

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

