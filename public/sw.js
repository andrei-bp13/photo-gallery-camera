// Service Worker: cache R2 gallery images for instant scroll-back on mobile
const CACHE = 'orbit-dust-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    const { url } = event.request;
    if (!url.includes('r2.dev') || !url.endsWith('.webp')) return;

    event.respondWith(
        caches.open(CACHE).then(async cache => {
            const cached = await cache.match(event.request);
            if (cached) return cached;

            const response = await fetch(event.request);
            if (response.ok || response.type === 'opaque') {
                cache.put(event.request, response.clone());
            }
            return response;
        }).catch(() => fetch(event.request))
    );
});
