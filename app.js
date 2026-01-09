/* app.js */

// --- DATE HELPER ---
// Gets the local date in YYYY-MM-DD format to ensure streaks work correctly across midnight
function getLocalISODate() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
}

// --- DATABASE SIMULATION ---
// We simulate a database using LocalStorage
const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('aura_users')) || [],
    saveUsers: (users) => localStorage.setItem('aura_users', JSON.stringify(users)),
    
    getUser: (username) => {
        const users = DB.getUsers();
        return users.find(u => u.username === username);
    },
    
    createUser: (username, password) => {
        const users = DB.getUsers();
        if(users.find(u => u.username === username)) return false; // Exists
        
        const newUser = { 
            username, 
            password, 
            points: 0, 
            streak: 0, 
            lastLogin: '',
            lastStreakDate: null // Track the specific date they last increased their streak
        };
        
        users.push(newUser);
        DB.saveUsers(users);
        return newUser;
    },
    
    updateUser: (updatedUser) => {
        let users = DB.getUsers();
        users = users.map(u => u.username === updatedUser.username ? updatedUser : u);
        DB.saveUsers(users);
    },

    // Get tasks specific to the logged-in user
    getUserTasks: (username) => JSON.parse(localStorage.getItem(`aura_tasks_${username}`)) || [],
    saveUserTasks: (username, tasks) => localStorage.setItem(`aura_tasks_${username}`, JSON.stringify(tasks))
};

// --- STATE ---
let currentUser = JSON.parse(localStorage.getItem('aura_currentUser')); // Persist session
let tasks = [];
let currentFilter = 'all';
let wakeLock = null; 

// --- AUTH ELEMENTS ---
const authScreen = document.getElementById('auth-screen');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
let isLoginMode = true;

// --- APP ELEMENTS ---
const mainHeader = document.getElementById('main-header');
const mainContainer = document.getElementById('main-container');
const navbar = document.getElementById('navbar');
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
    initTheme();
    
    if (currentUser) {
        // User already logged in
        loadApp(currentUser);
    } else {
        // Show Login Screen
        authScreen.classList.remove('hidden');
    }

    // Keep Alive & Reminders
    setInterval(checkReminders, 1000);
    document.addEventListener('click', enableBackgroundMode, { once: true });
    
    // Search Listener
    const searchInput = document.getElementById('search-user-input');
    if(searchInput) searchInput.addEventListener('input', handleSearch);
});

// --- AUTH LOGIC ---
tabLogin.addEventListener('click', (e) => { e.preventDefault(); setAuthMode(true); });
tabSignup.addEventListener('click', (e) => { e.preventDefault(); setAuthMode(false); });

function setAuthMode(isLogin) {
    isLoginMode = isLogin;
    tabLogin.className = isLogin ? "flex-1 pb-2 font-bold text-indigo-600 border-b-2 border-indigo-600" : "flex-1 pb-2 font-medium text-slate-400";
    tabSignup.className = !isLogin ? "flex-1 pb-2 font-bold text-indigo-600 border-b-2 border-indigo-600" : "flex-1 pb-2 font-medium text-slate-400";
    authError.classList.add('hidden');
}

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = authUsernameInput.value.trim();
    const p = authPasswordInput.value.trim();
    if(!u || !p) return;

    if (isLoginMode) {
        const user = DB.getUser(u);
        if (user && user.password === p) {
            login(user);
        } else {
            showAuthError("Invalid username or password");
        }
    } else {
        const newUser = DB.createUser(u, p);
        if (newUser) {
            login(newUser);
        } else {
            showAuthError("Username already exists");
        }
    }
});

function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

function login(user) {
    currentUser = user;
    localStorage.setItem('aura_currentUser', JSON.stringify(user));
    
    // Check if streak was broken while they were away
    checkStreakOnLoad();

    // Transition UI
    authScreen.classList.add('hidden');
    loadApp(user);
}

window.logout = function() {
    currentUser = null;
    localStorage.removeItem('aura_currentUser');
    window.location.reload(); // Reload to show login
}

function loadApp(user) {
    tasks = DB.getUserTasks(user.username);
    
    // Show UI
    mainHeader.classList.remove('hidden');
    mainContainer.classList.remove('hidden');
    navbar.classList.remove('hidden');
    
    updateUserUI();
    renderTasks();
    if(window.lucide) lucide.createIcons();
}

// --- STREAK LOGIC ---

// 1. Check for broken streaks when the app loads
function checkStreakOnLoad() {
    const today = getLocalISODate();
    
    // We only reset here. We do NOT increment here.
    if (currentUser.lastStreakDate) {
        const lastDate = new Date(currentUser.lastStreakDate);
        const currentDate = new Date(today);
        
        // Calculate difference in days
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If gap is more than 1 day (e.g. Last was Jan 1, Today is Jan 3), reset.
        // If diffDays is 0 (Today) or 1 (Yesterday), we keep the streak.
        if (diffDays > 1) {
            currentUser.streak = 0;
        }
    }

    currentUser.lastLogin = today;
    DB.updateUser(currentUser);
}

