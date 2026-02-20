// js/app-logic.js

let posts = [];
let clients = ['Agma Energy', 'ELURA'];
let filter = 'All Clients';
let editId = null;
let cDate = new Date();
let currentUser = null;
let isSignup = false;
let unsubscribe = null;
let sortDesc = false;

// --- 1. DATA SYNC ---
function loadCloudData() {
    if (!currentUser) return;
    if (unsubscribe) unsubscribe(); 
    
    unsubscribe = db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            posts = data.posts || [];
            clients = data.clients || ['Agma Energy', 'ELURA'];
            render();
        } else {
            render(); 
        }
    });
}

function persist() {
    if (!currentUser) return;
    render(); 
    db.collection('users').doc(currentUser.uid).set({ posts: posts, clients: clients });
}

// --- 2. COLOR LOGIC ---
function getTagStyles(type) {
    const map = {
        'Anchor': { bg: 'var(--t-anchor-bg)', fg: 'var(--t-anchor-fg)', bd: 'var(--t-anchor-bd)' },
        'Engagement': { bg: 'var(--t-engage-bg)', fg: 'var(--t-engage-fg)', bd: 'var(--t-engage-bd)' },
        'Educational': { bg: 'var(--t-edu-bg)', fg: 'var(--t-edu-fg)', bd: 'var(--t-edu-bd)' },
        'Promotional': { bg: 'var(--t-promo-bg)', fg: 'var(--t-promo-fg)', bd: 'var(--t-promo-bd)' },
        'Standard': { bg: 'var(--t-std-bg)', fg: 'var(--t-std-fg)', bd: 'var(--t-std-bd)' }
    };
    return map[type] || map['Standard'];
}

function renderTagBadge(type) {
    if (!type || type === 'Standard') return '';
    const style = getTagStyles(type);
    return `<span class="tag-badge" style="background:${style.bg}; color:${style.fg}; border-color:${style.bd};">${type}</span>`;
}

// --- 3. VIEW RENDERING ---
function render() {
    const visible = filter === 'All Clients' ? posts : posts.filter(p => p.client === filter);
    document.getElementById('subtitle').innerText = `${visible.length} Active Campaigns`;
    document.getElementById('currentClient').innerText = filter;
    renderListView(visible);
    renderRoadmap(visible);
    renderCal(visible);
    renderClientDropdown();
}

function renderListView(visible) {
    const tbody = document.getElementById('listBody');
    const sortIcon = document.getElementById('sortIcon');
    if(sortIcon) sortIcon.innerText = sortDesc ? '↓' : '↑';
    
    const sorted = [...visible].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortDesc ? dateB - dateA : dateA - dateB;
    });

    tbody.innerHTML = sorted.map(p => `
        <tr onclick="edit('${p.id}')">
            <td>${renderTagBadge(p.type)}<div class="cell-main">${esc(p.title)}</div></td>
            <td>${getStatusBadge(p)}</td>
            <td>${esc(p.client)}</td>
            <td>${p.link ? `<a href="${p.link}" target="_blank" onclick="event.stopPropagation()" class="asset-btn">Asset</a>` : '—'}</td>
            <td style="text-align:right;">${formatDate(p.date)}</td>
        </tr>`).join('');
}

// --- 4. CALENDAR ENGINE ---
function renderCal(list) {
    const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calTitle').innerText = `${mNames[cDate.getMonth()]} ${cDate.getFullYear()}`;
    const y = cDate.getFullYear(), m = cDate.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m+1, 0).getDate();
    
    let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-head-cell">${d}</div>`).join('');
    for (let i = 0; i < first; i++) html += `<div class="cal-cell" style="background:#F9FAFB;"></div>`;
    
    for (let d = 1; d <= days; d++) {
        const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const has = list.filter(p => p.date && p.date.startsWith(iso));
        html += `<div class="cal-cell" onclick="openModal('${iso}')">
            <div class="cal-num">${d}</div>
            ${has.map(p => `<div class="cal-event" style="border-left:3px solid ${getTagStyles(p.type).fg};" onclick="event.stopPropagation(); edit('${p.id}')">${esc(p.title)}</div>`).join('')}
        </div>`;
    }
    document.getElementById('calGrid').innerHTML = html;
}

// --- 5. UTILITIES ---
function toggleSort() { sortDesc = !sortDesc; render(); }
function closeModal() { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active')); }
function esc(t) { return t ? t.replace(/</g, "&lt;") : ''; }
function formatDate(dateStr) { 
    if (!dateStr) return 'No Date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
}
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }

// (Add the rest of your standard modal opening/saving functions here)
