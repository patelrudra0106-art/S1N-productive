/* auth.js - S1N Industrial Theme Update */

// --- STATE ---
let currentUser = JSON.parse(localStorage.getItem('auraUser')) || null;
let broadcastListenerAttached = false;

// --- DOM ELEMENTS ---
const authOverlay = document.getElementById('auth-overlay');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit');
const toggleAuthText = document.getElementById('toggle-auth-mode');
const nameInput = document.getElementById('auth-name');
const passInput = document.getElementById('auth-pass');
const confirmPassField = document.getElementById('field-confirm-pass');
const confirmPassInput = document.getElementById('auth-confirm-pass');

let isLoginMode = true;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        // User is logged in
        if (mainApp) mainApp.classList.remove('hidden');
        if (authOverlay) authOverlay.classList.add('hidden');
        
        // Initialize Admin Checks & Stats
        checkAdminAccess();
        listenToStats(); 
        listenForBroadcasts(); 
    } else {
        // User needs to login
        if (authOverlay) authOverlay.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }
});

// --- BROADCAST LISTENER ---
function listenForBroadcasts() {
    if (broadcastListenerAttached) return;
    
    firebase.database().ref('system/broadcast').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.message && data.timestamp) {
            const timeSince = Date.now() - data.timestamp;
            // Show only recent broadcasts (10s window)
            if (timeSince < 10000) { 
                if (window.showNotification) {
                    window.showNotification("SYSTEM BROADCAST", data.message, "info");
                }
            }
        }
    });
    broadcastListenerAttached = true;
}

// --- ADMIN LOGIC ---
function checkAdminAccess() {
    const adminNav = document.getElementById('nav-admin');
    
    if (currentUser && currentUser.name === 'Owner') {
        if (adminNav) adminNav.classList.remove('hidden');
        
        const search = document.getElementById('admin-search');
        if (search) {
            const newSearch = search.cloneNode(true);
            search.parentNode.replaceChild(newSearch, search);
            newSearch.addEventListener('input', (e) => loadAdminPanel(e.target.value));
        }
    } else {
        if (adminNav) adminNav.classList.add('hidden');
    }
}

window.loadAdminPanel = function(filter = '') {
    if (!currentUser || currentUser.name !== 'Owner') return;
    
    const list = document.getElementById('admin-user-list');
    if (!list) return;

    list.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if (window.lucide) lucide.createIcons();

    firebase.database().ref('users').once('value').then((snapshot) => {
        const data = snapshot.val();
        let users = [];

        if (data) {
            users = Object.entries(data).map(([key, value]) => {
                if (!value.name) { value.name = key; }
                return value;
            });
        }

        // --- ANALYTICS DATA ---
        const totalUsers = users.length;
        const totalPoints = users.reduce((acc, curr) => acc + (curr.points || 0), 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const activeUsers = users.filter(u => u.lastActiveMonth === currentMonth).length;

        // --- FILTERING ---
        if (filter) {
            users = users.filter(u => u.name && u.name.toLowerCase().includes(filter.toLowerCase()));
        }

        list.innerHTML = '';

        // --- DASHBOARD UI (S1N Style) ---
        const dashboardHTML = `
            <div class="grid grid-cols-3 gap-2 mb-6 animate-fade-in">
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Users</div>
                    <div class="text-xl font-bold font-mono text-main">${totalUsers}</div>
                </div>
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Active</div>
                    <div class="text-xl font-bold font-mono text-main">${activeUsers}</div>
                </div>
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Credits</div>
                    <div class="text-xl font-bold font-mono text-main">${totalPoints >= 1000 ? (totalPoints/1000).toFixed(1)+'k' : totalPoints}</div>
                </div>
            </div>

            <div class="mb-6 flex gap-2 animate-fade-in">
                <input type="text" id="admin-broadcast-input" placeholder="System Alert..." class="input-s1n py-2 text-xs">
                <button onclick="adminSendBroadcast()" class="btn-s1n px-4 py-2">
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', dashboardHTML);

        if (users.length === 0) {
            list.insertAdjacentHTML('beforeend', `<div class="text-center py-10 border border-dashed border-border rounded-xl"><p class="text-muted text-xs font-bold uppercase">No records found.</p></div>`);
            return;
        }

        // --- RENDER LIST ---
        users.forEach(user => {
            if (!user) return;

            const isAdmin = user.name === 'Owner';
            const isBanned = user.isBanned === true; 
            const safeName = user.name.replace(/'/g, "\\'"); 
            
            // S1N Row Style: Clean border, no background colors
            const rowClass = isBanned 
                ? "border-border opacity-60" // Banned: Faded
                : "border-border hover:border-main";

            const div = document.createElement('div');
            div.className = `flex items-center justify-between p-4 rounded-xl border mb-2 transition-all animate-fade-in bg-card ${rowClass}`;
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-main">
                        <i data-lucide="${isAdmin ? 'shield' : (isBanned ? 'ban' : 'user')}" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-main ${isBanned ? 'line-through decoration-rose-500' : ''}">
                            ${user.name} 
                        </p>
                        <p class="text-[10px] text-muted font-mono">PTS: ${user.points || 0}</p>
                        
                        <div class="flex items-center gap-2 mt-0.5">
                            <p id="pass-${safeName}" class="text-[10px] text-muted font-mono tracking-widest">••••••</p>
                            <button onclick="togglePassVisibility('${safeName}', '${user.password}')" class="text-muted hover:text-main"><i data-lucide="eye" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                </div>
                ${!isAdmin ? `
                <div class="flex gap-1">
                    <button onclick="adminResetPass('${safeName}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Reset Key">
                        <i data-lucide="key" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminEditPoints('${safeName}', ${user.points || 0})" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Edit Stats">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminToggleBan('${safeName}', ${isBanned})" class="p-2 ${isBanned ? 'text-emerald-500' : 'text-muted hover:text-rose-500'} hover:bg-input rounded-md transition-colors" title="${isBanned ? 'Restore' : 'Suspend'}">
                        <i data-lucide="${isBanned ? 'check-circle' : 'ban'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminDeleteUser('${safeName}')" class="p-2 text-muted hover:text-rose-500 hover:bg-input rounded-md transition-colors" title="Purge">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                ` : '<span class="text-[10px] font-bold text-main uppercase tracking-wider border border-main px-2 py-0.5 rounded">Admin</span>'}
            `;
            list.appendChild(div);
        });
        if (window.lucide) lucide.createIcons();
    });
};

