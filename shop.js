/* shop.js - Samsung White Mode */

// --- CONFIG ---
const SHOP_ITEMS = [
    {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        icon: 'snowflake',
        price: 500,
        type: 'consumable',
        desc: 'Protects your streak for 1 day if you miss a task.',
        // WHITE MODE: Light Gray BG, Black Icon
        color: 'text-black bg-slate-100'
    },
    {
        id: 'golden_name',
        name: 'Bold Name', // Renamed from "Golden Name" to fit monochrome
        icon: 'crown',
        price: 2000,
        type: 'cosmetic',
        desc: 'Your name appears Bold & Black in the Global Contest.',
        // WHITE MODE: Light Gray BG, Black Icon
        color: 'text-black bg-slate-100'
    },
    {
        id: 'dev_badge',
        name: 'Supporter Badge',
        icon: 'heart',
        price: 5000,
        type: 'badge',
        desc: 'Adds a black heart badge next to your name.',
        // WHITE MODE: Light Gray BG, Black Icon
        color: 'text-black bg-slate-100'
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

    // 2. Check Ownership
    const inventory = user.inventory || [];
    if (item.type !== 'consumable' && inventory.includes(itemId)) {
        return alert("You already own this item!");
    }

    if (confirm(`Purchase ${item.name} for ${item.price} points?`)) {
        // 3. Deduct Points
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
        
        if(firebase) {
            firebase.database().ref('users/' + user.name).update({
                inventory: user.inventory || [],
                streakFreezes: user.streakFreezes || 0,
                points: profile.points 
            });
        }

        // 6. Feedback - White Mode Confetti (Black/Silver)
        if(window.showNotification) window.showNotification("Purchase Successful!", `You bought ${item.name}`, "success");
        if(window.confetti) confetti({ 
            particleCount: 100, 
            spread: 70, 
            origin: { y: 0.6 }, 
            colors: ['#000000', '#CCCCCC', '#888888'] 
        });
        
        renderShopUI();
    }
};

// --- RENDER ---
function renderShopUI() {
    const container = document.getElementById('shop-list');
    const pointsDisplay = document.getElementById('shop-points-display');
    if (!container) return;

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
            // OWNED: Light Gray BG, Slate-400 Text
            btnHtml = `<button disabled class="w-full py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed border border-slate-200">Owned</button>`;
        } else {
            // BUY: Black BG, White Text OR Light Gray Disabled
            const btnColor = canAfford ? 'bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200';
            const action = canAfford ? `onclick="buyItem('${item.id}')"` : '';
            btnHtml = `<button ${action} class="w-full py-2 rounded-xl ${btnColor} text-sm font-bold transition-all">Buy ${item.price}</button>`;
        }

        // Count Badge: Black BG, White Text
        let countBadge = '';
        if(item.id === 'streak_freeze' && freezes > 0) {
            countBadge = `<span class="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Own: ${freezes}</span>`;
        }

        const div = document.createElement('div');
        // ITEM CARD: White BG, Slate-200 Border
        div.className = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden animate-fade-in";
        div.innerHTML = `
            ${countBadge}
            <div class="flex items-start gap-4 mb-4">
                <div class="p-3 rounded-xl ${item.color}">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900">${item.name}</h3>
                    <p class="text-xs text-slate-400 mt-1 leading-snug">${item.desc}</p>
                </div>
            </div>
            ${btnHtml}
        `;
        container.appendChild(div);
    });

    if(window.lucide) lucide.createIcons();
}