// 2. Increment streak when a task is done
window.incrementStreak = function() {
    const today = getLocalISODate();
    
    // If we already added to streak today, stop.
    if (currentUser.lastStreakDate === today) return;

    // Logic: If streak is 0, start at 1. Else add 1.
    if (currentUser.streak === 0) {
        currentUser.streak = 1;
    } else {
        currentUser.streak += 1;
    }

    currentUser.lastStreakDate = today;
    
    // Save and Update UI
    DB.updateUser(currentUser);
    updateUserUI();
    
    // Celebration
    if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24'] });
    window.showAuraAlert("Streak Updated! 🔥", `${currentUser.streak} Day Streak!`);
};

// --- TASK LOGIC ---

function addTask(text, date, time) { 
    tasks.unshift({ id: Date.now(), text, date, time, completed: false, notified: false, pointsEarned: 0 }); 
    saveTasks(); 
    enableBackgroundMode(); 
}

function toggleTask(id) {
    tasks = tasks.map(t => {
        if(t.id === id) {
            const isNowCompleted = !t.completed;
            let pointsChange = 0;

            if (isNowCompleted) {
                // --- COMPLETING TASK ---
                
                // 1. UPDATE STREAK
                window.incrementStreak();

                // 2. POINTS LOGIC
                if (t.date && t.time) {
                    const taskDate = new Date(`${t.date}T${t.time}`);
                    const now = new Date();
                    const diffMinutes = (now - taskDate) / 1000 / 60; 
                    
                    if (diffMinutes <= 1) {
                        // ON TIME
                        pointsChange = 50; 
                        window.showAuraAlert("Excellent! 🌟", "+50 Points for being on time.");
                    } else {
                        // LATE (Penalty)
                        pointsChange = -20;
                        window.showAuraAlert("Late Completion", "-20 Points deducted.");
                    }
                } else {
                    // No Time Limit
                    pointsChange = 20;
                    window.showAuraAlert("Good Job! 👍", "+20 Points.");
                }

                currentUser.points += pointsChange;
                t.pointsEarned = pointsChange;
                
                if(pointsChange > 0 && window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1'] });

            } else {
                // --- UNCHECKING TASK (Revert) ---
                currentUser.points -= t.pointsEarned;
                t.pointsEarned = 0; 
                // Note: We generally don't revert streaks because it's messy, 
                // but points are reverted.
            }

            // Save to DB
            DB.updateUser(currentUser);
            updateUserUI();
            return {...t, completed: isNowCompleted};
        }
        return t;
    });
    saveTasks();
}

function deleteTask(id) { 
    tasks = tasks.filter(t => t.id !== id); 
    saveTasks(); 
}

function saveTasks() { 
    DB.saveUserTasks(currentUser.username, tasks);
    renderTasks(); 
}

// --- USER UI ---
function updateUserUI() {
    if(!currentUser) return;
    document.getElementById('user-greeting').textContent = `Hello, ${currentUser.username}`;
    document.getElementById('streak-count').textContent = currentUser.streak;
    document.getElementById('points-count').textContent = currentUser.points;
    document.getElementById('profile-points').textContent = currentUser.points;
    document.getElementById('profile-streak').textContent = currentUser.streak;
    document.getElementById('profile-name-display').textContent = currentUser.username;
}

// --- COMMUNITY / SEARCH LOGIC ---
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (!query) return;

    const allUsers = DB.getUsers();
    const matches = allUsers.filter(u => u.username.toLowerCase().includes(query) && u.username !== currentUser.username);

    if (matches.length === 0) {
        resultsContainer.innerHTML = '<div class="text-center text-slate-400 py-4 text-sm">No users found.</div>';
        return;
    }

    matches.forEach(user => {
        const div = document.createElement('div');
        div.className = 'bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between animate-fade-in';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
                    <i data-lucide="user" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="font-bold text-slate-800 dark:text-white">${user.username}</p>
                    <p class="text-[10px] text-slate-400 uppercase font-bold">Streak: ${user.streak}</p>
                </div>
            </div>
            <div class="bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 rounded-lg">
                <span class="text-sm font-bold text-indigo-600 dark:text-indigo-300">${user.points} pts</span>
            </div>
        `;
        resultsContainer.appendChild(div);
    });
    if(window.lucide) lucide.createIcons();
}


// --- VIEW SWITCHING ---
window.switchView = function(viewName) {
    const views = ['tasks', 'focus', 'community', 'profile'];
    views.forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
        const nav = document.getElementById(`nav-${v}`);
        if(nav) {
            nav.classList.remove('active', 'text-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-500/20', 'dark:text-indigo-300');
            nav.classList.add('text-slate-400');
        }
    });

    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    const activeNav = document.getElementById(`nav-${viewName}`);
    if(activeNav) {
        activeNav.classList.add('active', 'text-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-500/20', 'dark:text-indigo-300');
        activeNav.classList.remove('text-slate-400');
    }
}

// --- STANDARD FUNCTIONS ---
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            if (html.classList.contains('dark')) { html.classList.remove('dark'); localStorage.setItem('auraTheme', 'light'); } 
            else { html.classList.add('dark'); localStorage.setItem('auraTheme', 'dark'); }
        });
    }
}

function renderTasks() {
    taskListEl.innerHTML = '';
    const filtered = tasks.filter(task => (currentFilter === 'all') || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed));
    if (filtered.length === 0) emptyState.classList.remove('hidden'); else emptyState.classList.add('hidden');
    filtered.sort((a, b) => a.completed - b.completed || b.id - a.id);

    filtered.forEach(task => {
        const li = document.createElement('li');
        const isRinging = task.notified && !task.completed && (task.date === new Date().toISOString().split('T')[0]);
        const ringClass = isRinging ? 'ring-2 ring-indigo-500 animate-pulse bg-indigo-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700';
        
        // Point Badge Logic
        let pointBadge = '';
        if(task.completed) {
            if(task.pointsEarned > 0) pointBadge = `<span class="ml-2 text-[10px] font-bold text-emerald-500">+${task.pointsEarned}</span>`;
            else if(task.pointsEarned < 0) pointBadge = `<span class="ml-2 text-[10px] font-bold text-rose-500">${task.pointsEarned}</span>`;
        }

        let metaHtml = '';
        if (task.date || task.time) {
            metaHtml = `<div class="flex items-center gap-3 mt-1 text-[10px] uppercase font-bold tracking-wider ${task.completed ? 'text-slate-400' : 'text-indigo-500'}">${task.date ? `<span><i data-lucide="calendar" class="w-3 h-3 inline mb-0.5"></i> ${task.date}</span>` : ''} ${task.time ? `<span><i data-lucide="clock" class="w-3 h-3 inline mb-0.5"></i> ${task.time}</span>` : ''}</div>`;
        }

        li.className = `flex items-center justify-between p-4 rounded-2xl border shadow-sm transition-all ${ringClass} ${task.completed ? 'opacity-60' : ''}`;
        li.innerHTML = `<div class="flex items-center gap-4 flex-1 overflow-hidden"><button onclick="toggleTask(${task.id})" class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'}">${task.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}</button><div class="flex-1 min-w-0"><p class="truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${escapeHtml(task.text)} ${pointBadge}</p>${metaHtml}</div></div><div class="flex items-center gap-1 pl-2">${!task.completed ? `<button onclick="startFocusOnTask(${task.id}, '${escapeHtml(task.text)}')\" class=\"p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg\"><i data-lucide=\"play\" class=\"w-4 h-4 fill-current\"></i></button>` : ''}<button onclick=\"deleteTask(${task.id})\" class=\"p-2 text-slate-400 hover:text-rose-500 transition-colors\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button></div>`;
        taskListEl.appendChild(li);
    });
    if(window.lucide) lucide.createIcons();
}

