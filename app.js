/* app.js - Samsung B&W Theme with Toggle */

// --- HELPER: USER SPECIFIC STORAGE ---
function getStorageKey() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (user && user.name) {
        return `auraTasks_${user.name}`;
    }
    return 'auraTasks_guest';
}

// --- STATE ---
let tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [
    { id: 1, text: 'Welcome to Aura! 👋', date: '', time: '', completed: false, notified: false, rewarded: false, completedAt: null }
];
let currentFilter = 'all';
let wakeLock = null; 

// --- ELEMENTS ---
const taskListEl = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');
const addBtn = document.getElementById('add-btn');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme UI
    updateSettingsUI();
    renderTasks();
    setInterval(checkReminders, 1000);

    const activateApp = () => {
        enableBackgroundMode();
        const alarm = document.getElementById('alarm-sound');
        if(alarm) { 
            alarm.volume = 0.1; 
            alarm.play().then(() => { alarm.pause(); alarm.currentTime=0; }).catch(()=>{}); 
        }
        document.removeEventListener('click', activateApp);
    };
    document.addEventListener('click', activateApp);
});

async function enableBackgroundMode() {
    try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
    const silence = document.getElementById('silence');
    if(silence) silence.play().catch(e => {}); 
}

// --- REMINDER LOGIC ---
function checkReminders() {
    const now = new Date();
    const currentDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

    tasks.forEach(task => {
        if (!task.completed && !task.notified && task.date && task.time) {
            const [taskH, taskM] = task.time.split(':').map(Number);
            const taskTotalMinutes = (taskH * 60) + taskM;
            
            if (task.date === currentDate) {
                if (currentTotalMinutes >= taskTotalMinutes) {
                    triggerAlarm(task);
                }
            }
        }
    });
}

function triggerAlarm(task) {
    task.notified = true;
    saveTasks();
    const audio = document.getElementById('alarm-sound');
    if(audio) { audio.volume = 1.0; audio.currentTime = 0; audio.play().catch(e => {}); }
    if(window.showNotification) {
        window.showNotification("Time's Up! ⏰", `Task: ${task.text} is due.`, "warning");
    }
    renderTasks();
}

// --- STANDARD FUNCTIONS ---
function saveTasks() { 
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks)); 
    renderTasks(); 
}

function addTask(text, date, time) { 
    tasks.unshift({ id: Date.now(), text, date, time, completed: false, notified: false, rewarded: false, completedAt: null }); 
    saveTasks(); 
    enableBackgroundMode(); 
}

function toggleTask(id) {
    tasks = tasks.map(t => {
        if(t.id === id) {
            const isCompleted = !t.completed;
            let markRewarded = t.rewarded;
            let completedAt = isCompleted ? Date.now() : null; 
            
            if(isCompleted) {
                if (!t.rewarded) {
                    markRewarded = true;
                    if(window.updateStreak) window.updateStreak();
                    
                    // CONFETTI: White Mode = Black/Gray. Dark Mode = White/Gray.
                    const isDark = document.documentElement.classList.contains('dark');
                    const colors = isDark ? ['#FFFFFF', '#CCCCCC', '#888888'] : ['#000000', '#333333', '#888888'];
                    
                    if(window.confetti) confetti({ 
                        particleCount: 50, 
                        spread: 60, 
                        origin: { y: 0.7 }, 
                        colors: colors
                    });

                    if (window.addPoints) {
                        let points = 0;
                        let reason = "";
                        if (!t.time) {
                            points = 5;
                            reason = "Task completed";
                        } else {
                            const now = new Date();
                            const [tH, tM] = t.time.split(':').map(Number);
                            const taskDate = t.date ? new Date(t.date) : now;
                            taskDate.setHours(tH, tM, 0, 0);

                            const nowTime = now.getTime();
                            const taskTime = taskDate.getTime();

                            if (nowTime <= taskTime) {
                                points = 20;
                                reason = "Early Completion Bonus!";
                            } else {
                                points = -50;
                                reason = "Completed after deadline.";
                            }
                        }
                        window.addPoints(points, reason);
                    }
                }
            }
            return {...t, completed: isCompleted, rewarded: markRewarded, completedAt: completedAt};
        }
        return t;
    });
    saveTasks();
}

window.deleteTask = function(id) {
    const btn = document.querySelector(`button[onclick="deleteTask(${id})"]`);
    if (btn) {
        const li = btn.closest('li');
        li.classList.add('animate-slide-out');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id); 
            saveTasks();
        }, 300);
    } else {
        tasks = tasks.filter(t => t.id !== id); 
        saveTasks();
    }
};

window.startFocusOnTask = function(id, text) { if(window.switchView) window.switchView('focus'); if(window.setFocusTask) window.setFocusTask(text); }

