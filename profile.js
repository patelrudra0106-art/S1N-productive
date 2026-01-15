/* profile.js - S1N Industrial Theme Update */

// --- STATE ---
let userProfile = JSON.parse(localStorage.getItem('auraProfile')) || {
    name: 'Guest',
    points: 0,        
    monthlyPoints: 0, 
    streak: 0,
    lastTaskDate: null,
    lastActiveMonth: new Date().toISOString().slice(0, 7) 
};

// --- CHECK RESET LOGIC (MONTHLY ONLY) ---
(function checkTimeResets() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); 

    const savedMonth = userProfile.lastActiveMonth || "";
    let hasChanged = false;

    // Monthly Reset (For League)
    if (savedMonth !== currentMonth) {
        userProfile.monthlyPoints = 0;
        userProfile.lastActiveMonth = currentMonth;
        hasChanged = true;
    }

    if (hasChanged) {
        saveProfile();
    }
})();

// --- DOM ELEMENTS ---
const pointsDisplay = document.getElementById('display-points');
const streakDisplay = document.getElementById('display-streak');
const navStreak = document.getElementById('streak-count');
const profileNameDisplay = document.getElementById('profile-name');

// --- LOGIC ---
window.addPoints = function(amount, reason) {
    userProfile.points += amount;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (userProfile.lastActiveMonth !== currentMonth) {
        userProfile.monthlyPoints = 0;
        userProfile.lastActiveMonth = currentMonth;
    }
    userProfile.monthlyPoints = (userProfile.monthlyPoints || 0) + amount;

    saveProfile();
    updateProfileUI();
    
    // Sync to Cloud
    if(window.syncUserToDB) window.syncUserToDB(userProfile.points, userProfile.streak, userProfile.monthlyPoints, userProfile.lastActiveMonth);
    
    // Notification
    if(amount > 0 && window.showNotification) window.showNotification(`CREDITS +${amount}`, reason, 'success');
};

window.updateStreak = function() {
    const today = new Date().toISOString().split('T')[0];
    if (userProfile.lastTaskDate === today) return; 

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userProfile.lastTaskDate === yesterdayStr) {
        userProfile.streak += 1;
    } else {
        userProfile.streak = 1;
    }

    userProfile.lastTaskDate = today;
    saveProfile();
    updateProfileUI();
    
    if(window.syncUserToDB) window.syncUserToDB(userProfile.points, userProfile.streak, userProfile.monthlyPoints, userProfile.lastActiveMonth);
};

function saveProfile() {
    localStorage.setItem('auraProfile', JSON.stringify(userProfile));
}

function updateProfileUI() {
    if(navStreak) navStreak.textContent = userProfile.streak;
    if(pointsDisplay) pointsDisplay.textContent = userProfile.points.toLocaleString();
    if(streakDisplay) streakDisplay.textContent = userProfile.streak;
    if(profileNameDisplay) profileNameDisplay.textContent = userProfile.name || 'User';

    // RENDER BADGES
    renderProfileBadges();
}

// --- BADGE RENDERING (S1N Style) ---
function renderProfileBadges() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const inventory = (user && user.inventory) ? user.inventory : [];
    
    const modalContent = document.querySelector('#account-modal > div');
    if (!modalContent) return;

    let badgeContainer = document.getElementById('profile-badges');
    
    if (inventory.length === 0) {
        if(badgeContainer) badgeContainer.innerHTML = '';
        return;
    }

    if (!badgeContainer) {
        badgeContainer = document.createElement('div');
        badgeContainer.id = 'profile-badges';
        badgeContainer.className = "flex flex-wrap gap-2 justify-center mb-6 pt-4 border-t border-border";
        
        // Insert before the name box
        const nameBox = document.querySelector('#account-modal .bg-input.rounded-xl.mb-4');
        if (nameBox) {
            nameBox.parentNode.insertBefore(badgeContainer, nameBox);
        }
    }

    // Icon Lookup
    const badgeMap = {
        'badge_crown': 'crown', 
        'badge_star': 'star', 
        'badge_fire': 'flame', 
        'badge_zap': 'zap', 
        'theme_emerald': 'leaf'
    };

    badgeContainer.innerHTML = '';
    inventory.forEach(itemId => {
        const icon = badgeMap[itemId] || 'award';
        
        const badge = document.createElement('div');
        // Industrial Badge: Bordered, no background
        badge.className = `p-2 rounded-md border border-border text-muted hover:text-main hover:border-main transition-colors cursor-help`;
        badge.title = itemId;
        badge.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
        badgeContainer.appendChild(badge);
    });

    if(window.lucide) lucide.createIcons();
}

// --- MODAL CONTROLS ---
window.openAccount = function() {
    const modal = document.getElementById('account-modal');
    if(modal) {
        modal.classList.remove('hidden');
        updateProfileUI();
    }
};

window.closeAccount = function() {
    const modal = document.getElementById('account-modal');
    const passForm = document.getElementById('change-pass-form');
    if(passForm) passForm.classList.add('hidden');
    if(modal) modal.classList.add('hidden');
};

// --- PASSWORD RESET LOGIC ---
window.toggleChangePass = function() {
    const form = document.getElementById('change-pass-form');
    if(form) {
        form.classList.toggle('hidden');
        const old = document.getElementById('cp-old');
        const newP = document.getElementById('cp-new');
        if(old) old.value = '';
        if(newP) newP.value = '';
    }
};

window.submitChangePass = async function() {
    const oldPassInput = document.getElementById('cp-old');
    const newPassInput = document.getElementById('cp-new');
    const btn = document.getElementById('cp-btn');
    
    const oldPass = oldPassInput.value;
    const newPass = newPassInput.value;
    
    if(!oldPass || !newPass) return alert("All fields required.");
    if(newPass.length < 4) return alert("Password too short.");
    
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if(!user) return alert("Authentication error.");

    const originalText = btn.textContent;
    btn.textContent = "Updating...";
    btn.disabled = true;

    try {
        const snapshot = await firebase.database().ref('users/' + user.name).once('value');
        const dbUser = snapshot.val();
        
        if (!dbUser || dbUser.password !== oldPass) {
            throw new Error("Incorrect current password.");
        }

        await firebase.database().ref('users/' + user.name).update({
            password: newPass
        });

        user.password = newPass;
        localStorage.setItem('auraUser', JSON.stringify(user));

        alert("Credentials Updated.");
        window.toggleChangePass(); 
        
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateProfileUI();
});
