const CACHE_NAME = 'hisab-expense-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass caching for:
  // - Non-GET requests (e.g. POST)
  // - API routes (/api/*)
  // - Browser extensions/schemes (e.g. chrome-extension://, file://)
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    !request.url.startsWith('http')
  ) {
    return;
  }

  // 1. Navigation strategy (HTML documents)
  // Use Network-First: Always fetch the latest version online to avoid stale chunk references.
  // Fall back to cache if offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[SW] Navigation fetch failed, checking cache:', error);
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Rethrow the network error so the browser shows its standard offline UI instead of ERR_FAILED
            throw error;
          });
        })
    );
    return;
  }

  // 2. Static Assets strategy (JS, CSS, images, fonts)
  // Use Stale-While-Revalidate: Serve from cache immediately and update in background.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update and update cache silently
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch errors for stale items
          });
        return cachedResponse;
      }

      // Cache miss: fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[SW] Static asset fetch failed:', error);
          // Rethrow to avoid returning undefined (which triggers ERR_FAILED)
          throw error;
        });
    })
  );
});