function checkReminders() {
    if(!currentUser || !tasks.length) return;
    const now = new Date();
    const currentDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

    tasks.forEach(task => {
        if (!task.completed && !task.notified && task.date && task.time) {
            const [taskH, taskM] = task.time.split(':').map(Number);
            const taskTotalMinutes = (taskH * 60) + taskM;
            if (task.date === currentDate && currentTotalMinutes >= taskTotalMinutes) triggerAlarm(task);
        }
    });
}
function triggerAlarm(task) { task.notified = true; saveTasks(); const audio = document.getElementById('alarm-sound'); if(audio) { audio.volume = 1.0; audio.currentTime = 0; audio.play().catch(()=>{}); } if(navigator.vibrate) navigator.vibrate([500, 200, 500]); if(window.showAuraAlert) window.showAuraAlert("Task Reminder ⏰", `Due now: ${task.text}`); renderTasks(); }
async function enableBackgroundMode() { try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} const silence = document.getElementById('silence'); if(silence) { silence.volume = 1; silence.play().catch(()=>{}); } }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
// Global Helper for Notification (Used in Pomodoro too)
window.showAuraAlert = function(title, body) {
    if("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png' });
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png' });
        });
    }
}
window.startFocusOnTask = function(id, text) { if(window.switchView) window.switchView('focus'); if(window.setFocusTask) window.setFocusTask(text); }

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
