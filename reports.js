/* reports.js */

// --- INIT ---
window.initReports = function() {
    // Check if a tab is already active
    const activeBtn = document.querySelector('.report-tab.bg-indigo-600');
    if(activeBtn) {
        generateReport(activeBtn.dataset.type);
    } else {
        // Default to Daily
        switchReportTab('daily');
    }
};

// --- TABS ---
window.switchReportTab = function(type) {
    const reportTabs = document.querySelectorAll('.report-tab');

    // Update UI Tabs
    reportTabs.forEach(btn => {
        if(btn.dataset.type === type) {
            btn.className = "report-tab flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-md transition-all";
        } else {
            btn.className = "report-tab flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50 transition-all";
        }
    });

    generateReport(type);
};

// --- LOGIC ---
function getReportStorageKey() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (user && user.name) {
        return `auraTasks_${user.name}`;
    }
    return 'auraTasks_guest';
}

function generateReport(type) {
    // Select element INSIDE the function to prevent "null" errors
    const reportContent = document.getElementById('report-content');
    if(!reportContent) return;

    // 1. Fetch Data
    const storageKey = getReportStorageKey();
    const tasks = JSON.parse(localStorage.getItem(storageKey)) || [];
    const history = JSON.parse(localStorage.getItem('auraHistory')) || [];

    // 2. Define Time Ranges
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startTime;

    if (type === 'daily') {
        startTime = startOfDay;
    } else if (type === 'weekly') {
        const day = now.getDay() || 7; 
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0,0,0,0);
        startTime = monday;
    } else if (type === 'monthly') {
        startTime = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 3. Filter Tasks by Date & Status
    let onTimeCount = 0;
    let lateCount = 0;
    let noDeadlineCount = 0;
    
    const filteredTasks = tasks.filter(t => {
        if(!t.completed) return false;
        
        // Use completion time if available, otherwise due date, otherwise now
        const taskDateObj = t.completedAt ? new Date(t.completedAt) : (t.date ? new Date(t.date) : new Date());
        if (taskDateObj < startTime) return false;

        // Categorize Logic
        if (!t.date || !t.time) {
            noDeadlineCount++;
        } else {
            // Has deadline
            const [tH, tM] = t.time.split(':').map(Number);
            const dueObj = new Date(t.date);
            dueObj.setHours(tH, tM, 0, 0);

            // Compare Completion Time vs Deadline
            if (t.completedAt) {
                if (t.completedAt <= dueObj.getTime()) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            } else {
                // Fallback for old tasks without timestamps
                onTimeCount++;
            }
        }
        return true; 
    });

    const filteredHistory = history.filter(h => {
        const hDate = new Date(h.date); 
        return hDate >= startTime;
    });

    // 4. Calculate Stats
    const totalTasks = filteredTasks.length;
    const totalFocusMinutes = filteredHistory.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalSessions = filteredHistory.length;
    
    // 5. Render
    renderReportUI(reportContent, type, totalTasks, totalFocusMinutes, totalSessions, onTimeCount, lateCount, noDeadlineCount);
}

function renderReportUI(container, type, tasks, mins, sessions, onTime, late, noDeadline) {
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    const efficiency = tasks > 0 ? Math.round(mins / tasks) : 0;
    
    // Chart Calculations
    const totalForChart = (onTime + late + noDeadline) || 1; 
    const onTimePct = Math.round(((onTime + noDeadline) / totalForChart) * 100);
    const latePct = Math.round((late / totalForChart) * 100);
    
    // Conic Gradient for Donut Chart
    const chartStyle = `background: conic-gradient(
        #10b981 0% ${onTimePct}%, 
        #f43f5e ${onTimePct}% 100%
    )`;

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-6 animate-fade-in">
            <div class="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 flex flex-col items-center justify-center text-center">
                <div class="p-3 bg-white dark:bg-indigo-500/20 rounded-full text-indigo-500 dark:text-indigo-400 mb-3"><i data-lucide="check-circle-2" class="w-6 h-6"></i></div>
                <div class="text-3xl font-bold text-slate-800 dark:text-slate-100">${tasks}</div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Tasks Done</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-500/30 flex flex-col items-center justify-center text-center">
                <div class="p-3 bg-white dark:bg-purple-500/20 rounded-full text-purple-500 dark:text-purple-400 mb-3"><i data-lucide="clock" class="w-6 h-6"></i></div>
                <div class="text-3xl font-bold text-slate-800 dark:text-slate-100">${mins}<span class="text-sm font-medium opacity-60 ml-1">m</span></div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Focus Time</div>
            </div>
        </div>

        <div class="space-y-3 mb-6 animate-fade-in">
            <div class="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><i data-lucide="target" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Total Sessions</p>
                        <p class="text-xs text-slate-400">Pomodoro rounds completed</p>
                    </div>
                </div>
                <span class="font-bold text-lg text-slate-700 dark:text-slate-200">${sessions}</span>
            </div>

            <div class="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl"><i data-lucide="zap" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Focus Efficiency</p>
                        <p class="text-xs text-slate-400">Avg. minutes per task</p>
                    </div>
                </div>
                <span class="font-bold text-lg text-slate-700 dark:text-slate-200">${efficiency}m</span>
            </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6 animate-fade-in">
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-slate-400"></i> Performance Breakdown
            </h3>
            
            <div class="flex items-center gap-8">
                <div class="relative w-32 h-32 shrink-0 rounded-full flex items-center justify-center" style="${chartStyle}">
                    <div class="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center">
                        <span class="text-2xl font-bold text-slate-800 dark:text-slate-100">${onTimePct}%</span>
                        <span class="text-[10px] uppercase font-bold text-slate-400">Efficiency</span>
                    </div>
                </div>

                <div class="flex-1 space-y-4">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> On Time
                            </span>
                            <span class="font-bold text-emerald-600">${onTime + noDeadline}</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-500 h-full rounded-full" style="width: ${onTimePct}%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-rose-500"></span> Late
                            </span>
                            <span class="font-bold text-rose-500">${late}</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-rose-500 h-full rounded-full" style="width: ${latePct}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            ${late > 0 ? `<p class="mt-6 text-xs text-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30"><i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i> You have ${late} late tasks. Try to finish before the deadline!</p>` : ''}
        </div>
        
        <div class="mt-8 text-center pb-20">
            <p class="text-xs text-slate-400">Showing <span class="text-indigo-500 font-bold">${title}</span> statistics</p>
        </div>
    `;
    
    if(window.lucide) lucide.createIcons();
}