// --- ADMIN ACTIONS ---
window.adminSendBroadcast = function() {
    const input = document.getElementById('admin-broadcast-input');
    if (!input || !input.value.trim()) return;
    
    const msg = input.value.trim();
    if (confirm(`Broadcast global alert?\n\n"${msg}"`)) {
        firebase.database().ref('system/broadcast').set({
            message: msg,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            if(window.showNotification) window.showNotification("SENT", "Broadcast dispatched.", "success");
            input.value = '';
        });
    }
};

window.togglePassVisibility = function(elementId, password) {
    const el = document.getElementById(`pass-${elementId}`);
    if (el) {
        if (el.textContent === '••••••') {
            el.textContent = password;
            el.classList.add('text-main');
        } else {
            el.textContent = '••••••';
            el.classList.remove('text-main');
        }
    }
};

window.adminResetPass = function(targetName) {
    const newPass = prompt(`Reset Key for ${targetName}:`);
    if (newPass && newPass.trim() !== "") {
        firebase.database().ref('users/' + targetName).update({
            password: newPass.trim()
        }).then(() => {
            alert("Key Updated.");
            loadAdminPanel();
        });
    }
};

window.adminToggleBan = function(targetName, currentStatus) {
    const action = currentStatus ? "RESTORE" : "SUSPEND";
    if (confirm(`${action} access for ${targetName}?`)) {
        firebase.database().ref('users/' + targetName).update({
            isBanned: !currentStatus
        }).then(() => {
            loadAdminPanel();
        });
    }
};

window.adminEditPoints = async function(targetName, currentDisplayPoints) {
    if (!currentUser || currentUser.name !== 'Owner') return;

    const newPointsStr = prompt(`Set TOTAL Credits for ${targetName}:`, currentDisplayPoints);
    if (newPointsStr === null || newPointsStr.trim() === "") return;

    const newPoints = parseInt(newPointsStr);
    if (isNaN(newPoints)) return alert("Invalid Format.");

    try {
        const snap = await firebase.database().ref('users/' + targetName).get();
        const data = snap.val();
        if (!data) return;

        const oldPoints = data.points || 0;
        const oldMonthly = data.monthlyPoints || 0;
        const diff = newPoints - oldPoints;
        const newMonthly = Math.max(0, oldMonthly + diff);

        await firebase.database().ref('users/' + targetName).update({
            points: newPoints,
            monthlyPoints: newMonthly
        });
        
        loadAdminPanel();
    } catch (err) {
        alert("Sync Error: " + err.message);
    }
};

window.adminDeleteUser = function(targetName) {
    if (!currentUser || currentUser.name !== 'Owner') return;
    if (targetName === 'Owner') return alert("Protected User.");
    
    if (confirm(`⚠️ PERMANENTLY PURGE "${targetName}"?`)) {
        firebase.database().ref('users/' + targetName).remove()
        .then(() => loadAdminPanel());
    }
};

// --- TOGGLE LOGIN / SIGNUP ---
window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Enter Workspace";
        authSubmitBtn.textContent = "Initialize Session";
        toggleAuthText.innerHTML = "New agent? <span class='text-main font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Create ID</span>";
        confirmPassField.classList.add('hidden');
    } else {
        authTitle.textContent = "New Registration";
        authSubmitBtn.textContent = "Create Identity";
        toggleAuthText.innerHTML = "Have ID? <span class='text-main font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Log In</span>";
        confirmPassField.classList.remove('hidden');
    }
};

