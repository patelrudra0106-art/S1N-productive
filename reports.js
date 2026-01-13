/* reports.js - Samsung White Mode */

// --- INIT ---
window.initReports = function() {
    // Check if a tab is already active
    // WHITE MODE: Active tab is bg-black, inactive is text-slate-500
    const activeBtn = document.querySelector('.report-tab.bg-slate-900');
    if(activeBtn) {
        generateReport(activeBtn.dataset.type);
    } else {
        switchReportTab('daily');
    }
};

// --- TABS ---
window.switchReportTab = function(type) {
    const reportTabs = document.querySelectorAll('.report-tab');

    // Update UI Tabs
    reportTabs.forEach(btn => {
        if(btn.dataset.type === type) {
            // Active: Black Background, White Text
            btn.className = "report-tab flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-md transition-all";
        } else {
            // Inactive: Transparent, Slate-500 Text, Gray Hover
            btn.className = "report-tab flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-200 transition-all";
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

    // 3. Filter Tasks
    let onTimeCount = 0;
    let lateCount = 0;
    let noDeadlineCount = 0;
    
    const filteredTasks = tasks.filter(t => {
        if(!t.completed) return false;
        const taskDateObj = t.completedAt ? new Date(t.completedAt) : (t.date ? new Date(t.date) : new Date());
        if (taskDateObj < startTime) return false;

        if (!t.date || !t.time) {
            noDeadlineCount++;
        } else {
            const [tH, tM] = t.time.split(':').map(Number);
            const dueObj = new Date(t.date);
            dueObj.setHours(tH, tM, 0, 0);

            if (t.completedAt) {
                if (t.completedAt <= dueObj.getTime()) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            } else {
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
    
    // WHITE MODE CHART: Black (#000000) for Good, Silver (#D1D5DB) for Bad
    const chartStyle = `background: conic-gradient(
        #000000 0% ${onTimePct}%, 
        #D1D5DB ${onTimePct}% 100%
    )`;

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-6 animate-fade-in">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <div class="p-3 bg-slate-100 rounded-full text-black mb-3"><i data-lucide="check-circle-2" class="w-6 h-6"></i></div>
                <div class="text-3xl font-bold text-slate-900">${tasks}</div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Tasks Done</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <div class="p-3 bg-slate-100 rounded-full text-black mb-3"><i data-lucide="clock" class="w-6 h-6"></i></div>
                <div class="text-3xl font-bold text-slate-900">${mins}<span class="text-sm font-medium opacity-60 ml-1">m</span></div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Focus Time</div>
            </div>
        </div>

        <div class="space-y-3 mb-6 animate-fade-in">
            <div class="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-slate-100 text-black rounded-xl"><i data-lucide="target" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-sm font-bold text-slate-900">Total Sessions</p>
                        <p class="text-xs text-slate-400">Pomodoro rounds completed</p>
                    </div>
                </div>
                <span class="font-bold text-lg text-slate-900">${sessions}</span>
            </div>

            <div class="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-slate-100 text-black rounded-xl"><i data-lucide="zap" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-sm font-bold text-slate-900">Focus Efficiency</p>
                        <p class="text-xs text-slate-400">Avg. minutes per task</p>
                    </div>
                </div>
                <span class="font-bold text-lg text-slate-900">${efficiency}m</span>
            </div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 animate-fade-in">
            <h3 class="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-slate-400"></i> Performance Breakdown
            </h3>
            
            <div class="flex items-center gap-8">
                <div class="relative w-32 h-32 shrink-0 rounded-full flex items-center justify-center" style="${chartStyle}">
                    <div class="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                        <span class="text-2xl font-bold text-slate-900">${onTimePct}%</span>
                        <span class="text-[10px] uppercase font-bold text-slate-400">Efficiency</span>
                    </div>
                </div>

                <div class="flex-1 space-y-4">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-bold text-slate-600 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-black"></span> On Time
                            </span>
                            <span class="font-bold text-black">${onTime + noDeadline}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-black h-full rounded-full" style="width: ${onTimePct}%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-bold text-slate-600 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-slate-400"></span> Late
                            </span>
                            <span class="font-bold text-slate-500">${late}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-slate-400 h-full rounded-full" style="width: ${latePct}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            ${late > 0 ? `<p class="mt-6 text-xs text-center text-slate-900 bg-slate-100 p-2 rounded-lg border border-slate-200"><i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1 text-slate-500"></i> You have ${late} late tasks. Try to finish before the deadline!</p>` : ''}
        </div>
        
        <div class="mt-8 text-center pb-20">
            <p class="text-xs text-slate-400">Showing <span class="text-slate-900 font-bold">${title}</span> statistics</p>
        </div>
    `;
    
    if(window.lucide) lucide.createIcons();
}
