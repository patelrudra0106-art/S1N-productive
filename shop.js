
/* shop.js */

// --- CONFIG ---
const SHOP_ITEMS = [
    {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        icon: 'snowflake',
        price: 500,
        type: 'consumable',
        desc: 'Protects your streak for 1 day if you miss a task.',
        color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
        id: 'golden_name',
        name: 'Golden Name',
        icon: 'crown',
        price: 2000,
        type: 'cosmetic',
        desc: 'Your name appears Gold in the Global Contest.',
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
    },
    {
        id: 'dev_badge',
        name: 'Supporter Badge',
        icon: 'heart',
        price: 5000,
        type: 'badge',
        desc: 'Adds a heart badge next to your name.',
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
    }
];

// --- INIT ---
window.loadShop = function() {
    renderShopUI();
};

// --- LOGIC ---
function getInventory() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    return user ? (user.inventory || []) : [];
}

window.buyItem = function(itemId) {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const profile = JSON.parse(localStorage.getItem('auraProfile'));
    
    if (!user || !profile) return alert("Please log in to access the shop.");

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // 1. Check Funds
    if (profile.points < item.price) {
        if(window.showNotification) window.showNotification("Insufficient Points", `You need ${item.price - profile.points} more points!`, "warning");
        return;
    }

    // 2. Check Ownership (if not consumable)
    const inventory = user.inventory || [];
    if (item.type !== 'consumable' && inventory.includes(itemId)) {
        return alert("You already own this item!");
    }

    if (confirm(`Purchase ${item.name} for ${item.price} points?`)) {
        // 3. Deduct Points using profile.js helper
        if (window.spendPoints) {
            const success = window.spendPoints(item.price);
            if (!success) return;
        }

        // 4. Add to Inventory
        if (item.type === 'consumable') {
            user.streakFreezes = (user.streakFreezes || 0) + 1;
        } else {
            inventory.push(itemId);
            user.inventory = inventory;
        }

        // 5. Save & Sync
        localStorage.setItem('auraUser', JSON.stringify(user));
        
        // Sync to Firebase
        if(firebase) {
            firebase.database().ref('users/' + user.name).update({
                inventory: user.inventory || [],
                streakFreezes: user.streakFreezes || 0,
                points: profile.points // Ensure points match
            });
        }

        // 6. Feedback
        if(window.showNotification) window.showNotification("Purchase Successful!", `You bought ${item.name}`, "success");
        if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24'] });
        
        renderShopUI();
    }
};

// --- RENDER ---
function renderShopUI() {
    const container = document.getElementById('shop-list');
    const pointsDisplay = document.getElementById('shop-points-display');
    if (!container) return;

    // Update Shop Header Points
    const profile = JSON.parse(localStorage.getItem('auraProfile')) || { points: 0 };
    if(pointsDisplay) pointsDisplay.innerText = profile.points.toLocaleString();

    const user = JSON.parse(localStorage.getItem('auraUser')) || {};
    const inventory = user.inventory || [];
    const freezes = user.streakFreezes || 0;

    container.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const isOwned = item.type !== 'consumable' && inventory.includes(item.id);
        const canAfford = profile.points >= item.price;
        
        let btnHtml = '';
        if (isOwned) {
            btnHtml = `<button disabled class="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 text-sm font-bold cursor-not-allowed">Owned</button>`;
        } else {
            const btnColor = canAfford ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed';
            const action = canAfford ? `onclick="buyItem('${item.id}')"` : '';
            btnHtml = `<button ${action} class="w-full py-2 rounded-xl ${btnColor} text-sm font-bold transition-all">Buy ${item.price}</button>`;
        }

        // Specific count for consumables
        let countBadge = '';
        if(item.id === 'streak_freeze' && freezes > 0) {
            countBadge = `<span class="absolute top-2 right-2 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Own: ${freezes}</span>`;
        }

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden animate-fade-in";
        div.innerHTML = `
            ${countBadge}
            <div class="flex items-start gap-4 mb-4">
                <div class="p-3 rounded-xl ${item.color}">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-700 dark:text-slate-200">${item.name}</h3>
                    <p class="text-xs text-slate-400 mt-1 leading-snug">${item.desc}</p>
                </div>
            </div>
            ${btnHtml}
        `;
        container.appendChild(div);
    });

    if(window.lucide) lucide.createIcons();
}

