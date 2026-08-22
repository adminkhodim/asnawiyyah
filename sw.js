const CACHE_NAME = 'asnawiyyah-cache-v1';

self.addEventListener('install', event => {
  // Langsung aktifkan service worker baru tanpa menunggu
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
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