// --- HANDLE SUBMIT (CLOUD) ---
window.handleAuth = async function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim().replace(/[.#$/[\]]/g, ""); 
    const password = passInput.value;
    const confirmPass = confirmPassInput.value;

    if (!name || !password) return alert("Credentials missing.");
    if (name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null') return alert("Invalid ID.");

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = "Processing...";
    
    const userRef = firebase.database().ref('users/' + name);

    try {
        const snapshot = await userRef.get();
        const userData = snapshot.val();

        if (isLoginMode) {
            if (userData) {
                if (userData.isBanned) {
                    throw new Error("ACCESS DENIED. ID SUSPENDED.");
                }
                if (userData.password === password) {
                    loginUser(userData);
                } else {
                    throw new Error("Authentication Failed.");
                }
            } else {
                throw new Error("ID not found.");
            }
        } else {
            if (password !== confirmPass) throw new Error("Key Mismatch.");
            if (userData) throw new Error("ID Taken.");

            const newUser = {
                name: name,
                password: password,
                points: 0,
                monthlyPoints: 0,
                streak: 0,
                friends: [], 
                inventory: [],
                isBanned: false,
                joinDate: new Date().toLocaleDateString(),
                lastActiveMonth: new Date().toISOString().slice(0, 7)
            };

            await userRef.set(newUser);
            loginUser(newUser);
        }
    } catch (error) {
        alert(error.message);
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? "Initialize Session" : "Create Identity";
    }
};

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('auraUser', JSON.stringify(currentUser));
    
    let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
    profile.name = user.name;
    profile.points = user.points;
    profile.streak = user.streak;
    profile.monthlyPoints = user.monthlyPoints || 0;
    profile.lastActiveMonth = user.lastActiveMonth || new Date().toISOString().slice(0, 7);
    
    localStorage.setItem('auraProfile', JSON.stringify(profile));
    
    authOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    window.location.reload(); 
}

// --- SYNC SCORE TO CLOUD ---
window.syncUserToDB = function(newPoints, newStreak, monthlyPoints, lastActiveMonth) {
    if (!currentUser) return;

    const stats = JSON.parse(localStorage.getItem('auraStats')) || { minutes: 0, sessions: 0 };
    const taskKey = `auraTasks_${currentUser.name}`;
    const tasks = JSON.parse(localStorage.getItem(taskKey)) || [];
    
    // FETCH LOCAL INVENTORY TO ENSURE SYNC
    const userLocal = JSON.parse(localStorage.getItem('auraUser')) || {};
    const inventory = userLocal.inventory || [];
    
    let completedTasks = 0;
    let onTime = 0;
    let late = 0;

    tasks.forEach(t => {
        if (t.completed) {
            completedTasks++;
            if (!t.date || !t.time) {
                onTime++;
            } else {
                const [tH, tM] = t.time.split(':').map(Number);
                const dueObj = new Date(t.date);
                dueObj.setHours(tH, tM, 0, 0);

                if (t.completedAt) {
                    if (t.completedAt <= dueObj.getTime()) onTime++;
                    else late++;
                } else {
                    onTime++; 
                }
            }
        }
    });

    if(monthlyPoints === undefined) {
        const p = JSON.parse(localStorage.getItem('auraProfile')) || {};
        monthlyPoints = p.monthlyPoints || 0;
        lastActiveMonth = p.lastActiveMonth || new Date().toISOString().slice(0, 7);
    }

    firebase.database().ref('users/' + currentUser.name).update({
        points: newPoints,
        streak: newStreak,
        monthlyPoints: monthlyPoints,
        lastActiveMonth: lastActiveMonth,
        inventory: inventory, 
        totalMinutes: stats.minutes,
        totalSessions: stats.sessions || 0,
        totalTasks: completedTasks,
        tasksOnTime: onTime,
        tasksLate: late
    });
};

function listenToStats() {
    firebase.database().ref('users/' + currentUser.name).on('value', (snapshot) => {
        const data = snapshot.val();
        if(data) {
             if (data.isBanned) {
                 alert("ID SUSPENDED.");
                 localStorage.removeItem('auraUser');
                 window.location.reload();
             }

             // Handle Background Sync
             let needsSave = false;
             if(data.friends) {
                 currentUser.friends = data.friends;
                 needsSave = true;
             }
             if(data.inventory) { 
                 currentUser.inventory = data.inventory;
                 needsSave = true;
             }
             if(needsSave) localStorage.setItem('auraUser', JSON.stringify(currentUser));

             let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
             if(data.points !== profile.points) {
                 profile.points = data.points;
                 profile.streak = data.streak;
                 profile.monthlyPoints = data.monthlyPoints || 0;
                 localStorage.setItem('auraProfile', JSON.stringify(profile));
                 const pDisplay = document.getElementById('display-points');
                 if(pDisplay) pDisplay.textContent = data.points.toLocaleString();
             }
        }
    });
}

window.logout = function() {
    if(confirm("Terminating Session. Confirm?")) {
        localStorage.removeItem('auraUser');
        window.location.reload();
    }
};

window.deleteAccount = function() {
    if(!currentUser) return;
    if(confirm("⚠️ WARNING: This will permanently purge your Identity.")) {
        firebase.database().ref('users/' + currentUser.name).remove()
        .then(() => {
            localStorage.clear();
            window.location.reload();
        });
    }
};
