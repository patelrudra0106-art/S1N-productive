/* profile.js - Updated with Badge Display */

// --- STATE ---
let userProfile = JSON.parse(localStorage.getItem('auraProfile')) || {
    name: 'Guest',
    points: 0,        
    monthlyPoints: 0, 
    streak: 0,
    lastTaskDate: null,
    lastActiveMonth: new Date().toISOString().slice(0, 7) 
};

// --- CHECK RESET LOGIC (MONTHLY & YEARLY) ---
(function checkTimeResets() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); 
    const currentYear = now.getFullYear().toString();   

    const savedMonth = userProfile.lastActiveMonth || "";
    const savedYear = savedMonth.split('-')[0]; 

    let hasChanged = false;

    // 1. YEARLY RESET 
    if (savedYear && savedYear !== currentYear) {
        userProfile.points = 0;
        hasChanged = true;
    }

    // 2. MONTHLY RESET
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
    
    if(window.syncUserToDB) window.syncUserToDB(userProfile.points, userProfile.streak, userProfile.monthlyPoints, userProfile.lastActiveMonth);
    
    if(amount > 0 && window.showNotification) window.showNotification(`+${amount} Points!`, reason, 'success');
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

// --- BADGE RENDERING (NEW) ---
function renderProfileBadges() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const inventory = (user && user.inventory) ? user.inventory : [];
    
    // Find or create badge container in modal
    const modalContent = document.querySelector('#account-modal > div');
    if (!modalContent) return;

    let badgeContainer = document.getElementById('profile-badges');
    
    // If user has no badges, hide container if it exists
    if (inventory.length === 0) {
        if(badgeContainer) badgeContainer.innerHTML = '';
        return;
    }

    // Create container if it doesn't exist
    if (!badgeContainer) {
        badgeContainer = document.createElement('div');
        badgeContainer.id = 'profile-badges';
        badgeContainer.className = "flex flex-wrap gap-2 justify-center mb-6 animate-fade-in";
        // Insert after the stats row (points/streak) which is the 2nd child usually
        // We insert it before the "Current User" name box
        const nameBox = document.querySelector('#account-modal .bg-slate-50.rounded-2xl.mb-4');
        if (nameBox) {
            nameBox.parentNode.insertBefore(badgeContainer, nameBox);
        }
    }

    // Map IDs to Visuals (Simple Lookup to avoid dependency issues)
    const badgeLookups = {
        'badge_crown': { icon: 'crown', color: 'bg-amber-100 text-amber-600' },
        'badge_star': { icon: 'star', color: 'bg-purple-100 text-purple-600' },
        'badge_fire': { icon: 'flame', color: 'bg-orange-100 text-orange-600' },
        'badge_zap': { icon: 'zap', color: 'bg-indigo-100 text-indigo-600' },
        'theme_emerald': { icon: 'leaf', color: 'bg-emerald-100 text-emerald-600' }
    };

    badgeContainer.innerHTML = '';
    inventory.forEach(itemId => {
        const visual = badgeLookups[itemId] || { icon: 'award', color: 'bg-slate-100 text-slate-500' };
        
        const badge = document.createElement('div');
        badge.className = `p-2 rounded-lg ${visual.color} shadow-sm`;
        badge.title = itemId;
        badge.innerHTML = `<i data-lucide="${visual.icon}" class="w-5 h-5"></i>`;
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
    
    if(!oldPass || !newPass) return alert("Please fill in both fields.");
    if(newPass.length < 4) return alert("New password is too short.");
    
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if(!user) return alert("You must be logged in.");

    const originalText = btn.textContent;
    btn.textContent = "Updating...";
    btn.disabled = true;

    try {
        const snapshot = await firebase.database().ref('users/' + user.name).once('value');
        const dbUser = snapshot.val();
        
        if (!dbUser || dbUser.password !== oldPass) {
            throw new Error("Current password is incorrect.");
        }

        await firebase.database().ref('users/' + user.name).update({
            password: newPass
        });

        user.password = newPass;
        localStorage.setItem('auraUser', JSON.stringify(user));

        alert("Password updated successfully!");
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
