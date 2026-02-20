// js/app-logic.js

// --- GLOBAL STATE ---
let posts = [];
let clients = ['Agma Energy', 'ELURA'];
let filter = 'All Clients';
let editId = null;
let cDate = new Date();
let currentUser = null;
let unsubscribe = null;
let sortDesc = false;

// --- 1. CLOUD DATA ENGINE ---
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
    }, (error) => { 
        console.error("Sync Error:", error); 
        toast("Sync Error"); 
    });
}

function persist() {
    if (!currentUser) return;
    render(); 
    db.collection('users').doc(currentUser.uid).set({ 
        posts: posts, 
        clients: clients 
    }).catch(e => { 
        console.error("Save error:", e); 
        toast("Failed to save"); 
    });
}

// --- 2. VIEW & UI LOGIC ---
function setView(viewName, btn) { 
    document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active')); 
    document.getElementById('view-' + viewName).classList.add('active'); 
    document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
}

function toggle(id) { 
    const el = document.getElementById(id); 
    el.style.display = (el.style.display === 'block') ? 'none' : 'block'; 
}

function render() {
    const visible = filter === 'All Clients' ? posts : posts.filter(p => p.client === filter);
    document.getElementById('subtitle').innerText = `${visible.length} Active Campaigns`;
    document.getElementById('currentClient').innerText = filter;

    renderListView(visible);
    renderRoadmap(visible);
    renderCal(visible);
    renderClientDropdown();
}

// --- 3. RENDERING ENGINES ---

function renderListView(visible) {
    const tbody = document.getElementById('listBody');
    if (!tbody) return;
    
    const sortIcon = document.getElementById('sortIcon');
    if(sortIcon) sortIcon.innerText = sortDesc ? '↓' : '↑';
    
    if (visible.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:60px; color:var(--text-light);">No campaigns found.</td></tr>`;
        return;
    } 
    
    const sorted = [...visible].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortDesc ? dateB - dateA : dateA - dateB;
    });

    tbody.innerHTML = sorted.map(p => `
        <tr onclick="edit('${p.id}')">
            <td>
                ${renderTagBadge(p.type)}
                <div class="cell-main">${esc(p.title)}</div>
                <div class="cell-sub">${esc(p.caption) || ''}</div>
            </td>
            <td>${getStatusBadge(p)}</td>
            <td>${esc(p.client)}</td>
            <td>
                ${p.link ? `<a href="${p.link}" target="_blank" onclick="event.stopPropagation()" class="asset-btn">Asset</a>` : '—'}
            </td>
            <td style="text-align:right; font-family:monospace;">${formatDate(p.date)}</td>
        </tr>
    `).join('');
}

function renderRoadmap(list) {
    const grid = document.getElementById('roadmapGrid');
    if (!grid) return;

    const backlog = [], thisWeek = [], nextWeek = [], future = [];
    const today = new Date(); 
    const currentWeekEnd = new Date(today); 
    currentWeekEnd.setDate(today.getDate() + (7 - today.getDay())); 
    const nextWeekEnd = new Date(currentWeekEnd); 
    nextWeekEnd.setDate(currentWeekEnd.getDate() + 7);
    
    list.forEach(p => {
        if (!p.date) { backlog.push(p); return; }
        const d = new Date(p.date);
        if (d <= currentWeekEnd) { thisWeek.push(p); } 
        else if (d <= nextWeekEnd) { nextWeek.push(p); } 
        else { future.push(p); }
    });
    
    const cols = [ 
        { title: "Backlog", list: backlog, cls: "col-backlog" }, 
        { title: "This Week", list: thisWeek, cls: "col-week" }, 
        { title: "Next Week", list: nextWeek, cls: "col-next" }, 
        { title: "Future", list: future, cls: "col-future" } 
    ];
    
    grid.innerHTML = cols.map(col => `
        <div class="roadmap-col ${col.cls}">
            <div class="col-header"><div class="col-title">${col.title}</div><div class="col-count">${col.list.length}</div></div>
            ${col.list.map(p => `
                <div class="road-card" onclick="edit('${p.id}')">
                    <div class="card-meta">${p.date ? formatDate(p.date) : 'No Date'}</div>
                    <div class="card-title">${esc(p.title)}</div>
                </div>
            `).join('') || '<div class="empty-zone">Empty</div>'}
        </div>
    `).join('');
}

