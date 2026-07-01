// Bump CACHE_VERSION on every deploy to purge stale caches automatically
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `hisab-static-${CACHE_VERSION}`;
const NAV_CACHE = `hisab-nav-${CACHE_VERSION}`;

// Pre-cache only the smallest critical assets
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/logo.png',
];

// File extensions that are safe for Cache-First (they have content hashes in filenames)
const HASHED_STATIC_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf'];

function isHashedStatic(url) {
  const { pathname } = new URL(url);
  return HASHED_STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
    && (pathname.startsWith('/_next/static/') || pathname.startsWith('/fonts/'));
}

// ---------------------------------------------------------------------------
// Install — pre-cache critical assets and activate immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate — delete all caches that don't match current version
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          const isOld = !key.endsWith(CACHE_VERSION);
          if (isOld) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — three routing strategies
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip: non-GET, API calls, RSC payloads, non-http schemes
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc') ||
    !request.url.startsWith('http')
  ) {
    return;
  }

  // Strategy 1: Cache-First for hashed static assets (JS, CSS, fonts)
  // Safe because these files have content hashes — if the hash changes, it's a new URL
  if (isHashedStatic(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy 2: Network-First for navigation (HTML pages)
  // Always try to get the latest version; fall back to cache if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(NAV_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Last resort: return cached home page for offline SPA-style fallback
            return caches.match('/') || Promise.reject(new Error('Offline'));
          })
        )
    );
    return;
  }

  // Strategy 3: Stale-While-Revalidate for other assets (images, icons, etc.)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => { /* ignore background fetch errors */ });

      return cached || networkFetch;
    })
  );
});
