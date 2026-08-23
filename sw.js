const CACHE_NAME = 'asnawiyyah-cache-v2';

self.addEventListener('install', event => {
  // Langsung aktifkan service worker baru tanpa menunggu
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-first strategy: Ambil dari internet dulu, kalau gagal (offline) baru ambil dari cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jangan cache respon yang tidak valid
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Kloning respons karena stream hanya bisa dibaca sekali
        var responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        // Jika offline, cari di cache
        return caches.match(event.request);
      })
  );
});