// --- THEME SWITCHING LOGIC ---
window.setTheme = function(theme) {
    const html = document.documentElement;
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');

    if(theme === 'dark') {
        html.classList.add('dark');
        localStorage.setItem('auraTheme', 'dark');
        
        // Update Buttons: Light Inactive, Dark Active (White on Slate-700)
        if(btnDark) {
            btnDark.className = "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-white bg-slate-700 shadow-sm ring-1 ring-slate-600";
        }
        if(btnLight) {
            btnLight.className = "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-white";
        }
    } else {
        html.classList.remove('dark');
        localStorage.setItem('auraTheme', 'light');

        // Update Buttons: Light Active (Black on White), Dark Inactive
        if(btnLight) {
            btnLight.className = "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-slate-900 bg-white shadow-sm ring-1 ring-slate-200";
        }
        if(btnDark) {
            btnDark.className = "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900";
        }
    }
    
    // Refresh Icons (Lucide)
    if(window.lucide) lucide.createIcons();
};

window.updateSettingsUI = function() {
    const currentTheme = localStorage.getItem('auraTheme') || 'light';
    window.setTheme(currentTheme);
};

// --- LISTENERS ---
taskForm.addEventListener('submit', (e) => { e.preventDefault(); if(taskInput.value.trim()) { addTask(taskInput.value.trim(), dateInput.value, timeInput.value); taskInput.value = ''; addBtn.disabled = true; }});
taskInput.addEventListener('input', (e) => addBtn.disabled = !e.target.value.trim());

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.className = "filter-btn px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all");
        btn.className = "filter-btn active px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition-all";
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

function renderTasks() {
    taskListEl.innerHTML = '';
    const filtered = tasks.filter(task => (currentFilter === 'all') || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed));
    if (filtered.length === 0) emptyState.classList.remove('hidden'); else emptyState.classList.add('hidden');
    
    filtered.sort((a, b) => a.completed - b.completed);

    filtered.forEach(task => {
        const li = document.createElement('li');
        const isRinging = task.notified && !task.completed;
        
        // DYNAMIC CLASSES for Light/Dark
        const ringClass = isRinging 
            ? 'ring-2 ring-slate-900 dark:ring-white animate-pulse bg-slate-50 dark:bg-slate-800' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700';

        li.className = `flex items-center justify-between p-4 rounded-2xl border shadow-sm transition-all animate-pop ${ringClass} ${task.completed ? 'opacity-50' : ''}`;
        
        let metaHtml = '';
        if (task.date || task.time) {
            let timeColor = task.completed ? 'text-slate-400' : 'text-slate-900 dark:text-white';
            if (isRinging) timeColor = 'text-black dark:text-white font-bold';
            metaHtml = `<div class="flex items-center gap-3 mt-1 text-[10px] uppercase font-bold tracking-wider ${timeColor}">${task.date ? `<span><i data-lucide="calendar" class="w-3 h-3 inline mb-0.5"></i> ${task.date}</span>` : ''} ${task.time ? `<span><i data-lucide="clock" class="w-3 h-3 inline mb-0.5"></i> ${task.time}</span>` : ''}</div>`;
        }
        
        // CHECK BUTTON: Black in Light, White in Dark
        const checkBtnClass = task.completed 
            ? 'bg-black dark:bg-white border-black dark:border-white' 
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400';
        
        const checkIconColor = task.completed ? 'text-white dark:text-black' : '';

        const playBtnHtml = !task.completed ? `<button onclick="startFocusOnTask(${task.id}, '${escapeHtml(task.text)}')\" class=\"p-2 text-black dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600\"><i data-lucide=\"play\" class=\"w-4 h-4 fill-current\"></i></button>` : '';
        const deleteBtnHtml = `<button onclick=\"deleteTask(${task.id})\" class=\"p-2 text-slate-400 hover:text-black dark:hover:text-white transition-colors\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button>`;

        li.innerHTML = `<div class="flex items-center gap-4 flex-1 overflow-hidden"><button onclick="toggleTask(${task.id})" class="w-6 h-6 rounded-full border-2 flex items-center justify-center ${checkBtnClass}">${task.completed ? `<i data-lucide="check" class="w-3.5 h-3.5 ${checkIconColor}"></i>` : ''}</button><div class="flex-1 min-w-0"><p class="truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}">${escapeHtml(task.text)}</p>${metaHtml}</div></div><div class="flex items-center gap-1 pl-2">${playBtnHtml}${deleteBtnHtml}</div>`;
        taskListEl.appendChild(li);
    });
    if(window.lucide) lucide.createIcons();
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// --- PWA LOGIC ---
let deferredPrompt;
const installContainer = document.getElementById('install-container');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if(installContainer) installContainer.classList.remove('hidden');
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if(installContainer) installContainer.classList.add('hidden');
    });
}
window.addEventListener('appinstalled', () => {
    if(installContainer) installContainer.classList.add('hidden');
    deferredPrompt = null;
    if(window.showNotification) window.showNotification("App Installed! 📲", "Launch from your home screen.", "success");
});
