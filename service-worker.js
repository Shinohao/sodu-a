const CACHE_NAME = 'sodu-a-v1.2';
const ASSETS_TO_CACHE = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.svg'
];

// 安装 service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 拦截请求 - 使用 Stale-While-Revalidate 策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // 同时发起网络请求更新缓存
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // 网络请求失败时不处理，使用缓存
        });
        
        // 如果有缓存，先返回缓存，同时后台更新
        if (cachedResponse) {
          // 对于 HTML 文件，我们需要更积极的更新策略
          if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
            // 对于 HTML，同时返回缓存并在后台更新，下次刷新时就能看到新版本
            fetchPromise;
          }
          return cachedResponse;
        }
        
        // 没有缓存时，直接从网络获取
        return fetchPromise;
      });
    })
  );
});