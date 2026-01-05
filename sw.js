// Service Worker for HomeHarmony PWA
const CACHE_NAME = 'homeharmony-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch((err) => {
                console.log('Cache addAll error:', err);
                // Continue even if some assets fail to cache
            });
        })
    );
    self.skipWaiting();
});

// Message event - handle SKIP_WAITING message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message, activating immediately');
        self.skipWaiting();
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip audio/media files - let them go directly to network for CORS
    if (event.request.url.includes('.mp3') || 
        event.request.url.includes('.wav') ||
        event.request.url.includes('.ogg') ||
        event.request.url.includes('.flac') ||
        event.request.url.includes('.m4a') ||
        event.request.url.includes('bensound.com') ||
        event.request.url.includes('pixabay.com')) {
        // Let media requests bypass the service worker
        console.log('[SW] Bypassing SW for media request:', event.request.url);
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found
            if (response) {
                return response;
            }

            // Otherwise, fetch from network
            return fetch(event.request)
                .then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200) {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache successful responses
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch((error) => {
                    console.log('[SW] Fetch error for', event.request.url, error);
                    // Network request failed, try to return a cached response
                    return caches.match(event.request);
                });
        })
    );
});
