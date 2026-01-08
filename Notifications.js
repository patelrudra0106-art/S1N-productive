/* notifications.js */
const NotificationSystem = {
    
    // 1. Request Permission
    requestPermission: function() {
        if (!("Notification" in window)) {
            alert("This browser does not support system notifications.");
            return;
        }

        Notification.requestPermission().then((permission) => {
            this.updateButtonUI();
            if (permission === "granted") {
                this.send("Aura Connected", "Notifications are active! 🔔");
            }
        });
    },

    // 2. Update the Settings Button
    updateButtonUI: function() {
        const btn = document.getElementById('enable-notifs-btn');
        if(!btn) return;

        if (Notification.permission === "granted") {
            btn.textContent = "Active ✅";
            btn.className = "px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors";
        } else if (Notification.permission === "denied") {
            btn.textContent = "Blocked ❌";
            btn.className = "px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors";
        } else {
            btn.textContent = "Enable";
            btn.className = "px-3 py-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors";
        }
    },

    // 3. Main Send Function
    send: function(title, body) {
        // Try System Notification (Status Bar)
        if (Notification.permission === "granted") {
            try {
                // Use the Service Worker registration if available (better for mobile)
                // Otherwise fall back to standard new Notification()
                if(navigator.serviceWorker && navigator.serviceWorker.ready) {
                     navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            body: body,
                            icon: 'https://cdn-icons-png.flaticon.com/512/3239/3239952.png',
                            vibrate: [200, 100, 200],
                            tag: 'aura-app'
                        });
                     });
                } else {
                    const notif = new Notification(title, {
                        body: body,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3239/3239952.png',
                        vibrate: [200, 100, 200],
                        tag: 'aura-app'
                    });
                    notif.onclick = () => { window.focus(); notif.close(); };
                }
            } catch (e) {
                console.log("System notification failed, using Toast fallback.");
                this.showToast(title, body);
            }
        } else {
            // Fallback: In-App Toast
            this.showToast(title, body);
        }
    },

    // 4. In-App Toast (Popup) Fallback
    showToast: function(title, body) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = "fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-xs pointer-events-none";
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = "pointer-events-auto bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-500/30 flex items-start gap-3 backdrop-blur-md animate-fade-in";
        toast.innerHTML = `
            <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400 shrink-0">
                <i data-lucide="bell" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-800 dark:text-white">${title}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">${body}</p>
            </div>
        `;

        container.appendChild(toast);
        if(window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },
    
    // 5. Test Function
    test: function() {
        this.send("Test Notification", "If you see this, Aura is working! 🔔");
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('enable-notifs-btn');
    if(btn) btn.addEventListener('click', () => NotificationSystem.requestPermission());
    NotificationSystem.updateButtonUI();
});
