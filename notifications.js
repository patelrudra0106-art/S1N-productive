/* notifications.js */
const NotificationSystem = {
    
    // 1. Request Permission
    requestPermission: async function() {
        if (!("Notification" in window)) {
            alert("Notifications not supported on this device.");
            return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        this.updateButtonUI();

        if (permission === "granted") {
            // Register Service Worker immediately if granted
            this.registerSW();
            this.send("Aura Active", "Notifications are now enabled! 🚀");
        } else if (permission === "denied") {
            alert("Notifications are blocked. Please click the Lock icon 🔒 in your URL bar and 'Reset Permissions'.");
        }
    },

    // 2. Register Service Worker (Crucial for Android)
    registerSW: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log("Service Worker Registered!", reg))
                .catch(err => console.log("SW Failed:", err));
        }
    },

    // 3. Update Button Text
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

    // 4. Send Notification (The Android Fix)
    send: function(title, body) {
        // Fallback: Toast if permission denied
        if (Notification.permission !== "granted") {
            this.showToast(title, body);
            return;
        }

        // METHOD A: Service Worker (Best for Android)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3239/3239952.png',
                    vibrate: [200, 100, 200],
                    tag: 'aura-task'
                });
            });
        } 
        // METHOD B: Standard (PC/Laptop)
        else {
            try {
                const notif = new Notification(title, {
                    body: body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3239/3239952.png',
                    vibrate: [200, 100, 200]
                });
                notif.onclick = () => { window.focus(); notif.close(); };
            } catch (e) {
                console.log("Standard notification failed, trying toast.");
                this.showToast(title, body);
            }
        }
    },

    // 5. Toast Fallback (Keep this!)
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
            <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400 shrink-0"><i data-lucide="bell" class="w-5 h-5"></i></div>
            <div class="min-w-0"><h4 class="font-bold text-sm text-slate-800 dark:text-white">${title}</h4><p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">${body}</p></div>
        `;
        container.appendChild(toast);
        if(window.lucide) lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
    },
    
    test: function() {
        this.send("Test Notification", "If you see this, Aura is ready! 🚀");
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to register SW on load
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
    
    const btn = document.getElementById('enable-notifs-btn');
    if(btn) btn.addEventListener('click', () => NotificationSystem.requestPermission());
    NotificationSystem.updateButtonUI();
});
