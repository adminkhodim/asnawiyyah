const CACHE_NAME = 'asnawiyyah-cache-v6';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.min.css',
  '/assets/img/brand-header.png',
  '/assets/img/logo-asnawiyyah.jpg',
  '/assets/img/kartu-santri.png',
  '/assets/img/abi-cholil.jpg',
  '/data-maulid-dibai.js',
  '/js/api.js',
  '/js/data-programs.js',
  '/js/programs.js',
  '/js/ppdb.js',
  '/js/ibadah.js',
  '/js/admin.js',
  '/js/alumni.js',
  '/js/auth.js',
  '/js/main.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Pre-caching some assets failed:', err);
      });
    })
  );
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
  // Hanya proses request GET dengan skema http/https (Cache API tidak mendukung non-GET maupun skema non-http seperti chrome-extension://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

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
