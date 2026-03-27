/* ════════════════════════════════════════════════
   QuizBlast Service Worker v3
   Network First — always fresh content
════════════════════════════════════════════════ */
const CACHE_NAME = 'quizblast-v3';

const CORE_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/script.js',
  './js/supabase.js',
  './js/security.js',
  './js/boss.js',
  './css/boss.css',
  './manifest.json',
  './icons/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* Install — cache core assets */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS.map(url =>
        new Request(url, { cache: 'reload' })
      )).catch(() => {});
    })
  );
  self.skipWaiting();
});

/* Activate — delete ALL old caches immediately */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch — Network First for HTML/JS/CSS, Cache First for images */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch from network for HTML, JS, CSS files
  const isCore = e.request.destination === 'document' ||
                 e.request.destination === 'script' ||
                 e.request.destination === 'style';

  if (isCore) {
    // Network first — always get fresh
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match(e.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Cache first for fonts and images
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
