/* shop.js - In-App Store Logic */

// --- CATALOG CONFIG ---
const SHOP_ITEMS = [
    {
        id: 'badge_crown',
        name: 'Golden Crown',
        type: 'badge',
        cost: 1000,
        icon: 'crown',
        description: 'Show everyone who rules.',
        color: 'text-amber-500 bg-amber-50 border-amber-200'
    },
    {
        id: 'badge_star',
        name: 'Super Star',
        type: 'badge',
        cost: 500,
        icon: 'star',
        description: 'A badge for the shining stars.',
        color: 'text-purple-500 bg-purple-50 border-purple-200'
    },
    {
        id: 'badge_fire',
        name: 'Hot Streak',
        type: 'badge',
        cost: 300,
        icon: 'flame',
        description: 'For those who never stop.',
        color: 'text-orange-500 bg-orange-50 border-orange-200'
    },
    {
        id: 'badge_zap',
        name: 'Efficient',
        type: 'badge',
        cost: 250,
        icon: 'zap',
        description: 'Speed and focus combined.',
        color: 'text-indigo-500 bg-indigo-50 border-indigo-200'
    },
    {
        id: 'theme_emerald',
        name: 'Emerald Zen',
        type: 'consumable', 
        cost: 2000,
        icon: 'leaf',
        description: 'Support the developer! (Donation)',
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200'
    }
];

// --- INIT ---
window.loadShop = function() {
    const list = document.getElementById('shop-list');
    const pointsDisplay = document.getElementById('shop-points-display');
    const user = JSON.parse(localStorage.getItem('auraUser'));

    if (!list) return;
    
    // Update local Points Display in Header
    if (pointsDisplay && user) {
        pointsDisplay.textContent = user.points.toLocaleString();
    }

    renderShopItems(list, user);
};

// --- RENDER ---
function renderShopItems(container, user) {
    container.innerHTML = '';
    
    // Ensure inventory exists
    const inventory = (user && user.inventory) ? user.inventory : [];

    SHOP_ITEMS.forEach(item => {
        const isOwned = inventory.includes(item.id);
        const currentPoints = user ? user.points : 0;
        const canAfford = currentPoints >= item.cost;

        const div = document.createElement('div');
        div.className = `relative p-5 rounded-3xl border transition-all duration-300 ${isOwned ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-80' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-[1.02]'}`;
        
        // Button Logic
        let actionBtn = '';
        
        if (isOwned) {
            actionBtn = `
                <button disabled class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wide cursor-not-allowed">
                    Owned
                </button>
            `;
        } else if (canAfford) {
            actionBtn = `
                <button onclick="buyItem('${item.id}')" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                    Buy for ${item.cost}
                </button>
            `;
        } else {
            actionBtn = `
                <button disabled class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wide cursor-not-allowed">
                    Need ${item.cost} pts
                </button>
            `;
        }

        div.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} dark:bg-opacity-10">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                ${isOwned ? '<div class="px-2 py-1 bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold uppercase">Purchased</div>' : ''}
            </div>
            
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">${item.name}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 leading-relaxed line-clamp-2">${item.description}</p>
            
            ${actionBtn}
        `;
        container.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

// --- ACTIONS ---
window.buyItem = async function(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    let user = JSON.parse(localStorage.getItem('auraUser'));
    if (!user) return alert("Please log in to purchase items.");

    if (user.points < item.cost) {
        return alert("Not enough points!");
    }

    if (!confirm(`Purchase "${item.name}" for ${item.cost} points?`)) return;

    // 1. Local Updates
    user.points -= item.cost;
    if (!user.inventory) user.inventory = [];
    user.inventory.push(item.id);

    // Update Profile Object as well (for sync compatibility)
    let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
    profile.points = user.points;
    
    // 2. Save Local
    localStorage.setItem('auraUser', JSON.stringify(user));
    localStorage.setItem('auraProfile', JSON.stringify(profile));

    // 3. UI Updates
    loadShop(); // Re-render shop
    if(window.updateProfileUI) window.updateProfileUI(); // Update points in sidebar/modal
    
    // 4. Notification & Effect
    if (window.showNotification) {
        window.showNotification("Purchase Successful! 🛍️", `You bought ${item.name}`, "success");
        if(window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1'] });
    }

    // 5. Firebase Sync
    try {
        await firebase.database().ref('users/' + user.name).update({
            points: user.points,
            inventory: user.inventory
        });
    } catch (error) {
        console.error("Sync error:", error);
        alert("Purchase made locally, but failed to sync to cloud. Check internet.");
    }
};
