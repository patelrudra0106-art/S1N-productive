/* app.js - S1N Industrial Theme Update */

// --- DOM ELEMENTS ---
const taskInput = document.getElementById('task-input');
const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- STATE ---
let currentFilter = 'all';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    checkEmptyState();
});

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Input Validation
    taskInput.addEventListener('input', () => {
        addBtn.disabled = taskInput.value.trim() === "";
    });

    // Form Submit
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset all buttons to default style
            filterBtns.forEach(b => {
                b.className = "filter-btn text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-transparent text-muted hover:text-main transition-colors";
            });
            // Set active button style (Solid Black/White)
            btn.className = "filter-btn active text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-main bg-main text-body transition-colors";
            
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

// --- CORE FUNCTIONS ---
function getStorageKey() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (user && user.name) {
        return `auraTasks_${user.name}`;
    }
    return 'auraTasks_guest';
}

function loadTasks() {
    renderTasks();
}

function saveTasks(tasks) {
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
    checkEmptyState();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        date: dateInput.value,
        time: timeInput.value,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks(tasks);
    
    // Reset Form
    taskInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    addBtn.disabled = true;
    
    renderTasks();
    
    // Notification
    if(window.showNotification) window.showNotification("Protocol Initiated", "Task added to queue.", "info");
}

function toggleTask(id) {
    const tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        // Logic for Points & Stats
        if (tasks[taskIndex].completed) {
            tasks[taskIndex].completedAt = Date.now();
            
            // Audio Feedback (Subtle Click)
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
            audio.volume = 0.2;
            audio.play().catch(()=>{});

            // Confetti (Clean bursts)
            if(window.confetti) {
                const rect = document.getElementById(`task-${id}`).getBoundingClientRect();
                const x = rect.left / window.innerWidth + (rect.width / window.innerWidth) / 2;
                const y = rect.top / window.innerHeight;
                // Monochrome Confetti
                confetti({ particleCount: 40, spread: 40, origin: { x, y }, colors: ['#000000', '#FFFFFF', '#9CA3AF'] });
            }

            // --- CHANGED POINT LOGIC ---
            let points = 20; // Default: Before deadline or no deadline
            let reason = "Task Complete";

            if (tasks[taskIndex].date) {
                // Construct deadline date object
                const dueString = tasks[taskIndex].date + (tasks[taskIndex].time ? 'T' + tasks[taskIndex].time : 'T23:59:59');
                const dueDate = new Date(dueString);
                
                // Compare current time with deadline
                if (new Date() > dueDate) {
                    points = -50;
                    reason = "Late Penalty";
                }
            }

            // Execute Point Update
            if(window.addPoints) window.addPoints(points, reason);
            
            // Only update streak if points were positive (optional logic, but keeps streak clean)
            if(window.updateStreak && points > 0) window.updateStreak();
            // ---------------------------

        } else {
            tasks[taskIndex].completedAt = null;
        }

        saveTasks(tasks);
        renderTasks();
    }
}

function deleteTask(id) {
    if(confirm("Terminate this task protocol?")) {
        let tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [];
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        renderTasks();
    }
}

// --- RENDER LOGIC ---
function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    taskList.innerHTML = '';
    
    let visibleCount = 0;

    tasks.forEach(task => {
        // Filter Logic
        if (currentFilter === 'active' && task.completed) return;
        if (currentFilter === 'completed' && !task.completed) return;

        visibleCount++;

        // Date Formatting
        let dateDisplay = '';
        if (task.date) {
            const dateObj = new Date(task.date);
            const today = new Date();
            const isToday = dateObj.toDateString() === today.toDateString();
            dateDisplay = isToday ? 'TODAY' : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
            
            if (task.time) dateDisplay += ` • ${task.time}`;
        }

        // Check for Overdue
        let isOverdue = false;
        if (!task.completed && task.date) {
            const due = new Date(task.date + (task.time ? 'T' + task.time : 'T23:59:59'));
            if (due < new Date()) isOverdue = true;
        }

        const li = document.createElement('li');
        li.id = `task-${task.id}`;
        
        // Style: Clean Card, no colors, just opacity change for completed
        li.className = `card-s1n group p-4 flex items-center gap-4 transition-all duration-300 animate-slide-in ${task.completed ? 'opacity-50 grayscale' : 'hover:border-main'}`;
        
        li.innerHTML = `
            <button onclick="toggleTask(${task.id})" class="flex-shrink-0 w-5 h-5 border border-main rounded-sm flex items-center justify-center transition-all ${task.completed ? 'bg-main text-body' : 'bg-transparent hover:bg-input'}">
                ${task.completed ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
            </button>
            
            <div class="flex-1 min-w-0 cursor-pointer" onclick="toggleTask(${task.id})">
                <p class="text-sm font-bold truncate leading-tight transition-all ${task.completed ? 'line-through text-muted' : 'text-main'}">
                    ${task.text}
                </p>
                ${dateDisplay ? `
                    <p class="text-[10px] font-bold mt-1 tracking-wider uppercase ${isOverdue && !task.completed ? 'text-rose-500' : 'text-muted'}">
                        ${dateDisplay} ${isOverdue ? '(!)' : ''}
                    </p>
                ` : ''}
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${!task.completed ? `
                <button onclick="window.setFocusTask && window.setFocusTask('${task.text.replace(/'/g, "\\'")}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Focus">
                    <i data-lucide="crosshair" class="w-4 h-4"></i>
                </button>
                ` : ''}
                <button onclick="deleteTask(${task.id})" class="p-2 text-muted hover:text-rose-500 hover:bg-input rounded-md transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });

    checkEmptyState(visibleCount);
    if(window.lucide) lucide.createIcons();
}

function checkEmptyState(count) {
    const hasItems = count !== undefined ? count > 0 : taskList.children.length > 0;
    
    if (hasItems) {
        emptyState.classList.add('hidden');
    } else {
        emptyState.classList.remove('hidden');
        const msg = emptyState.querySelector('p');
        if(currentFilter === 'completed') msg.textContent = "No completed protocols.";
        else if(currentFilter === 'active') msg.textContent = "All systems operational.";
        else msg.textContent = "System Idle. Add Protocol.";
    }
}

// Theme Toggle Logic (Simple Class Toggle)
window.setTheme = function(mode) {
    const html = document.documentElement;
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');

    if (mode === 'dark') {
        html.classList.add('dark');
        localStorage.setItem('auraTheme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('auraTheme', 'light');
    }

    // Update Buttons (Bold the active one)
    if (btnLight && btnDark) {
        if (mode === 'dark') {
            btnDark.classList.add('bg-main', 'text-body', 'border-main');
            btnDark.classList.remove('text-muted', 'border-transparent');
            
            btnLight.classList.remove('bg-main', 'text-body', 'border-main');
            btnLight.classList.add('text-muted', 'border-transparent');
        } else {
            btnLight.classList.add('bg-main', 'text-body', 'border-main');
            btnLight.classList.remove('text-muted', 'border-transparent');
            
            btnDark.classList.remove('bg-main', 'text-body', 'border-main');
            btnDark.classList.add('text-muted', 'border-transparent');
        }
    }
};

// Init Theme Buttons on Load
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('auraTheme') === 'dark' || 
        (!('auraTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) 
        ? 'dark' : 'light';
    window.setTheme(currentTheme);
});
