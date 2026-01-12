/* app.js */

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
    // Render Tasks
    renderTasks();
    
    // Start Clock
    setInterval(checkReminders, 1000);

    // BACKGROUND KEEP-ALIVE
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
            // NEW: Track when it was completed
            let completedAt = isCompleted ? Date.now() : null; 
            
            if(isCompleted) {
                if (!t.rewarded) {
                    markRewarded = true;
                    if(window.updateStreak) window.updateStreak();
                    if(window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1'] });

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
    // Animation Logic
    const btn = document.querySelector(`button[onclick="deleteTask(${id})"]`);
    if (btn) {
        const li = btn.closest('li');
        li.classList.add('animate-slide-out');
        // Wait for animation
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

// --- SETTINGS: THEME LOGIC ---
window.setTheme = function(theme) {
    const html = document.documentElement;
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');

    if(theme === 'dark') {
        html.classList.add('dark');
        localStorage.setItem('auraTheme', 'dark');
        if(btnDark) { btnDark.classList.add('bg-white', 'text-slate-800', 'shadow-sm', 'dark:bg-slate-600', 'dark:text-white'); btnDark.classList.remove('text-slate-500'); }
        if(btnLight) { btnLight.classList.remove('bg-white', 'text-slate-800', 'shadow-sm', 'dark:bg-slate-600', 'dark:text-white'); btnLight.classList.add('text-slate-500'); }
    } else {
        html.classList.remove('dark');
        localStorage.setItem('auraTheme', 'light');
        if(btnLight) { btnLight.classList.add('bg-white', 'text-slate-800', 'shadow-sm'); btnLight.classList.remove('text-slate-500'); }
        if(btnDark) { btnDark.classList.remove('bg-white', 'text-slate-800', 'shadow-sm', 'dark:bg-slate-600', 'dark:text-white'); btnDark.classList.add('text-slate-500'); }
    }
};

// Initialize Theme UI on Open Settings
window.updateSettingsUI = function() {
    const currentTheme = localStorage.getItem('auraTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    window.setTheme(currentTheme);
};

// --- LISTENERS ---
taskForm.addEventListener('submit', (e) => { e.preventDefault(); if(taskInput.value.trim()) { addTask(taskInput.value.trim(), dateInput.value, timeInput.value); taskInput.value = ''; addBtn.disabled = true; }});
taskInput.addEventListener('input', (e) => addBtn.disabled = !e.target.value.trim());

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.className = "filter-btn px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all");
        btn.className = "filter-btn active px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 transition-all";
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
        const ringClass = isRinging ? 'ring-2 ring-rose-500 animate-pulse bg-rose-50 dark:bg-rose-900/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700';

        // Add pop animation on creation
        li.className = `flex items-center justify-between p-4 rounded-2xl border shadow-sm transition-all animate-pop ${ringClass} ${task.completed ? 'opacity-60' : ''}`;
        
        let metaHtml = '';
        if (task.date || task.time) {
            let timeColor = task.completed ? 'text-slate-400' : 'text-indigo-500';
            if (isRinging) timeColor = 'text-rose-500 font-bold';
            metaHtml = `<div class="flex items-center gap-3 mt-1 text-[10px] uppercase font-bold tracking-wider ${timeColor}">${task.date ? `<span><i data-lucide="calendar" class="w-3 h-3 inline mb-0.5"></i> ${task.date}</span>` : ''} ${task.time ? `<span><i data-lucide="clock" class="w-3 h-3 inline mb-0.5"></i> ${task.time}</span>` : ''}</div>`;
        }
        li.innerHTML = `<div class="flex items-center gap-4 flex-1 overflow-hidden"><button onclick="toggleTask(${task.id})" class="w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}">${task.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}</button><div class="flex-1 min-w-0"><p class="truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${escapeHtml(task.text)}</p>${metaHtml}</div></div><div class="flex items-center gap-1 pl-2">${!task.completed ? `<button onclick="startFocusOnTask(${task.id}, '${escapeHtml(task.text)}')\" class=\"p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg\"><i data-lucide=\"play\" class=\"w-4 h-4 fill-current\"></i></button>` : ''}<button onclick=\"deleteTask(${task.id})\" class=\"p-2 text-slate-400 hover:text-rose-500 transition-colors\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button></div>`;
        taskListEl.appendChild(li);
    });
    if(window.lucide) lucide.createIcons();
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// --- PWA INSTALL LOGIC ---
let deferredPrompt;
const installContainer = document.getElementById('install-container');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // 1. Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // 2. Stash the event so it can be triggered later
    deferredPrompt = e;
    // 3. Show the UI button
    if(installContainer) installContainer.classList.remove('hidden');
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // 4. Show the install prompt
        deferredPrompt.prompt();
        
        // 5. Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        // 6. We've used the prompt, and can't use it again, discard it
        deferredPrompt = null;
        
        // 7. Hide the button immediately after choice
        if(installContainer) installContainer.classList.add('hidden');
    });
}

// Optional: Listen for successful install to permanently hide button
window.addEventListener('appinstalled', () => {
    if(installContainer) installContainer.classList.add('hidden');
    deferredPrompt = null;
    console.log('PWA was installed');
    if(window.showNotification) window.showNotification("App Installed! 📲", "Launch from your home screen.", "success");
});
