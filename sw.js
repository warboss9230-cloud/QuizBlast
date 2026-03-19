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
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap',
  // Question JSON files
  './questions/class1/math.json',
  './questions/class1/english.json',
  './questions/class1/hindi.json',
  './questions/class1/science.json',
  './questions/class1/computer.json',
  './questions/class1/evs.json',
  './questions/class1/gk.json',
  './questions/class1/economics.json',
  './questions/class1/space.json',
  './questions/class1/animals.json',
  './questions/class2/math.json',
  './questions/class2/english.json',
  './questions/class2/hindi.json',
  './questions/class2/science.json',
  './questions/class2/computer.json',
  './questions/class2/evs.json',
  './questions/class2/gk.json',
  './questions/class2/economics.json',
  './questions/class2/space.json',
  './questions/class2/animals.json',
  './questions/class3/math.json',
  './questions/class3/english.json',
  './questions/class3/hindi.json',
  './questions/class3/science.json',
  './questions/class3/computer.json',
  './questions/class3/evs.json',
  './questions/class3/gk.json',
  './questions/class3/economics.json',
  './questions/class3/space.json',
  './questions/class3/animals.json',
  './questions/class4/math.json',
  './questions/class4/english.json',
  './questions/class4/hindi.json',
  './questions/class4/science.json',
  './questions/class4/computer.json',
  './questions/class4/evs.json',
  './questions/class4/gk.json',
  './questions/class4/economics.json',
  './questions/class4/space.json',
  './questions/class4/animals.json',
  './questions/class5/math.json',
  './questions/class5/english.json',
  './questions/class5/hindi.json',
  './questions/class5/science.json',
  './questions/class5/computer.json',
  './questions/class5/evs.json',
  './questions/class5/gk.json',
  './questions/class5/economics.json',
  './questions/class5/space.json',
  './questions/class5/animals.json',
  './questions/class6/math.json',
  './questions/class6/english.json',
  './questions/class6/hindi.json',
  './questions/class6/science.json',
  './questions/class6/computer.json',
  './questions/class6/evs.json',
  './questions/class6/gk.json',
  './questions/class6/economics.json',
  './questions/class6/space.json',
  './questions/class6/animals.json',
  './questions/class7/math.json',
  './questions/class7/english.json',
  './questions/class7/hindi.json',
  './questions/class7/science.json',
  './questions/class7/computer.json',
  './questions/class7/evs.json',
  './questions/class7/gk.json',
  './questions/class7/economics.json',
  './questions/class7/space.json',
  './questions/class7/animals.json',
  './questions/class8/math.json',
  './questions/class8/english.json',
  './questions/class8/hindi.json',
  './questions/class8/science.json',
  './questions/class8/computer.json',
  './questions/class8/evs.json',
  './questions/class8/gk.json',
  './questions/class8/economics.json',
  './questions/class8/space.json',
  './questions/class8/animals.json',
  './questions/class9/math.json',
  './questions/class9/english.json',
  './questions/class9/hindi.json',
  './questions/class9/science.json',
  './questions/class9/computer.json',
  './questions/class9/evs.json',
  './questions/class9/gk.json',
  './questions/class9/economics.json',
  './questions/class9/space.json',
  './questions/class9/animals.json',
  './questions/class10/math.json',
  './questions/class10/english.json',
  './questions/class10/hindi.json',
  './questions/class10/science.json',
  './questions/class10/computer.json',
  './questions/class10/evs.json',
  './questions/class10/gk.json',
  './questions/class10/economics.json',
  './questions/class10/space.json',
  './questions/class10/animals.json',
  './questions/class11/math.json',
  './questions/class11/english.json',
  './questions/class11/hindi.json',
  './questions/class11/science.json',
  './questions/class11/computer.json',
  './questions/class11/evs.json',
  './questions/class11/gk.json',
  './questions/class11/economics.json',
  './questions/class11/space.json',
  './questions/class11/animals.json',
  './questions/class12/math.json',
  './questions/class12/english.json',
  './questions/class12/hindi.json',
  './questions/class12/science.json',
  './questions/class12/computer.json',
  './questions/class12/evs.json',
  './questions/class12/gk.json',
  './questions/class12/economics.json',
  './questions/class12/space.json',
  './questions/class12/animals.json'
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
