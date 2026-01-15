/* shop.js - S1N Industrial Theme Update */

// --- CATALOG CONFIG ---
const SHOP_ITEMS = [
    {
        id: 'badge_crown',
        name: 'Crown',
        type: 'badge',
        cost: 1000,
        icon: 'crown',
        description: 'Status symbol for the elite.',
    },
    {
        id: 'badge_star',
        name: 'Star',
        type: 'badge',
        cost: 500,
        icon: 'star',
        description: 'Mark of distinction.',
    },
    {
        id: 'badge_fire',
        name: 'Flame',
        type: 'badge',
        cost: 300,
        icon: 'flame',
        description: 'For the relentless.',
    },
    {
        id: 'badge_zap',
        name: 'Voltage',
        type: 'badge',
        cost: 250,
        icon: 'zap',
        description: 'High efficiency rating.',
    },
    {
        id: 'theme_emerald',
        name: 'Support',
        type: 'consumable', 
        cost: 2000,
        icon: 'leaf',
        description: 'Contributor Badge (Donation).',
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
        // S1N Style: Bordered card, no shadow. Opacity change if owned.
        div.className = `card-s1n p-5 flex flex-col justify-between transition-all duration-300 ${isOwned ? 'opacity-50' : 'hover:border-main'}`;
        
        // Button Logic (Industrial Buttons)
        let actionBtn = '';
        
        if (isOwned) {
            actionBtn = `
                <button disabled class="w-full py-3 mt-4 border border-border rounded-full text-xs font-bold uppercase tracking-wider text-muted cursor-not-allowed">
                    Acquired
                </button>
            `;
        } else if (canAfford) {
            actionBtn = `
                <button onclick="buyItem('${item.id}')" class="btn-s1n w-full mt-4 text-xs uppercase tracking-wider">
                    Purchase ${item.cost}
                </button>
            `;
        } else {
            actionBtn = `
                <button disabled class="w-full py-3 mt-4 border border-border rounded-full text-xs font-bold uppercase tracking-wider text-muted cursor-not-allowed opacity-50">
                    Need ${item.cost}
                </button>
            `;
        }

        div.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 border border-main rounded-md flex items-center justify-center text-main">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    </div>
                    ${isOwned ? '<i data-lucide="check" class="w-4 h-4 text-muted"></i>' : ''}
                </div>
                
                <h3 class="font-bold text-lg leading-tight tracking-tight text-main uppercase">${item.name}</h3>
                <p class="text-[10px] text-muted mt-1 uppercase tracking-wider">${item.description}</p>
            </div>
            
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
    if (!user) return alert("System Error: No user logged in.");

    if (user.points < item.cost) {
        return alert("Insufficient Credits.");
    }

    if (!confirm(`Confirm purchase of ${item.name} for ${item.cost} credits?`)) return;

    // 1. Local Updates
    user.points -= item.cost;
    if (!user.inventory) user.inventory = [];
    user.inventory.push(item.id);

    // Update Profile Object
    let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
    profile.points = user.points;
    
    // 2. Save Local
    localStorage.setItem('auraUser', JSON.stringify(user));
    localStorage.setItem('auraProfile', JSON.stringify(profile));

    // 3. UI Updates
    loadShop(); 
    if(window.updateProfileUI) window.updateProfileUI(); 
    
    // 4. Notification & Effect
    if (window.showNotification) {
        window.showNotification("Transaction Complete", `${item.name} added to inventory.`, "success");
        // Monochrome confetti
        if(window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#000000', '#FFFFFF'] });
    }

    // 5. Firebase Sync
    try {
        await firebase.database().ref('users/' + user.name).update({
            points: user.points,
            inventory: user.inventory
        });
    } catch (error) {
        console.error("Sync error:", error);
        // Silent fail on sync is okay for now, local storage is authoritative for UI
    }
};
