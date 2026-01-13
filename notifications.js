/* notifications.js */

// --- STATE ---
let notificationHistory = JSON.parse(localStorage.getItem('auraNotificationHistory')) || [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'notification-container';
    // Centered at top
    container.className = 'fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4';
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
    
    // UI Styling - WHITE MODE (Black Borders/Icons)
    // Default is 'Info' -> White bg, Black Border
    let colors = 'bg-white border-slate-200 shadow-xl shadow-slate-200/50';
    let iconColor = 'text-slate-900';
    let iconName = 'bell';

    if (type === 'success') {
        colors = 'bg-white border-slate-900 shadow-xl shadow-slate-200/50'; // Stronger border for success
        iconColor = 'text-black';
        iconName = 'check-circle';
    } else if (type === 'warning') {
        colors = 'bg-white border-slate-300 shadow-xl shadow-slate-200/50';
        iconColor = 'text-slate-600';
        iconName = 'alert-triangle';
    }

    notif.className = `pointer-events-auto relative w-full max-w-sm p-4 rounded-2xl border ${colors} flex gap-3 transform transition-transform cursor-grab active:cursor-grabbing animate-slide-in-top backdrop-blur-md`;
    
    notif.innerHTML = `
        <div class="p-2 bg-slate-100 rounded-full h-fit shrink-0">
            <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor}"></i>
        </div>
        <div class="flex-1">
            <h4 class="font-bold text-sm text-slate-900">${title}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${message}</p>
        </div>
        <div class="h-1 w-8 bg-slate-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2 opacity-50"></div>
    `;

    container.appendChild(notif);
    if (window.lucide) lucide.createIcons();

    // 3. Audio
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2345/2345-preview.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(()=>{});

    // 4. Swipe Logic
    addSwipeLogic(notif);

    // 5. Auto Remove (2 Seconds)
    let removeTimeout = setTimeout(() => {
        dismissNotification(notif, 'up');
    }, 2000);

    notif.addEventListener('touchstart', () => clearTimeout(removeTimeout));
    notif.addEventListener('mousedown', () => clearTimeout(removeTimeout));
};

// --- SWIPE LOGIC ---
function addSwipeLogic(el) {
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isDragging = false;

    const start = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        el.style.transition = 'none';
    };

    const move = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = clientX - startX;
        currentY = clientY - startY;
        el.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentX * 0.05}deg)`;
        el.style.opacity = Math.max(0.5, 1 - (Math.abs(currentX) + Math.abs(currentY)) / 300);
    };

    const end = () => {
        if (!isDragging) return;
        isDragging = false;
        el.style.transition = 'all 0.3s ease-out';
        const distance = Math.sqrt(currentX**2 + currentY**2);
        if (distance > 100) {
            const dirX = currentX > 0 ? 1 : -1;
            const dirY = currentY > 0 ? 1 : -1;
            el.style.transform = `translate(${dirX * 500}px, ${dirY * 500}px)`;
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        } else {
            el.style.transform = 'translate(0, 0)';
            el.style.opacity = '1';
            setTimeout(() => dismissNotification(el, 'up'), 2000);
        }
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
}

function dismissNotification(el, direction = 'up') {
    if(!el) return;
    el.style.transition = 'all 0.4s ease-in';
    el.style.opacity = '0';
    if(direction === 'up') el.style.transform = 'translateY(-50px) scale(0.9)';
    setTimeout(() => { if(el.parentNode) el.remove(); }, 400);
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
    if (notificationHistory.length > 30) notificationHistory.pop();
    localStorage.setItem('auraNotificationHistory', JSON.stringify(notificationHistory));
}

window.openNotificationHistory = function() {
    const modal = document.getElementById('notification-history-modal');
    const list = document.getElementById('notification-history-list');
    
    if(window.closeSettings) window.closeSettings();
    
    modal.classList.remove('hidden');
    list.innerHTML = '';

    if (notificationHistory.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <i data-lucide="bell-off" class="w-10 h-10 mb-3 opacity-50"></i>
                <p class="text-sm">No notifications yet</p>
            </div>
        `;
    } else {
        notificationHistory.forEach(item => {
            // HISTORY UI: White Cards, Slate-900 Icons
            let iconName = 'bell';
            let iconColor = 'text-slate-900 bg-slate-100';

            if (item.type === 'success') { iconName = 'check'; iconColor = 'text-black bg-slate-200'; }
            if (item.type === 'warning') { iconName = 'alert-circle'; iconColor = 'text-slate-600 bg-slate-200'; }

            const div = document.createElement('div');
            div.className = "flex gap-3 p-3 bg-white rounded-xl border border-slate-100";
            div.innerHTML = `
                <div class="w-8 h-8 rounded-full ${iconColor} flex items-center justify-center shrink-0">
                    <i data-lucide="${iconName}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <p class="text-sm font-bold text-slate-900 truncate">${item.title}</p>
                        <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">${item.time}</span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2 mt-0.5">${item.message}</p>
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
    if(confirm("Clear notification history?")) {
        notificationHistory = [];
        localStorage.setItem('auraNotificationHistory', JSON.stringify([]));
        window.openNotificationHistory(); 
    }
};
