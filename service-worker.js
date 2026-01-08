/* service-worker.js */
const CACHE_NAME = 'aura-v5'; // Increment version
const ASSETS = ['./', './index.html', './app.js', './notifications.js', './style.css'];

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // 1. Handle "Dismiss" action
    if (event.action === 'close') {
        return;
    }

    // 2. Handle "Open" action (or regular click)
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            return clients.openWindow('./index.html');
        })
    );
});
