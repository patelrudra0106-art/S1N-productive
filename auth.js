/* auth.js - Cloud Version */

// --- STATE ---
let currentUser = JSON.parse(localStorage.getItem('auraUser')) || null;

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
        if(mainApp) mainApp.classList.remove('hidden');
        if(authOverlay) authOverlay.classList.add('hidden');
        listenToStats(); // Keep score updated
    } else {
        // User needs to login
        if(authOverlay) authOverlay.classList.remove('hidden');
        if(mainApp) mainApp.classList.add('hidden');
    }
});

// --- TOGGLE LOGIN / SIGNUP ---
window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Welcome to Aura";
        authSubmitBtn.textContent = "Log In";
        toggleAuthText.innerHTML = "New here? <span class='text-indigo-600 font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Create Account</span>";
        confirmPassField.classList.add('hidden');
    } else {
        authTitle.textContent = "Join Contest";
        authSubmitBtn.textContent = "Sign Up";
        toggleAuthText.innerHTML = "Have an account? <span class='text-indigo-600 font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Log In</span>";
        confirmPassField.classList.remove('hidden');
    }
};

// --- HANDLE SUBMIT (CLOUD) ---
window.handleAuth = async function(e) {
    e.preventDefault();
    
    // Remove symbols that Firebase hates: . # $ [ ]
    const name = nameInput.value.trim().replace(/[.#$/[\]]/g, ""); 
    const password = passInput.value;
    const confirmPass = confirmPassInput.value;

    if (!name || !password) return alert("Please fill in all fields");

    // Loading State
    authSubmitBtn.disabled = true;
    authSubmitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>';
    if(window.lucide) lucide.createIcons();

    // Check Cloud Database
    const userRef = firebase.database().ref('users/' + name);

    try {
        const snapshot = await userRef.get();
        const userData = snapshot.val();

        if (isLoginMode) {
            // LOGIN LOGIC
            if (userData && userData.password === password) {
                loginUser(userData);
            } else {
                throw new Error("Invalid Username or Password");
            }
        } else {
            // SIGNUP LOGIC
            if (password !== confirmPass) throw new Error("Passwords do not match");
            if (userData) throw new Error("Username already taken");

            const newUser = {
                name: name,
                password: password,
                points: 0,
                streak: 0,
                joinDate: new Date().toLocaleDateString()
            };

            // Save new user to Cloud
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
    
    // Create local profile copy
    let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
    profile.name = user.name;
    profile.points = user.points;
    profile.streak = user.streak;
    localStorage.setItem('auraProfile', JSON.stringify(profile));
    
    // Show App
    authOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    window.location.reload(); 
}

// --- SYNC SCORE TO CLOUD ---
window.syncUserToDB = function(newPoints, newStreak) {
    if (!currentUser) return;
    firebase.database().ref('users/' + currentUser.name).update({
        points: newPoints,
        streak: newStreak
    });
};

function listenToStats() {
    // If I play on another device, update this device instantly
    firebase.database().ref('users/' + currentUser.name).on('value', (snapshot) => {
        const data = snapshot.val();
        if(data) {
             let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
             if(data.points !== profile.points) {
                 profile.points = data.points;
                 profile.streak = data.streak;
                 localStorage.setItem('auraProfile', JSON.stringify(profile));
                 // Update the display immediately
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
    if(confirm("Delete account permanently? This removes you from the contest.")) {
        firebase.database().ref('users/' + currentUser.name).remove()
        .then(() => {
            localStorage.clear();
            window.location.reload();
        });
    }
};
