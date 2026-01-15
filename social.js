/* social.js - S1N Industrial Theme Update */

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

// Toggle Tabs (Black & White Style)
window.setSocialTab = function(mode) {
    socialViewMode = mode;
    hasCelebrated = false; 
    
    // Default Style (Transparent with text)
    const defaultClass = "px-4 py-2 rounded-full border border-border text-muted hover:text-main text-xs font-bold uppercase whitespace-nowrap transition-colors";
    
    // Active Style (Solid Black/White)
    const activeClass = "px-4 py-2 rounded-full border border-main bg-main text-body text-xs font-bold uppercase whitespace-nowrap transition-colors";

    const tabGlobal = document.getElementById('tab-global');
    const tabFriends = document.getElementById('tab-friends');
    const tabLeague = document.getElementById('tab-league');

    // Reset all
    if(tabGlobal) tabGlobal.className = defaultClass;
    if(tabFriends) tabFriends.className = defaultClass;
    if(tabLeague) tabLeague.className = defaultClass;

    // Set Active
    if (mode === 'league') {
        if(tabLeague) tabLeague.className = activeClass;
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
    
    if (currentUser.friends.includes(targetName)) {
        return alert("Already in network.");
    }

    currentUser.friends.push(targetName);
    localStorage.setItem('auraUser', JSON.stringify(currentUser));

    firebase.database().ref('users/' + currentUser.name).update({
        friends: currentUser.friends
    }).then(() => {
        if(window.showNotification) window.showNotification("Network Update", `Added ${targetName}`, "success");
        renderLeaderboard(searchInput ? searchInput.value : '');
    }).catch(err => {
        alert("Error: " + err.message);
    });
};

window.removeFriend = function(targetName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return;

    if (confirm(`Remove ${targetName} from network?`)) {
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

// --- VIEW PROFILE (S1N Modal Style) ---
window.viewFriendProfile = function(targetName) {
    const modal = document.getElementById('friend-modal');
    const content = document.getElementById('friend-modal-content');
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    const isFriend = currentUser && currentUser.friends && currentUser.friends.includes(targetName);

    if(!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();

    firebase.database().ref('users/' + targetName).once('value').then((snapshot) => {
        const user = snapshot.val();
        if (!user) {
            content.innerHTML = '<p class="text-center text-muted">User data corrupted.</p>';
            return;
        }

        const joinDate = user.joinDate || "Unknown";
        const tasks = user.totalTasks || 0;
        const minutes = user.totalMinutes || 0;
        
        // --- BADGE LOGIC ---
        const inventory = user.inventory || [];
        let badgesHtml = '';
        if (inventory.length > 0) {
            badgesHtml = `<div class="flex flex-wrap gap-2 justify-center mb-6 pt-4 border-t border-border">`;
            // Simplified badge icons for S1N theme
            const badgeMap = {
                'badge_crown': 'crown', 'badge_star': 'star', 'badge_fire': 'flame', 
                'badge_zap': 'zap', 'theme_emerald': 'leaf'
            };
            
            inventory.forEach(id => {
                if(badgeMap[id]) {
                    badgesHtml += `<div class="p-2 border border-border rounded-md text-muted hover:text-main hover:border-main transition-colors" title="${id}">
                        <i data-lucide="${badgeMap[id]}" class="w-4 h-4"></i>
                    </div>`;
                }
            });
            badgesHtml += `</div>`;
        }

        content.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full border border-border flex items-center justify-center font-bold text-xl bg-input">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold tracking-tight">${user.name}</h3>
                        <p class="text-[10px] text-muted uppercase tracking-wider">Member since ${joinDate}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('friend-modal').classList.add('hidden')" class="hover:text-rose-500 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="p-3 border border-border rounded-xl text-center">
                    <div class="text-xl font-bold font-mono">${user.points || 0}</div>
                    <div class="text-[10px] uppercase font-bold text-muted">Credits</div>
                </div>
                <div class="p-3 border border-border rounded-xl text-center">
                    <div class="text-xl font-bold font-mono">${user.streak || 0}</div>
                    <div class="text-[10px] uppercase font-bold text-muted">Streak</div>
                </div>
            </div>

            <div class="space-y-3 mb-6">
                 <div class="flex justify-between items-center p-3 bg-input rounded-xl border border-border">
                    <span class="text-xs font-bold uppercase text-muted">Tasks Done</span>
                    <span class="font-bold font-mono">${tasks}</span>
                 </div>
                 <div class="flex justify-between items-center p-3 bg-input rounded-xl border border-border">
                    <span class="text-xs font-bold uppercase text-muted">Focus Time</span>
                    <span class="font-bold font-mono">${minutes}m</span>
                 </div>
            </div>
            
            ${badgesHtml}

            ${isFriend ? 
                `<button onclick="removeFriend('${user.name}')" class="w-full py-3 border border-rose-200 text-rose-500 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">Disconnect</button>` 
                : 
                `<button onclick="addFriend('${user.name}'); document.getElementById('friend-modal').classList.add('hidden')" class="btn-s1n w-full py-3 text-xs uppercase tracking-wider">Connect</button>`
            }
        `;
        if(window.lucide) lucide.createIcons();
    });
};

// --- LEAGUE HEADER (Minimal Strip) ---
function renderLeagueHeader() {
    // S1N Theme removes the colorful "Season Ends Soon" banner 
    // and replaces it with a simple text indicator if needed.
    // For this theme, we'll keep it very subtle.
    
    // We check if we need to insert it
    const container = document.getElementById('view-contest');
    let header = document.getElementById('league-header');
    
    if (socialViewMode === 'league') {
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const diff = lastDayOfMonth.getTime() - now.getTime();
        const daysLeft = Math.ceil(diff / (1000 * 3600 * 24));

        if (!header) {
            header = document.createElement('div');
            header.id = 'league-header';
            header.className = "mb-6 p-4 border border-border rounded-xl flex items-center justify-between animate-fade-in bg-input";
            
            const searchDiv = document.querySelector('#view-contest .relative');
            if(searchDiv) {
                searchDiv.parentNode.insertBefore(header, searchDiv);
            }
        }

        header.innerHTML = `
            <div class="flex items-center gap-3">
                <i data-lucide="trophy" class="w-5 h-5 text-main"></i>
                <div>
                    <h3 class="font-bold text-sm">Monthly League</h3>
                    <p class="text-[10px] text-muted uppercase tracking-wider">Top 3 receive badges</p>
                </div>
            </div>
            <div class="text-right">
                <span class="block text-xl font-bold font-mono">${daysLeft}</span>
                <span class="text-[10px] uppercase font-bold text-muted">Days Left</span>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    } else {
        removeLeagueHeader();
    }
}

function removeLeagueHeader() {
    const header = document.getElementById('league-header');
    if(header) header.remove();
}

// --- CORE RENDER FUNCTION ---
function renderLeaderboard(filter = '') {
    if (!socialList) return;
    
    socialList.innerHTML = '<div class="text-center py-12 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
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

        users = users.map(u => {
            let score = 0;
            const userLastMonth = u.lastActiveMonth || "";
            
            if (socialViewMode === 'league') {
                score = (userLastMonth === currentMonthStr) ? (u.monthlyPoints || 0) : 0;
            } else {
                score = u.points || 0; 
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
            socialList.innerHTML = `<div class="text-center py-12 border border-dashed border-border rounded-xl"><p class="text-muted text-sm font-bold uppercase tracking-wider">No agents found.</p></div>`;
            return;
        }

        users.forEach((user, index) => {
            const isMe = myUser && user.name === myUser.name;
            const isFriend = myUser && myUser.friends && myUser.friends.includes(user.name);
            const rank = index + 1;
            
            // Rank Badge (Using new CSS classes)
            let rankHtml = `<span class="text-muted font-bold text-sm w-8 text-center font-mono">#${rank}</span>`;
            if (rank === 1) rankHtml = `<div class="rank-badge rank-1">1</div>`;
            else if (rank === 2) rankHtml = `<div class="rank-badge rank-2">2</div>`;
            else if (rank === 3) rankHtml = `<div class="rank-badge rank-3">3</div>`;

            // Action Button
            let actionBtn = '';
            if (!isMe) {
                if (isFriend) {
                    actionBtn = `<button onclick="viewFriendProfile('${user.name}')" class="p-2 text-main hover:bg-input rounded-md transition-colors"><i data-lucide="user" class="w-4 h-4"></i></button>`;
                } else {
                    actionBtn = `<button onclick="addFriend('${user.name}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors"><i data-lucide="user-plus" class="w-4 h-4"></i></button>`;
                }
            } else {
                 actionBtn = `<div class="p-2 text-muted cursor-default"><i data-lucide="user" class="w-4 h-4 opacity-50"></i></div>`;
            }

            const li = document.createElement('div');
            // S1N Style: No background colors for "Me", just a bold border or specific styling
            const borderClass = (isMe) ? 'border-main' : 'border-border';
            
            li.className = `user-row flex items-center justify-between p-4 rounded-xl border mb-2 transition-all animate-slide-in ${borderClass} hover:border-muted`;
            li.style.animationDelay = `${index * 50}ms`;

            li.innerHTML = `
                <div class="flex items-center gap-4">
                    ${rankHtml}
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-bold ${isMe ? 'text-main' : 'text-main'}">${user.name}</p>
                            ${isMe ? '<span class="text-[9px] border border-main px-1 rounded uppercase font-bold">You</span>' : ''}
                        </div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-wider">Streak: ${user.streak}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <div class="font-bold text-main font-mono">${user.displayScore.toLocaleString()}</div>
                    </div>
                    ${actionBtn}
                </div>
            `;
            socialList.appendChild(li);
        });
        if(window.lucide) lucide.createIcons();
    });
}
