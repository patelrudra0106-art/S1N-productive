/* auth.js - Samsung White Mode */

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
        if (mainApp) mainApp.classList.remove('hidden');
        if (authOverlay) authOverlay.classList.add('hidden');
        checkAdminAccess();
        listenToStats(); 
        listenForBroadcasts(); 
    } else {
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
            if (timeSince < 10000) { 
                if (window.showNotification) {
                    // Broadcast: Simple Info Notification
                    window.showNotification("📢 System Message", data.message, "info");
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

    // Loader: Black
    list.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-black"></i></div>';
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

        if (filter) {
            users = users.filter(u => u.name && u.name.toLowerCase().includes(filter.toLowerCase()));
        }

        list.innerHTML = '';

        // --- DASHBOARD UI: White Mode ---
        // Clean White Cards with Slate-200 Borders. No Colors.
        const dashboardHTML = `
            <div class="grid grid-cols-3 gap-2 mb-6 animate-fade-in">
                <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-[10px] uppercase font-bold text-slate-400">Users</div>
                    <div class="text-xl font-bold text-slate-900">${totalUsers}</div>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-[10px] uppercase font-bold text-slate-400">Active</div>
                    <div class="text-xl font-bold text-slate-900">${activeUsers}</div>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-[10px] uppercase font-bold text-slate-400">Points</div>
                    <div class="text-xl font-bold text-slate-900">${totalPoints >= 1000 ? (totalPoints/1000).toFixed(1)+'k' : totalPoints}</div>
                </div>
            </div>

            <div class="mb-6 flex gap-2 animate-fade-in">
                <input type="text" id="admin-broadcast-input" placeholder="Send global alert..." class="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 text-slate-900">
                <button onclick="adminSendBroadcast()" class="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors">
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', dashboardHTML);

        if (users.length === 0) {
            list.insertAdjacentHTML('beforeend', `<div class="text-center py-10"><p class="text-slate-400 text-sm">No users found.</p></div>`);
            return;
        }

        // --- RENDER LIST ---
        users.forEach(user => {
            if (!user) return;

            const isAdmin = user.name === 'Owner';
            const isBanned = user.isBanned === true; 
            const safeName = user.name.replace(/'/g, "\\'"); 
            
            // Row Style: White BG, Slate Border.
            // Banned: Opacity lowered, but keeps white background for cleanliness
            const rowClass = isBanned 
                ? "bg-white border-slate-200 opacity-60" 
                : "bg-white border-slate-200";

            // Icon: Owner=Black, User=Gray, Banned=Red
            const iconBg = isAdmin ? 'bg-slate-900 text-white' : (isBanned ? 'bg-white border border-rose-200 text-rose-500' : 'bg-slate-100 text-slate-500');
            const iconName = isAdmin ? 'shield' : (isBanned ? 'ban' : 'user');

            const div = document.createElement('div');
            div.className = `flex items-center justify-between p-4 rounded-2xl border shadow-sm animate-fade-in ${rowClass}`;
            
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="p-2 ${iconBg} rounded-full">
                        <i data-lucide="${iconName}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold ${isBanned ? 'text-rose-500 line-through' : 'text-slate-900'}">${user.name} ${isBanned ? '<span class="text-[10px] no-line-through font-bold text-rose-500 ml-1">BANNED</span>' : ''}</p>
                        <p class="text-[10px] text-slate-400">Points: ${user.points || 0}</p>
                        
                        <div class="flex items-center gap-2 mt-0.5">
                            <p id="pass-${safeName}" class="text-[10px] text-slate-400 font-mono">••••••</p>
                            <button onclick="togglePassVisibility('${safeName}', '${user.password}')" class="text-slate-300 hover:text-black"><i data-lucide="eye" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                </div>
                ${!isAdmin ? `
                <div class="flex gap-1">
                    <button onclick="adminResetPass('${safeName}')" class="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Reset Password">
                        <i data-lucide="key" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminEditPoints('${safeName}', ${user.points || 0})" class="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Points">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminToggleBan('${safeName}', ${isBanned})" class="p-2 ${isBanned ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'} rounded-lg transition-colors" title="${isBanned ? 'Unban' : 'Ban'} User">
                        <i data-lucide="${isBanned ? 'check-circle' : 'ban'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminDeleteUser('${safeName}')" class="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors" title="Delete User">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                ` : '<span class="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Owner</span>'}
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
    if (confirm(`Send global alert to all users?\n\n"${msg}"`)) {
        firebase.database().ref('system/broadcast').set({
            message: msg,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Broadcast sent!");
            input.value = '';
        });
    }
};

window.togglePassVisibility = function(elementId, password) {
    const el = document.getElementById(`pass-${elementId}`);
    if (el) {
        if (el.textContent === '••••••') {
            el.textContent = password;
            el.classList.add('text-black', 'font-bold');
        } else {
            el.textContent = '••••••';
            el.classList.remove('text-black', 'font-bold');
        }
    }
};

window.adminResetPass = function(targetName) {
    const newPass = prompt(`Enter NEW password for ${targetName}:`);
    if (newPass && newPass.trim() !== "") {
        firebase.database().ref('users/' + targetName).update({
            password: newPass.trim()
        }).then(() => {
            alert("Password updated successfully.");
            loadAdminPanel();
        });
    }
};

window.adminToggleBan = function(targetName, currentStatus) {
    const action = currentStatus ? "UNBAN" : "BAN";
    if (confirm(`Are you sure you want to ${action} ${targetName}?`)) {
        firebase.database().ref('users/' + targetName).update({
            isBanned: !currentStatus
        }).then(() => {
            loadAdminPanel();
        });
    }
};

window.adminEditPoints = async function(targetName, currentDisplayPoints) {
    if (!currentUser || currentUser.name !== 'Owner') return;

    const newPointsStr = prompt(`Update TOTAL points for ${targetName}:`, currentDisplayPoints);
    if (newPointsStr === null || newPointsStr.trim() === "") return;

    const newPoints = parseInt(newPointsStr);
    if (isNaN(newPoints)) return alert("Invalid number.");

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
        alert("Error: " + err.message);
    }
};

window.adminDeleteUser = function(targetName) {
    if (!currentUser || currentUser.name !== 'Owner') return;
    if (targetName === 'Owner') return alert("Cannot delete Owner.");
    
    if (confirm(`⚠️ PERMANENTLY DELETE "${targetName}"?`)) {
        firebase.database().ref('users/' + targetName).remove()
        .then(() => loadAdminPanel());
    }
};

// --- TOGGLE LOGIN / SIGNUP ---
window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Welcome to Aura";
        authSubmitBtn.textContent = "Log In";
        toggleAuthText.innerHTML = "New here? <span class='text-slate-900 font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Create Account</span>";
        confirmPassField.classList.add('hidden');
    } else {
        authTitle.textContent = "Join Contest";
        authSubmitBtn.textContent = "Sign Up";
        toggleAuthText.innerHTML = "Have an account? <span class='text-slate-900 font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Log In</span>";
        confirmPassField.classList.remove('hidden');
    }
};

// --- HANDLE SUBMIT ---
window.handleAuth = async function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim().replace(/[.#$/[\]]/g, ""); 
    const password = passInput.value;
    const confirmPass = confirmPassInput.value;

    if (!name || !password) return alert("Please fill in all fields");
    if (name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null') return alert("Invalid username.");

    authSubmitBtn.disabled = true;
    authSubmitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto text-white"></i>';
    if(window.lucide) lucide.createIcons();

    const userRef = firebase.database().ref('users/' + name);

    try {
        const snapshot = await userRef.get();
        const userData = snapshot.val();

        if (isLoginMode) {
            if (userData) {
                if (userData.isBanned) {
                    throw new Error("⛔ Account Suspended. Contact Admin.");
                }
                if (userData.password === password) {
                    loginUser(userData);
                } else {
                    throw new Error("Invalid Username or Password");
                }
            } else {
                throw new Error("User not found");
            }
        } else {
            if (password !== confirmPass) throw new Error("Passwords do not match");
            if (userData) throw new Error("Username already taken");

            const newUser = {
                name: name,
                password: password,
                points: 0,
                monthlyPoints: 0,
                streak: 0,
                friends: [], 
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
        authSubmitBtn.textContent = isLoginMode ? "Log In" : "Sign Up";
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
                 alert("Your account has been suspended.");
                 localStorage.removeItem('auraUser');
                 window.location.reload();
             }

             let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
             if(data.friends) {
                 currentUser.friends = data.friends;
                 localStorage.setItem('auraUser', JSON.stringify(currentUser));
             }
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
    if(confirm("Log out?")) {
        localStorage.removeItem('auraUser');
        window.location.reload();
    }
};

window.deleteAccount = function() {
    if(!currentUser) return;
    if(confirm("Delete account permanently?")) {
        firebase.database().ref('users/' + currentUser.name).remove()
        .then(() => {
            localStorage.clear();
            window.location.reload();
        });
    }
};
