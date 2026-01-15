/* app.js - Task Logic */

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
            // Update active class
            filterBtns.forEach(b => {
                b.className = "filter-btn px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all";
            });
            btn.className = "filter-btn active px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 transition-all";
            
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
    if(window.showNotification) window.showNotification("Task Added", "Let's get this done!", "info");
}

function toggleTask(id) {
    const tasks = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        // Logic for Points & Stats
        if (tasks[taskIndex].completed) {
            tasks[taskIndex].completedAt = Date.now();
            
            // Audio Feedback
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1111/1111-preview.mp3'); 
            audio.volume = 0.3;
            audio.play().catch(()=>{});

            // Confetti
            if(window.confetti) {
                const rect = document.getElementById(`task-${id}`).getBoundingClientRect();
                const x = rect.left / window.innerWidth + (rect.width / window.innerWidth) / 2;
                const y = rect.top / window.innerHeight;
                confetti({ particleCount: 60, spread: 50, origin: { x, y }, colors: ['#6366f1', '#a855f7'] });
            }

            // Award Points (Linked to Profile.js)
            if(window.addPoints) window.addPoints(10, "Task Completed");
            if(window.updateStreak) window.updateStreak();

        } else {
            tasks[taskIndex].completedAt = null;
        }

        saveTasks(tasks);
        renderTasks();
    }
}

function deleteTask(id) {
    if(confirm("Delete this task?")) {
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
            dateDisplay = isToday ? 'Today' : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            if (task.time) dateDisplay += `, ${task.time}`;
        }

        // Check for Overdue
        let isOverdue = false;
        if (!task.completed && task.date) {
            const due = new Date(task.date + (task.time ? 'T' + task.time : 'T23:59:59'));
            if (due < new Date()) isOverdue = true;
        }

        const li = document.createElement('li');
        li.id = `task-${task.id}`;
        li.className = `group bg-white dark:bg-slate-800 p-4 rounded-2xl border transition-all duration-300 animate-slide-in ${task.completed ? 'border-emerald-100 dark:border-emerald-900/30 opacity-60' : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'}`;
        
        li.innerHTML = `
            <div class="flex items-center gap-4">
                <button onclick="toggleTask(${task.id})" class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'}">
                    ${task.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}
                </button>
                
                <div class="flex-1 min-w-0 cursor-pointer" onclick="toggleTask(${task.id})">
                    <p class="text-sm font-medium transition-all truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}">
                        ${task.text}
                    </p>
                    ${dateDisplay ? `
                        <p class="text-[10px] mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400'}">
                            <i data-lucide="calendar" class="w-3 h-3"></i> ${dateDisplay} ${isOverdue ? '(Overdue)' : ''}
                        </p>
                    ` : ''}
                </div>

                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${!task.completed ? `
                    <button onclick="window.setFocusTask && window.setFocusTask('${task.text.replace(/'/g, "\\'")}')" class="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Focus on this">
                        <i data-lucide="crosshair" class="w-4 h-4"></i>
                    </button>
                    ` : ''}
                    <button onclick="deleteTask(${task.id})" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        taskList.appendChild(li);
    });

    checkEmptyState(visibleCount);
    if(window.lucide) lucide.createIcons();
}

function checkEmptyState(count) {
    // If count is passed, use it. Otherwise calculate based on list children.
    const hasItems = count !== undefined ? count > 0 : taskList.children.length > 0;
    
    if (hasItems) {
        emptyState.classList.add('hidden');
    } else {
        emptyState.classList.remove('hidden');
        const msg = emptyState.querySelector('p');
        if(currentFilter === 'completed') msg.textContent = "No completed tasks yet.";
        else if(currentFilter === 'active') msg.textContent = "No active tasks. Good job!";
        else msg.textContent = "No tasks here. Relax or add one!";
    }
}
