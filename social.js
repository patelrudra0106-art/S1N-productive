/* social.js - Cloud Version */

const socialList = document.getElementById('contest-list'); 
const searchInput = document.getElementById('user-search');

window.loadContestData = function() {
    renderLeaderboard();
};

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderLeaderboard(query);
    });
}

function renderLeaderboard(filter = '') {
    if (!socialList) return;
    
    // 1. Show Loading Spinner
    socialList.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();

    // 2. DOWNLOAD FROM FIREBASE CLOUD
    firebase.database().ref('users').once('value').then((snapshot) => {
        const data = snapshot.val(); 
        
        // Convert data object to list
        let users = data ? Object.values(data) : [];
        const myUser = JSON.parse(localStorage.getItem('auraUser'));

        // Filter search
        if (filter) {
            users = users.filter(u => u.name.toLowerCase().includes(filter));
        }

        // Sort by Points (Highest first)
        users.sort((a, b) => b.points - a.points);

        // Render List
        socialList.innerHTML = '';
        
        if (users.length === 0) {
            socialList.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-slate-400 text-sm">No users found.</p>
                </div>`;
            return;
        }

        users.forEach((user, index) => {
            const isMe = myUser && user.name === myUser.name;
            const rank = index + 1;
            
            // Badges
            let rankHtml = `<span class="text-slate-400 font-bold text-sm w-8 text-center">${rank}</span>`;
            if (rank === 1) rankHtml = `<div class="rank-badge rank-1">1</div>`;
            if (rank === 2) rankHtml = `<div class="rank-badge rank-2">2</div>`;
            if (rank === 3) rankHtml = `<div class="rank-badge rank-3">3</div>`;

            const li = document.createElement('div');
            li.className = `user-row flex items-center justify-between p-4 rounded-2xl border mb-2 transition-all ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`;
            
            li.innerHTML = `
                <div class="flex items-center gap-4">
                    ${rankHtml}
                    <div>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            ${user.name} 
                            ${isMe ? '<span class="text-[10px] bg-indigo-100 dark:bg-indigo-500 text-indigo-700 dark:text-white px-1.5 rounded">YOU</span>' : ''}
                        </p>
                        <p class="text-xs text-slate-400 font-medium">Streak: ${user.streak} 🔥</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-indigo-600 dark:text-indigo-400 text-sm">${user.points.toLocaleString()}</div>
                    <div class="text-[10px] text-slate-400 uppercase">Points</div>
                </div>
            `;
            socialList.appendChild(li);
        });
        if(window.lucide) lucide.createIcons();
    });
}
