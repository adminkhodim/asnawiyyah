const CACHE_NAME = 'asnawiyyah-cache-v103';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.min.css',
  '/assets/img/brand-header.png',
  '/assets/img/logo-asnawiyyah.jpg',
  '/assets/img/og-image.jpg',
  '/assets/img/og-banner.jpg',
  '/assets/img/kartu-santri.png',
  '/assets/img/abi-cholil.jpg',
  '/data-maulid-dibai.js',
  '/data-qasidah-burdah.js',
  '/data-tahlil-yasin.js',
  '/data-manaqib.js',
  '/js/pwa.js',
  '/js/panduan.js',
  '/js/api.js',
  '/js/db-adapter.js',
  '/js/data-programs.js',
  '/js/programs.js',
  '/js/ppdb.js',
  '/js/ibadah.js',
  '/js/jadwal-sholat.js',
  '/js/kiblat.js',
  '/js/roles.js',
  '/js/admin.js',
  '/js/alumni.js',
  '/js/auth.js',
  '/js/pegawai.js',
  '/js/tahfidz.js',
  '/js/tahfidz-evaluasi.js',
  '/js/keaktifan-asatidz.js',
  '/js/izin-asatidz.js',
  '/js/perpulangan.js',
  '/js/kedisiplinan.js',
  '/js/main.js'
];


self.addEventListener('message', event => {
  if (event.data && (event.data.action === 'skipWaiting' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

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
  // Hanya proses request GET dengan skema http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Jangan sentuh request API pihak ketiga (Supabase, Google Apps Script, Google Drive)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Dokumen Navigasi Halaman (SPA): Network-first dengan fallback ke cache index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            return cached || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Berkas version.json: Network-first agar update terdeteksi tepat waktu
  if (url.pathname === '/version.json') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Aset Statis (JS, CSS, Gambar, Data Bacaan): CACHE-FIRST (Minimalkan CDN Vercel hingga 95%)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika belum ada di cache, unduh dari network lalu simpan ke cache
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