function renderCal(list) {
    const grid = document.getElementById('calGrid');
    if (!grid) return;

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
    grid.innerHTML = html;
}

// --- 4. DATA ACTIONS ---
function openModal(dateStr = null) { 
    editId = null; 
    document.getElementById('inpTitle').value = ''; 
    document.getElementById('inpCaption').value = ''; 
    document.getElementById('inpDate').value = dateStr ? dateStr + 'T12:00' : '';
    
    const sel = document.getElementById('inpClient');
    sel.innerHTML = clients.map(c => `<option>${c}</option>`).join('');
    
    document.getElementById('editor').classList.add('active'); 
}

function edit(id) { 
    const p = posts.find(x => x.id === id); 
    if (!p) return; 
    editId = id; 
    document.getElementById('inpTitle').value = p.title; 
    document.getElementById('inpType').value = p.type || 'Standard'; 
    document.getElementById('inpCaption').value = p.caption || ''; 
    document.getElementById('inpDate').value = p.date || '';
    
    const sel = document.getElementById('inpClient');
    sel.innerHTML = clients.map(c => `<option>${c}</option>`).join('');
    sel.value = p.client;
    
    document.getElementById('editor').classList.add('active'); 
}

function saveData() { 
    const p = { 
        id: editId || 'post_' + Date.now(), 
        title: document.getElementById('inpTitle').value, 
        type: document.getElementById('inpType').value,
        caption: document.getElementById('inpCaption').value, 
        client: document.getElementById('inpClient').value, 
        date: document.getElementById('inpDate').value, 
        status: editId ? posts.find(x => x.id === editId).status : 'Draft' 
    }; 
    if (editId) posts[posts.findIndex(x => x.id === editId)] = p; 
    else posts.push(p); 
    closeModal(); persist(); toast('Saved'); 
}

function cycleStatus(e, id) { 
    e.stopPropagation(); 
    const idx = posts.findIndex(p => p.id === id); 
    const cycle = ['Draft', 'WIP', 'Ready', 'Posted', 'Draft']; 
    posts[idx].status = cycle[cycle.indexOf(posts[idx].status || 'Draft') + 1]; 
    persist(); 
}

// --- 5. STYLES & BADGES ---
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

function getStatusBadge(p) {
    const map = { 
        'Draft': { bg: 'var(--s-draft-bg)', fg: 'var(--s-draft-fg)' }, 
        'WIP': { bg: 'var(--s-wip-bg)', fg: 'var(--s-wip-fg)' }, 
        'Ready': { bg: 'var(--s-ready-bg)', fg: 'var(--s-ready-fg)' }, 
        'Posted': { bg: 'var(--s-posted-bg)', fg: 'var(--s-posted-fg)' } 
    };
    const s = map[p.status || 'Draft'];
    return `<div class="status-pill" style="background:${s.bg}; color:${s.fg};" onclick="cycleStatus(event, '${p.id}')">
        <div class="dot" style="background:${s.fg}"></div>${p.status || 'Draft'}</div>`;
}

// --- 6. HELPERS ---
function toggleSort() { sortDesc = !sortDesc; render(); }
function closeModal() { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active')); }
function esc(t) { return t ? t.replace(/</g, "&lt;") : ''; }
function formatDate(dateStr) { 
    if (!dateStr) return 'No Date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
}
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
function moveMonth(n) { cDate.setMonth(cDate.getMonth() + n); render(); }

window.onclick = (e) => { 
    if (!e.target.closest('.actions')) document.querySelectorAll('.popover').forEach(el => el.style.display = 'none'); 
};
