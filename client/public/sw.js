// Service Worker for Project JIN PWA
const CACHE_NAME = 'project-jin-v1.0.0';
const STATIC_CACHE_NAME = 'project-jin-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'project-jin-dynamic-v1.0.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 必要に応じて他のアセットを追加
];

// オフライン用のフォールバックページ
const OFFLINE_PAGE = '/offline.html';

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // すぐに新しいサービスワーカーをアクティブにする
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    // 古いキャッシュを削除
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('project-jin-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // すぐに新しいサービスワーカーを制御開始
        return self.clients.claim();
      })
  );
});

// フェッチ時の処理（キャッシュ戦略）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 外部APIやWebSocketは除外
  if (!url.origin.includes(self.location.origin) || 
      url.pathname.includes('/api/') ||
      url.pathname.includes('/socket.io/')) {
    return;
  }
  
  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // ナビゲーションリクエスト（ページ遷移）の場合
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // 静的アセットの場合：Cache First戦略
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request);
    }
    
    // その他：Network First戦略
    return await networkFirst(request);
    
  } catch (error) {
    console.error('Fetch handler error:', error);
    
    // フォールバック処理
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/');
      return cachedResponse || new Response('オフラインです', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    throw error;
  }
}

// ナビゲーションリクエストの処理
async function handleNavigationRequest(request) {
  try {
    // ネットワークを優先
    const networkResponse = await fetch(request);
    
    // 成功した場合はキャッシュに保存
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // ネットワークエラー時はキャッシュから返す
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュにもない場合はメインページを返す
    const mainPage = await caches.match('/');
    return mainPage || new Response('オフラインです', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Cache First戦略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // バックグラウンドでキャッシュを更新
    updateCache(request);
    return cachedResponse;
  }
  
  // キャッシュにない場合はネットワークから取得
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First戦略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// バックグラウンドでキャッシュを更新
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// 静的アセットの判定
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         pathname === '/' ||
         pathname === '/index.html' ||
         pathname === '/manifest.json';
}

// メッセージハンドラー（クライアントからの指示）
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch((error) => event.ports[0].postMessage({ success: false, error }));
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// 全キャッシュをクリア
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('project-jin-'))
      .map(name => caches.delete(name))
  );
}

// プッシュ通知（将来的に使用）
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Project JINからの通知',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: data.url || '/',
      actions: [
        {
          action: 'open',
          title: '開く'
        },
        {
          action: 'close',
          title: '閉じる'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Project JIN', options)
    );
  }
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

console.log('Service Worker loaded successfully');