/* ════════════════════════════════════════════════
   QuizBlast Service Worker — Offline Support
   Caches all game files for offline play
════════════════════════════════════════════════ */
const CACHE_NAME = 'quizblast-v1';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/script.js',
  './js/security.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap'
];

/* Install — cache all assets */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})))
        .catch(() => cache.addAll(ASSETS.filter(u => !u.startsWith('http'))));
    })
  );
  self.skipWaiting();
});

/* Activate — delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch — serve from cache, fallback to network */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
