/**
 * TROR PFOS Enterprise Service Worker v8
 * Cache Busting, Network First for core assets, Cache First for static assets.
 */

const CACHE_NAME = "tror-pfos-enterprise-v8";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./app.js",
    "./style.css",
    "./manifest.json"
];

// Install Event: Skip waiting immediately
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Claim clients and delete all old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch Event: Network First for core assets, Cache First for static files
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    // Check if it's a core asset or HTML/JS/CSS/Manifest (Network First)
    const isCoreAsset = CORE_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', ''))) || 
                        url.pathname.endsWith(".html") || 
                        url.pathname.endsWith(".js") || 
                        url.pathname.endsWith(".css") ||
                        url.pathname.endsWith(".json");

    if (isCoreAsset) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback to index.html for SPA routing if offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
                })
        );
    } else {
        // Cache First strategy for static assets (icons, fonts, images)
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fail silently or return fallback if needed
                });
            })
        );
    }
});
