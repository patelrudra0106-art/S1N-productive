/* notifications.js */
const NotificationSystem = {
    
    init: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log("✅ Service Worker Ready"))
                .catch(err => console.error("❌ SW Error", err));
        }
        this.updateButtonUI();
    },

    requestPermission: function() {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then((permission) => {
            this.updateButtonUI();
            if (permission === "granted") {
                this.send("Aura Connected", "Notifications are active! 🚀");
            }
        });
    },

    updateButtonUI: function() {
        const btn = document.getElementById('enable-notifs-btn');
        if(!btn) return;
        if (Notification.permission === "granted") {
            btn.textContent = "Active ✅";
            btn.className = "px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold";
        } else {
            btn.textContent = "Enable";
            btn.className = "px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold";
        }
    },

    send: function(title, body) {
        if (Notification.permission !== "granted") return;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
                    badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
                    vibrate: [500, 200, 500], // Stronger vibration
                    tag: 'aura-task',
                    renotify: true, // Forces phone to ring again if a new task comes
                    requireInteraction: true, // Keeps it on screen (System Style)
                    actions: [
                        { action: 'open', title: 'Open Aura' },
                        { action: 'close', title: 'Dismiss' }
                    ],
                    data: { url: './index.html' }
                });
            });
        } else {
            new Notification(title, { body: body, icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png' });
        }
    },
    
    test: function() {
        this.send("Test Notification", "This is the expanded system style! 🔔");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NotificationSystem.init();
    const btn = document.getElementById('enable-notifs-btn');
    if(btn) btn.addEventListener('click', () => NotificationSystem.requestPermission());
});
