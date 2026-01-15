/* pomodoro.js - S1N Industrial Theme Update */

// --- POMODORO CONFIG ---
let settings = JSON.parse(localStorage.getItem('auraTimerSettings')) || {
    work: 25,
    short: 5,
    long: 15
};

// S1N Theme: Modes are functional, not color-coded.
let MODES = {
    work: { time: settings.work * 60, label: 'FOCUS PROTOCOL' },
    short: { time: settings.short * 60, label: 'SHORT RECHARGE' },
    long: { time: settings.long * 60, label: 'LONG RECHARGE' }
};

// --- STATE ---
let timeLeft = MODES.work.time;
let currentMode = 'work';
let isRunning = false;
let timerInterval = null;
let stats = JSON.parse(localStorage.getItem('auraStats')) || { sessions: 0, minutes: 0 };
let history = JSON.parse(localStorage.getItem('auraHistory')) || [];
let currentFocusTask = null;

// --- ELEMENTS ---
const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const toggleBtn = document.getElementById('timer-toggle');
const resetBtn = document.getElementById('timer-reset');
const progressRing = document.getElementById('progress-ring');
const modeBtns = {
    work: document.getElementById('mode-work'),
    short: document.getElementById('mode-short'),
    long: document.getElementById('mode-long')
};
const statSessions = document.getElementById('sessions-count'); // Might be in reports view now
const historyList = document.getElementById('history-list'); // In Focus view (if added) or Settings
const activeTaskDisplay = document.getElementById('active-task-display');
const focusTaskText = document.getElementById('focus-task-text');

// --- CONSTANTS ---
// Based on the SVG in index.html (r=118)
const CIRCLE_RADIUS = 118;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// --- INIT ---
function initPomodoro() {
    if(progressRing) {
        progressRing.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressRing.style.strokeDashoffset = 0;
    }
    updateDisplay();
    // updateStatsDisplay(); // Removed if stats are only in Reports view now
    renderHistory(); // Renders in Notification History or if a list exists in Focus view
    setupModeListeners();
}

// --- CORE FUNCTIONS ---
function updateDisplay() {
    if(!timerDisplay) return;
    
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
    
    // Ring Progress (Monochrome)
    if(progressRing) {
        const totalTime = MODES[currentMode].time;
        const offset = CIRCLE_CIRCUMFERENCE - (timeLeft / totalTime) * CIRCLE_CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = offset;
    }
    
    document.title = isRunning ? `[${m}:${s}] FOCUS` : 'AURA.';
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    
    // Industrial Button State: "Active"
    toggleBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5 fill-current"></i> Pause';
    toggleBtn.classList.add('opacity-90'); 
    
    if(window.lucide) lucide.createIcons();
    timerStatus.textContent = 'EXECUTING';
    timerStatus.classList.add('animate-pulse', 'text-main');
    
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    
    // Industrial Button State: "Ready"
    toggleBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 fill-current"></i> Start';
    toggleBtn.classList.remove('opacity-90');
    
    timerStatus.textContent = 'PAUSED';
    timerStatus.classList.remove('animate-pulse', 'text-main');
    
    if(window.lucide) lucide.createIcons();
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode].time;
    timerStatus.textContent = 'READY';
    updateDisplay();
}

function completeTimer() {
    pauseTimer();
    if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#000000', '#FFFFFF'] });
    
    const alarm = document.getElementById('alarm-sound');
    if(alarm) alarm.play().catch(()=>{});

    if (window.showNotification) {
        const title = currentMode === 'work' ? "SESSION COMPLETE" : "BREAK OVER";
        const body = currentMode === 'work' ? "Protocol finished. +50 Credits." : "Return to focus.";
        window.showNotification(title, body, "success"); // Success type handles checkmark icon
    }

    if(currentMode === 'work') {
        if(window.addPoints) window.addPoints(50, "Focus Session");
        const minutes = MODES.work.time / 60;
        saveStats(minutes);
        addToHistory(minutes, currentFocusTask || 'Focus Session');
    }
    timerStatus.textContent = 'COMPLETE';
}

// --- SETTINGS MODAL ---
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    if(modal) {
        modal.classList.remove('hidden');
        document.getElementById('setting-focus').value = settings.work;
        document.getElementById('setting-short').value = settings.short;
        document.getElementById('setting-long').value = settings.long;
    }
};

window.closeSettings = function() {
    document.getElementById('settings-modal').classList.add('hidden');
};

window.saveSettings = function() {
    const newWork = parseInt(document.getElementById('setting-focus').value) || 25;
    const newShort = parseInt(document.getElementById('setting-short').value) || 5;
    const newLong = parseInt(document.getElementById('setting-long').value) || 15;
    
    settings = { work: newWork, short: newShort, long: newLong };
    localStorage.setItem('auraTimerSettings', JSON.stringify(settings));
    
    MODES.work.time = newWork * 60;
    MODES.short.time = newShort * 60;
    MODES.long.time = newLong * 60;
    
    resetTimer();
    closeSettings();
};

// --- LINKED TASKS ---
window.setFocusTask = function(taskText) {
    currentFocusTask = taskText;
    if(focusTaskText) focusTaskText.textContent = taskText;
    if(activeTaskDisplay) activeTaskDisplay.classList.remove('hidden');
    
    // Switch view to Focus automatically
    if(window.switchView) window.switchView('focus');
    
    setMode('work');
};

window.clearFocusTask = function() {
    currentFocusTask = null;
    if(activeTaskDisplay) activeTaskDisplay.classList.add('hidden');
};

// --- HISTORY & STATS ---
function saveStats(minutesToAdd) {
    stats.sessions += 1;
    stats.minutes += minutesToAdd;
    localStorage.setItem('auraStats', JSON.stringify(stats));
}

function addToHistory(duration, label) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = {
        id: Date.now(),
        date: now.toLocaleDateString(),
        time: timeString,
        duration: duration,
        label: label
    };
    history.unshift(entry);
    if(history.length > 30) history.pop();
    localStorage.setItem('auraHistory', JSON.stringify(history));
    
    // If we have a history list in the Settings/Notification modal
    renderHistory();
}

// Render History into the "Notification History" modal for now, or any list container found
function renderHistory() {
    // We reuse the notification-history-list for this if needed, 
    // BUT the new design might not show history on the main focus page.
    // This function ensures data is ready if we add a history view later.
}

window.clearHistory = function() {
    if(confirm('Purge session logs?')) {
        history = [];
        localStorage.setItem('auraHistory', JSON.stringify(history));
        renderHistory();
    }
}

// --- MODE SWITCHING ---
function setMode(mode) {
    resetTimer();
    currentMode = mode;
    timeLeft = MODES[mode].time;
    
    // Button Styles: Active = Black Bg/White Text. Inactive = Transparent/Gray Text
    Object.keys(modeBtns).forEach(k => {
        const btn = modeBtns[k];
        if(!btn) return;
        
        if(k === mode) {
            // Active
            btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-main bg-main text-body shadow-sm transition-colors";
        } else {
            // Inactive
            btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-transparent text-muted hover:border-border transition-colors";
        }
    });
    
    updateDisplay();
}

function setupModeListeners() {
    if(modeBtns.work) modeBtns.work.addEventListener('click', () => setMode('work'));
    if(modeBtns.short) modeBtns.short.addEventListener('click', () => setMode('short'));
    if(modeBtns.long) modeBtns.long.addEventListener('click', () => setMode('long'));
}

if(toggleBtn) toggleBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
if(resetBtn) resetBtn.addEventListener('click', resetTimer);

// Run init
initPomodoro();
