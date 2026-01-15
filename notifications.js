/* notifications.js - S1N Industrial Theme Update */

// --- STATE ---
let notificationHistory = JSON.parse(localStorage.getItem('auraNotificationHistory')) || [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'notification-container';
    // Position: Top Center, z-index high
    container.className = 'fixed top-6 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4';
    document.body.appendChild(container);
});

// --- MAIN SHOW FUNCTION ---
window.showNotification = function(title, message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // 1. Save to History
    saveToHistory(title, message, type);

    // 2. Create Element
    const notif = document.createElement('div');
    
    // Industrial Styling: Black (or White in dark mode) background, sharp borders
    // We use the 'card' variable for background to adapt to theme, but usually toasts need high contrast.
    // Let's make them stand out: Solid Black in Light Mode, Solid White in Dark Mode (Inverse of body)
    
    let iconName = 'bell';
    
    if (type === 'success') iconName = 'check';
    if (type === 'warning') iconName = 'alert-triangle';

    notif.className = `pointer-events-auto relative w-full max-w-sm p-4 bg-main text-body rounded-lg shadow-2xl flex gap-4 items-start transform transition-all cursor-pointer animate-slide-in-top`;
    
    // Inverting colors: bg-main is black in light mode.
    notif.innerHTML = `
        <div class="mt-0.5">
            <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm uppercase tracking-wider leading-none mb-1">${title}</h4>
            <p class="text-xs font-medium opacity-80 leading-relaxed">${message}</p>
        </div>
    `;

    container.appendChild(notif);
    if (window.lucide) lucide.createIcons();

    // 3. Audio (Mechanical Click/Chime)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2345/2345-preview.mp3'); 
    audio.volume = 0.2;
    audio.play().catch(()=>{});

    // 4. Swipe/Click to Dismiss
    notif.addEventListener('click', () => dismissNotification(notif));

    // 5. Auto Remove (3 Seconds)
    let removeTimeout = setTimeout(() => {
        dismissNotification(notif);
    }, 3000);
};

function dismissNotification(el) {
    if(!el) return;
    // Slide out animation
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => { if(el.parentNode) el.remove(); }, 300);
}

// --- HISTORY LOGIC ---
function saveToHistory(title, message, type) {
    const entry = {
        id: Date.now(),
        title,
        message,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
    };
    notificationHistory.unshift(entry);
    if (notificationHistory.length > 50) notificationHistory.pop();
    localStorage.setItem('auraNotificationHistory', JSON.stringify(notificationHistory));
}

// Open the history modal (Render Logic)
window.openNotificationHistory = function() {
    const modal = document.getElementById('notification-history-modal');
    const list = document.getElementById('notification-history-list');
    
    // Close settings if open
    if(window.closeSettings) window.closeSettings();
    
    if(modal) modal.classList.remove('hidden');
    if(!list) return;
    
    list.innerHTML = '';

    if (notificationHistory.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-muted">
                <i data-lucide="bell-off" class="w-8 h-8 mb-2 opacity-50"></i>
                <p class="text-xs uppercase font-bold tracking-wider">No Logs Available</p>
            </div>
        `;
    } else {
        notificationHistory.forEach(item => {
            let iconName = 'bell';
            if (item.type === 'success') iconName = 'check';
            if (item.type === 'warning') iconName = 'alert-triangle';

            const div = document.createElement('div');
            // List Item Style
            div.className = "flex gap-3 p-3 border-b border-border last:border-0";
            div.innerHTML = `
                <div class="mt-0.5 text-main">
                    <i data-lucide="${iconName}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <p class="text-xs font-bold uppercase text-main truncate">${item.title}</p>
                        <span class="text-[9px] text-muted font-mono whitespace-nowrap ml-2">${item.time}</span>
                    </div>
                    <p class="text-xs text-muted mt-0.5 line-clamp-2">${item.message}</p>
                </div>
            `;
            list.appendChild(div);
        });
    }
    if(window.lucide) lucide.createIcons();
};

window.closeNotificationHistory = function() {
    document.getElementById('notification-history-modal').classList.add('hidden');
};

window.clearAllNotifications = function() {
    if(confirm("Permanently delete system logs?")) {
        notificationHistory = [];
        localStorage.setItem('auraNotificationHistory', JSON.stringify([]));
        window.openNotificationHistory(); // Refresh view
    }
};
