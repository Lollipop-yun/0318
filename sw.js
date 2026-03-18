const CACHE_NAME = 'lindongji-v1';

// 安装时缓存核心文件
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './storage.js',
                './manifest.json'
            ]);
        })
    );
});

// 拦截请求，优先使用缓存
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
