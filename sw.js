/**
 * TROR PFOS Enterprise Service Worker
 * Version: tror-pfos-enterprise-v8
 */

const CACHE_NAME = "tror-pfos-enterprise-v8";

const NETWORK_FIRST_ASSETS = [
    "./",
    "./index.html",
    "./app.js",
    "./style.css",
    "./manifest.json"
];

// Install Event: Force immediate installation and skip waiting
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(NETWORK_FIRST_ASSETS);
        })
    );
});

// Activate Event: Claim clients immediately and purge all outdated caches
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

// Fetch Event: Network First strategy for core files, Cache First for static assets
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    
    const isNetworkFirst = NETWORK_FIRST_ASSETS.some(path => 
        url.pathname.endsWith(path) || url.pathname === path || (path === "./" && url.pathname.endsWith("/"))
    );

    if (isNetworkFirst) {
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
                    return caches.match(event.request);
                })
        );
    } else {
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
                    // Fallback for offline static assets if needed
                });
            })
        );
    }
});

// Listen for skip waiting message from client
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
