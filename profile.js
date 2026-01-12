/* profile.js */

// --- STATE ---
let userProfile = JSON.parse(localStorage.getItem('auraProfile')) || {
    name: 'Guest',
    points: 0,        // Represents "Yearly Points"
    monthlyPoints: 0, // Represents "Monthly Points"
    streak: 0,
    lastTaskDate: null,
    lastActiveMonth: new Date().toISOString().slice(0, 7) // Format: "YYYY-MM"
};

// --- CHECK RESET LOGIC (MONTHLY & YEARLY) ---
(function checkTimeResets() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "2026-01"
    const currentYear = now.getFullYear().toString();   // "2026"

    const savedMonth = userProfile.lastActiveMonth || "";
    const savedYear = savedMonth.split('-')[0]; // Extract year from "2025-12"

    let hasChanged = false;

    // 1. YEARLY RESET (Global = Full Year)
    // If the saved year is different from now, reset main points
    if (savedYear && savedYear !== currentYear) {
        userProfile.points = 0;
        hasChanged = true;
    }

    // 2. MONTHLY RESET
    // If the saved month is different, reset monthly points
    if (savedMonth !== currentMonth) {
        userProfile.monthlyPoints = 0;
        userProfile.lastActiveMonth = currentMonth;
        hasChanged = true;
    }

    if (hasChanged) {
        saveProfile();
        // If logged in, we should ideally sync 0 to DB immediately, 
        // but it will sync on the next task/point update automatically.
    }
})();

// --- DOM ELEMENTS ---
const pointsDisplay = document.getElementById('display-points');
const streakDisplay = document.getElementById('display-streak');
const navStreak = document.getElementById('streak-count');
const profileNameDisplay = document.getElementById('profile-name');

// --- LOGIC ---
window.addPoints = function(amount, reason) {
    // 1. Update Yearly Points
    userProfile.points += amount;
    
    // 2. Update Monthly Points (Check month again just in case)
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (userProfile.lastActiveMonth !== currentMonth) {
        userProfile.monthlyPoints = 0;
        userProfile.lastActiveMonth = currentMonth;
    }
    userProfile.monthlyPoints = (userProfile.monthlyPoints || 0) + amount;

    saveProfile();
    updateProfileUI();
    
    // 3. Sync to Cloud
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
}

// --- MODAL CONTROLS (GLOBAL) ---
window.openAccount = function() {
    const modal = document.getElementById('account-modal');
    if(modal) {
        modal.classList.remove('hidden');
        updateProfileUI();
    }
};

window.closeAccount = function() {
    const modal = document.getElementById('account-modal');
    // Hide password form when closing modal to reset state
    const passForm = document.getElementById('change-pass-form');
    if(passForm) passForm.classList.add('hidden');
    
    if(modal) modal.classList.add('hidden');
};

// --- PASSWORD RESET LOGIC (NEW) ---
window.toggleChangePass = function() {
    const form = document.getElementById('change-pass-form');
    if(form) {
        form.classList.toggle('hidden');
        // Clear inputs when toggling
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
    
    // Validation
    if(!oldPass || !newPass) return alert("Please fill in both fields.");
    if(newPass.length < 4) return alert("New password is too short.");
    
    // Get Current User
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if(!user) return alert("You must be logged in.");

    // UI Loading State
    const originalText = btn.textContent;
    btn.textContent = "Updating...";
    btn.disabled = true;

    try {
        // 1. Check if Old Password matches DB (Double security)
        const snapshot = await firebase.database().ref('users/' + user.name).once('value');
        const dbUser = snapshot.val();
        
        if (!dbUser || dbUser.password !== oldPass) {
            throw new Error("Current password is incorrect.");
        }

        // 2. Update to New Password
        await firebase.database().ref('users/' + user.name).update({
            password: newPass
        });

        // 3. Update Local Storage
        user.password = newPass;
        localStorage.setItem('auraUser', JSON.stringify(user));

        // 4. Success UI
        alert("Password updated successfully!");
        window.toggleChangePass(); // Close form
        
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        // Reset Button
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateProfileUI();
});
