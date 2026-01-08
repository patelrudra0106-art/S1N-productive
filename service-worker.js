/* service-worker.js */
const CACHE_NAME = 'aura-v6';
const ASSETS = ['./', './index.html', './app.js', './notifications.js', './style.css'];

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Handle clicks: Focus window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            return clients.openWindow('./index.html');
        })
    );
});
