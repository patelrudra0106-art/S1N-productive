/* social.js */

const socialList = document.getElementById('contest-list'); 
const searchInput = document.getElementById('user-search');
let socialViewMode = 'global'; // 'global', 'friends', or 'league'
let hasCelebrated = false; 

window.loadContestData = function() {
    if(socialViewMode === 'league' || socialViewMode === 'global') {
        renderLeagueHeader();
    } else {
        removeLeagueHeader();
    }
    renderLeaderboard();
};

// Toggle Tabs
window.setSocialTab = function(mode) {
    socialViewMode = mode;
    hasCelebrated = false; 
    
    const defaultClass = "flex-1 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all";
    const activeClass = "flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md transition-all";
    const leagueActiveClass = "flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md transition-all";

    const tabGlobal = document.getElementById('tab-global');
    const tabFriends = document.getElementById('tab-friends');
    const tabLeague = document.getElementById('tab-league');

    if(tabGlobal) tabGlobal.className = defaultClass;
    if(tabFriends) tabFriends.className = defaultClass;
    if(tabLeague) tabLeague.className = defaultClass;

    if (mode === 'league') {
        if(tabLeague) tabLeague.className = leagueActiveClass;
        renderLeagueHeader();
    } else if (mode === 'global') {
        if(tabGlobal) tabGlobal.className = activeClass;
        renderLeagueHeader();
    } else {
        if(tabFriends) tabFriends.className = activeClass;
        removeLeagueHeader();
    }

    renderLeaderboard(searchInput ? searchInput.value : '');
};

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderLeaderboard(e.target.value.toLowerCase());
    });
}

// --- FRIEND ACTIONS ---
window.addFriend = function(targetName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return alert("Please log in to add friends.");

    if (!currentUser.friends) currentUser.friends = [];
    if (currentUser.friends.includes(targetName)) return alert("User is already your friend!");

    currentUser.friends.push(targetName);
    localStorage.setItem('auraUser', JSON.stringify(currentUser));

    firebase.database().ref('users/' + currentUser.name).update({
        friends: currentUser.friends
    }).then(() => {
        if(window.showNotification) window.showNotification("Friend Added", `You are now following ${targetName}`, "success");
        renderLeaderboard(searchInput ? searchInput.value : '');
    }).catch(err => {
        alert("Error adding friend: " + err.message);
    });
};

window.removeFriend = function(targetName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return;

    if (confirm(`Stop following ${targetName}?`)) {
        currentUser.friends = currentUser.friends.filter(name => name !== targetName);
        localStorage.setItem('auraUser', JSON.stringify(currentUser));

        firebase.database().ref('users/' + currentUser.name).update({
            friends: currentUser.friends
        }).then(() => {
            document.getElementById('friend-modal').classList.add('hidden');
            renderLeaderboard(searchInput ? searchInput.value : '');
        });
    }
};

