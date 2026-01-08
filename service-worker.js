/* service-worker.js */
const CACHE_NAME = 'aura-v6'; 
const ASSETS = ['./', './index.html', './app.js', './style.css'];

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
