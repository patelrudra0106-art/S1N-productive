/* pomodoro.js - Noir Theme */

// --- POMODORO CONFIG ---
let settings = JSON.parse(localStorage.getItem('auraTimerSettings')) || {
    work: 25,
    short: 5,
    long: 15
};

// NOIR MODE: White for Work, Grays for Breaks
let MODES = {
    work: { time: settings.work * 60, label: 'Focus Time', color: 'text-white stroke-white' },
    short: { time: settings.short * 60, label: 'Short Break', color: 'text-gray-400 stroke-gray-400' },
    long: { time: settings.long * 60, label: 'Long Break', color: 'text-gray-600 stroke-gray-600' }
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
const statSessions = document.getElementById('sessions-count');
const statMinutes = document.getElementById('minutes-count');
const historyList = document.getElementById('history-list');
const activeTaskDisplay = document.getElementById('active-task-display');
const focusTaskText = document.getElementById('focus-task-text');

// --- CONSTANTS ---
const CIRCLE_RADIUS = 120;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// --- INIT ---
function initPomodoro() {
    progressRing.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    progressRing.style.strokeDashoffset = 0;
    updateDisplay();
    updateStatsDisplay();
    renderHistory();
    setupModeListeners();
}

// --- CORE FUNCTIONS ---
function updateDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
    const totalTime = MODES[currentMode].time;
    const offset = CIRCLE_CIRCUMFERENCE - (timeLeft / totalTime) * CIRCLE_CIRCUMFERENCE;
    progressRing.style.strokeDashoffset = offset;
    document.title = isRunning ? `(${m}:${s}) Aura Focus` : 'Aura Tasks';
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    
    // NOIR: Active = White BG, Black Icon
    toggleBtn.innerHTML = '<i data-lucide="pause" class="w-6 h-6 fill-current text-black"></i>';
    toggleBtn.className = "w-16 h-16 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-200 transition-all active:scale-95";
    
    lucide.createIcons();
    timerStatus.textContent = currentMode === 'work' ? 'Stay Focused' : 'Relax & Recharge';
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
    
    // NOIR: Paused = Black BG, White Icon, Grey Border
    toggleBtn.innerHTML = '<i data-lucide="play" class="w-6 h-6 ml-1 fill-current text-white"></i>';
    toggleBtn.className = "w-16 h-16 flex items-center justify-center rounded-full bg-[#121212] text-white border border-[#333] hover:bg-[#222] transition-all active:scale-95";
    
    timerStatus.textContent = 'Paused';
    lucide.createIcons();
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode].time;
    timerStatus.textContent = 'Ready';
    updateDisplay();
}

function completeTimer() {
    pauseTimer();
    // NOIR: White & Silver Confetti
    if(window.confetti) confetti({ 
        particleCount: 150, 
        spread: 70, 
        origin: { y: 0.6 }, 
        colors: ['#ffffff', '#cccccc', '#888888'] 
    });
    
    if (window.showNotification) {
        const title = currentMode === 'work' ? "Focus Complete!" : "Break Over!";
        const body = currentMode === 'work' ? "Great job! +50 Points" : "Time to focus again.";
        const type = currentMode === 'work' ? "success" : "info";
        window.showNotification(title, body, type);
    }

    if(currentMode === 'work') {
        if(window.addPoints) window.addPoints(50, "Focus Session Complete");

        const minutes = MODES.work.time / 60;
        saveStats(minutes);
        addToHistory(minutes, currentFocusTask || 'Focus Session');
    }
    timerStatus.textContent = 'Session Complete!';
}

// --- SETTINGS MODAL LOGIC (Inputs must be in HTML) ---
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    if(modal) {
        modal.classList.remove('hidden');
        // Populate inputs with current settings
        const fInput = document.getElementById('setting-focus');
        const sInput = document.getElementById('setting-short');
        const lInput = document.getElementById('setting-long');
        
        if(fInput) fInput.value = settings.work;
        if(sInput) sInput.value = settings.short;
        if(lInput) lInput.value = settings.long;
    }
};

window.closeSettings = function() {
    const modal = document.getElementById('settings-modal');
    if(modal) modal.classList.add('hidden');
};

window.saveSettings = function() {
    const fInput = document.getElementById('setting-focus');
    const sInput = document.getElementById('setting-short');
    const lInput = document.getElementById('setting-long');

    const newWork = parseInt(fInput ? fInput.value : 25) || 25;
    const newShort = parseInt(sInput ? sInput.value : 5) || 5;
    const newLong = parseInt(lInput ? lInput.value : 15) || 15;

    settings = { work: newWork, short: newShort, long: newLong };
    localStorage.setItem('auraTimerSettings', JSON.stringify(settings));
    
    // Update Modes
    MODES.work.time = newWork * 60;
    MODES.short.time = newShort * 60;
    MODES.long.time = newLong * 60;
    
    resetTimer();
    closeSettings();
};

// --- LINKED TASKS ---
window.setFocusTask = function(taskText) {
    currentFocusTask = taskText;
    focusTaskText.textContent = taskText;
    activeTaskDisplay.classList.remove('hidden');
    setMode('work');
};

window.clearFocusTask = function() {
    currentFocusTask = null;
    activeTaskDisplay.classList.add('hidden');
};

// --- HISTORY & STATS ---
function saveStats(minutesToAdd) {
    stats.sessions += 1;
    stats.minutes += minutesToAdd;
    localStorage.setItem('auraStats', JSON.stringify(stats));
    updateStatsDisplay();
}

function updateStatsDisplay() {
    if(statSessions) statSessions.textContent = stats.sessions;
    if(statMinutes) statMinutes.textContent = stats.minutes;
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
    if(history.length > 20) history.pop();
    localStorage.setItem('auraHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if(!historyList) return;
    historyList.innerHTML = '';
    if(history.length === 0) {
        historyList.innerHTML = '<li class="text-center text-gray-500 italic py-4 text-sm">No history yet. Start focusing!</li>';
        return;
    }
    history.forEach(item => {
        const li = document.createElement('li');
        // NOIR: Card BG #121212, Border #333
        li.className = "flex justify-between items-center bg-[#121212] p-3 rounded-xl border border-[#333] animate-fade-in";
        li.innerHTML = `
            <div class="flex flex-col min-w-0 pr-4">
                <span class="font-medium text-gray-200 truncate text-sm">${item.label}</span>
                <span class="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">${item.date} • ${item.time}</span>
            </div>
            <span class="text-xs font-bold text-black bg-white px-2 py-1 rounded-lg shrink-0">
                ${item.duration}m
            </span>
        `;
        historyList.appendChild(li);
    });
}

window.clearHistory = function() {
    if(confirm('Clear all history?')) {
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
    
    Object.keys(modeBtns).forEach(k => {
        const btn = modeBtns[k];
        if(k === mode) {
            // Active: White BG, Black Text
            btn.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-black shadow-sm ring-1 ring-black/5";
        } else {
            // Inactive: Gray Text
            btn.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 hover:text-white";
        }
    });
    
    progressRing.setAttribute('class', `transition-all duration-1000 ease-linear ${MODES[mode].color}`);
    updateDisplay();
}

function setupModeListeners() {
    modeBtns.work.addEventListener('click', () => setMode('work'));
    modeBtns.short.addEventListener('click', () => setMode('short'));
    modeBtns.long.addEventListener('click', () => setMode('long'));
}

toggleBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
resetBtn.addEventListener('click', resetTimer);

initPomodoro();