// --- VIEW PROFILE ---
window.viewFriendProfile = function(targetName) {
    const modal = document.getElementById('friend-modal');
    const content = document.getElementById('friend-modal-content');
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    const isFriend = currentUser && currentUser.friends && currentUser.friends.includes(targetName);

    if(!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-indigo-500"></i></div>';
    if(window.lucide) lucide.createIcons();

    firebase.database().ref('users/' + targetName).once('value').then((snapshot) => {
        const user = snapshot.val();
        if (!user) {
            content.innerHTML = '<p class="text-center text-slate-500">User not found.</p>';
            return;
        }

        const joinDate = user.joinDate || "Unknown";
        const tasks = user.totalTasks || 0;
        const minutes = user.totalMinutes || 0;
        const sessions = user.totalSessions || 0;
        const onTime = user.tasksOnTime || 0;
        const late = user.tasksLate || 0;
        const efficiency = tasks > 0 ? Math.round(minutes / tasks) : 0;
        const totalRated = (onTime + late) || 1;
        const onTimePct = Math.round((onTime / totalRated) * 100);
        const latePct = Math.round((late / totalRated) * 100);

        // Inventory Check
        const inventory = user.inventory || [];
        const isGold = inventory.includes('golden_name');
        const hasBadge = inventory.includes('dev_badge');

        content.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full ${isGold ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'} flex items-center justify-center font-bold text-xl">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            ${user.name}
                            ${hasBadge ? '<i data-lucide="heart" class="w-4 h-4 text-rose-500 fill-rose-500"></i>' : ''}
                        </h3>
                        <p class="text-xs text-slate-400">Joined ${joinDate}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('friend-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl text-center border border-indigo-100 dark:border-indigo-500/20">
                    <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${user.points || 0}</div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Total Points</div>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl text-center border border-orange-100 dark:border-orange-500/20">
                    <div class="text-xl font-bold text-orange-600 dark:text-orange-400">${user.streak || 0}</div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Day Streak</div>
                </div>
            </div>

            <div class="space-y-2 mb-6">
                 <div class="flex gap-2">
                     <div class="flex-1 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div class="text-xs text-slate-400 mb-1">Tasks Done</div>
                        <div class="font-bold text-slate-700 dark:text-slate-200">${tasks}</div>
                     </div>
                     <div class="flex-1 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div class="text-xs text-slate-400 mb-1">Focus Time</div>
                        <div class="font-bold text-slate-700 dark:text-slate-200">${minutes}m</div>
                     </div>
                 </div>

                 <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><i data-lucide="target" class="w-4 h-4"></i></div>
                        <span class="text-sm font-medium text-slate-500">Sessions</span>
                    </div>
                    <span class="font-bold text-slate-700 dark:text-slate-200">${sessions}</span>
                 </div>

                 <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg"><i data-lucide="zap" class="w-4 h-4"></i></div>
                        <span class="text-sm font-medium text-slate-500">Efficiency</span>
                    </div>
                    <span class="font-bold text-slate-700 dark:text-slate-200">${efficiency}m / task</span>
                 </div>

                 <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm mt-2">
                    <div class="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-2">
                        <span>On Time (${onTime})</span>
                        <span>Late (${late})</span>
                    </div>
                    <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div class="bg-emerald-500 h-full" style="width: ${onTimePct}%"></div>
                        <div class="bg-rose-500 h-full" style="width: ${latePct}%"></div>
                    </div>
                 </div>
            </div>

            ${isFriend ? 
                `<button onclick="removeFriend('${user.name}')" class="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">Remove Friend</button>` 
                : 
                `<button onclick="addFriend('${user.name}'); document.getElementById('friend-modal').classList.add('hidden')" class="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">Add Friend</button>`
            }
        `;
        if(window.lucide) lucide.createIcons();
    });
};

// --- LEAGUE HEADER ---
function renderLeagueHeader() {
    const container = document.getElementById('view-contest');
    let header = document.getElementById('league-header');
    
    if (!header) {
        header = document.createElement('div');
        header.id = 'league-header';
        header.className = "mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-center justify-between animate-fade-in";
        const searchDiv = document.querySelector('#view-contest .relative.group');
        if(searchDiv && searchDiv.parentNode) {
            searchDiv.parentNode.insertBefore(header, searchDiv.nextSibling);
        }
    }
    
    const now = new Date();
    let daysLeft = 0;
    let labelTitle = "";
    let labelSub = "";

    if (socialViewMode === 'league') {
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const diff = lastDayOfMonth.getTime() - now.getTime();
        daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
        labelTitle = "Season Ends Soon";
        labelSub = "Top 3 win badges!";
    } else {
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
        const diff = lastDayOfYear.getTime() - now.getTime();
        daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
        labelTitle = "Year Ends Soon";
        labelSub = "Global Champion resets Dec 31!";
    }
    
    header.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-lg">
                <i data-lucide="trophy" class="w-5 h-5"></i>
            </div>
            <div>
                <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">${labelTitle}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">${labelSub}</p>
            </div>
        </div>
        <div class="text-right">
            <span class="block text-2xl font-bold text-amber-600 dark:text-amber-500">${daysLeft}</span>
            <span class="text-[10px] uppercase font-bold text-amber-600/60 dark:text-amber-500/60">Days Left</span>
        </div>
    `;
    if(window.lucide) lucide.createIcons();
}

function removeLeagueHeader() {
    const header = document.getElementById('league-header');
    if(header) header.remove();
}

// --- RENDER LEADERBOARD ---
function renderLeaderboard(filter = '') {
    if (!socialList) return;
    
    socialList.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();

    firebase.database().ref('users').once('value').then((snapshot) => {
        const data = snapshot.val(); 
        let users = [];
        if (data) {
             users = Object.entries(data).map(([key, value]) => {
                if (!value.name) { value.name = key; }
                return value;
            });
        }

        const myUser = JSON.parse(localStorage.getItem('auraUser'));
        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7); 
        const currentYearStr = now.getFullYear().toString();   

        users = users.map(u => {
            let score = 0;
            const userLastMonth = u.lastActiveMonth || ""; 
            
            if (socialViewMode === 'league') {
                score = (userLastMonth === currentMonthStr) ? (u.monthlyPoints || 0) : 0;
            } else {
                const userYear = userLastMonth.split('-')[0];
                score = (userYear === currentYearStr) ? (u.points || 0) : 0;
            }
            return { ...u, displayScore: score };
        });

        users = users.filter(u => u.name !== 'Owner');

        if (socialViewMode === 'friends' && myUser) {
            const myFriends = myUser.friends || [];
            users = users.filter(u => myFriends.includes(u.name) || u.name === myUser.name);
        }
        
        if (filter) {
            users = users.filter(u => u.name.toLowerCase().includes(filter));
        }

        users.sort((a, b) => b.displayScore - a.displayScore);

        socialList.innerHTML = '';
        if (users.length === 0) {
            socialList.innerHTML = `<div class="text-center py-10"><p class="text-slate-400 text-sm">No users found.</p></div>`;
            return;
        }

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isLastDayOfMonth = tomorrow.getDate() === 1;
        const isLastDayOfYear = (now.getMonth() === 11 && now.getDate() === 31);

        users.forEach((user, index) => {
            const isMe = myUser && user.name === myUser.name;
            const isFriend = myUser && myUser.friends && myUser.friends.includes(user.name);
            const rank = index + 1;
            
            // Check Items
            const inventory = user.inventory || [];
            const isGold = inventory.includes('golden_name');
            const hasBadge = inventory.includes('dev_badge');
            
            // Apply Gold Class
            const nameColorClass = isGold ? "text-amber-500 drop-shadow-sm" : "text-slate-700 dark:text-slate-200";

            // Rank Badge
            let rankHtml = `<span class="text-slate-400 font-bold text-sm w-8 text-center">${rank}</span>`;
            if (rank === 1) rankHtml = `<div class="rank-badge rank-1 animate-pop">1</div>`;
            else if (rank === 2) rankHtml = `<div class="rank-badge rank-2">2</div>`;
            else if (rank === 3) rankHtml = `<div class="rank-badge rank-3">3</div>`;

            if (isMe && rank === 1 && !filter && !hasCelebrated) {
                let shouldCelebrate = false;
                let title = "";
                let msg = "";

                if (socialViewMode === 'league' && isLastDayOfMonth) {
                    shouldCelebrate = true;
                    title = "Season Finale! 👑";
                    msg = "You are the Monthly League Leader!";
                } else if (socialViewMode === 'global' && isLastDayOfYear) {
                    shouldCelebrate = true;
                    title = "Year End Champion! 🏆";
                    msg = "You finished the year as #1 Global!";
                }

                if (shouldCelebrate) {
                    hasCelebrated = true; 
                    setTimeout(() => {
                        if(window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b'] });
                        if(window.showNotification) window.showNotification(title, msg, "success");
                    }, 500);
                }
            }

            let actionBtn = '';
            if (!isMe) {
                if (isFriend) {
                    actionBtn = `<button onclick="viewFriendProfile('${user.name}')" class="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg"><i data-lucide="user" class="w-4 h-4"></i></button>`;
                } else {
                    actionBtn = `<button onclick="addFriend('${user.name}')" class="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-indigo-600 rounded-lg"><i data-lucide="user-plus" class="w-4 h-4"></i></button>`;
                }
            } else {
                 actionBtn = `<button onclick="viewFriendProfile('${user.name}')" class="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><i data-lucide="user" class="w-4 h-4"></i></button>`;
            }

            const li = document.createElement('div');
            const specialClass = (isMe && rank === 1) 
                ? 'bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-500/50' 
                : (isMe ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700');

            li.className = `user-row flex items-center justify-between p-4 rounded-2xl border mb-2 transition-all animate-slide-in opacity-0 ${specialClass}`;
            li.style.animationDelay = `${index * 50}ms`;

            const scoreLabel = socialViewMode === 'league' ? 'This Month' : 'This Year';

            li.innerHTML = `
                <div class="flex items-center gap-4">
                    ${rankHtml}
                    <div>
                        <p class="text-sm font-bold ${nameColorClass} flex items-center gap-2">
                            ${user.name} 
                            ${hasBadge ? '<i data-lucide="heart" class="w-3 h-3 text-rose-500 fill-rose-500"></i>' : ''}
                            ${isMe ? '<span class="text-[10px] bg-indigo-100 dark:bg-indigo-500 text-indigo-700 dark:text-white px-1.5 rounded">YOU</span>' : ''}
                            ${rank === 1 && socialViewMode === 'league' ? '<span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded flex items-center gap-1"><i data-lucide="crown" class="w-3 h-3"></i> King</span>' : ''}
                        </p>
                        <p class="text-xs text-slate-400 font-medium">Streak: ${user.streak} 🔥</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <div class="font-bold text-indigo-600 dark:text-indigo-400 text-sm">${user.displayScore.toLocaleString()}</div>
                        <div class="text-[10px] text-slate-400 uppercase">${scoreLabel}</div>
                    </div>
                    ${actionBtn}
                </div>
            `;
            socialList.appendChild(li);
        });
        if(window.lucide) lucide.createIcons();
    });
}
