/* Pawly — istemci mantığı */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let token = localStorage.getItem('pawly_token') || '';
let me = null;
let pets = [];
let species = {};
let myStamps = [];
let allStamps = [];
let moods = [];
let currentChat = null;
let currentSpecies = 'blob';
let authMode = 'login';

const api = async (p, o = {}) => {
  const r = await fetch(p, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Bir şeyler ters gitti');
  return d;
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
function toast(m) {
  const t = $('#toast');
  t.textContent = m; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
}

function timeAgo(date) {
  if (!date) return '';
  const diffSec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diffSec < 60) return 'az önce';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} sa önce`;
  return `${Math.floor(diffSec / 86400)} gün önce`;
}

function spawnHeart(x, y, emoji = '💖') {
  const el = document.createElement('div');
  el.className = 'floating-heart';
  el.textContent = emoji;
  el.style.left = (x || (window.innerWidth / 2) + (Math.random() * 50 - 25)) + 'px';
  el.style.top = (y || (window.innerHeight / 2) + (Math.random() * 50 - 25)) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

let sseConnection = null;
function connectEvents() {
  if (!token) return;
  if (sseConnection) {
    try { sseConnection.close(); } catch {}
    sseConnection = null;
  }
  try {
    const sse = new EventSource('/api/events?token=' + encodeURIComponent(token));
    sse.addEventListener('ready', () => {
      console.log('🐾 Realtime Event Hub bağlı!');
    });
    sse.addEventListener('pet:action', (e) => {
      const data = JSON.parse(e.data);
      if (data.toast) toast(data.toast);
      if (data.pet) {
        const idx = pets.findIndex(p => p.id === data.petId);
        if (idx >= 0) pets[idx] = data.pet;
        if (!$('#screen-pets').classList.contains('hidden')) renderPets();
        if (!$('#screen-home').classList.contains('hidden')) renderPetWidget();
      }
    });
    sse.addEventListener('pet:tap', (e) => {
      const data = JSON.parse(e.data);
      spawnHeart(null, null, '💖');
      toast(`${data.actor.name} canavarı okşadı 🤗`);
      const petEl = $(`[data-id="${data.petId}"] .art`);
      if (petEl) {
        petEl.classList.add('squish-anim');
        setTimeout(() => petEl.classList.remove('squish-anim'), 400);
      }
    });
    sse.addEventListener('pet:created', (e) => {
      const data = JSON.parse(e.data);
      if (data.message) toast(data.message);
      loadPets();
    });
    sse.addEventListener('pet:updated', (e) => {
      const data = JSON.parse(e.data);
      if (data.toast) toast(data.toast);
      loadPets();
    });
    sseConnection = sse;
  } catch(err) {
    console.error('SSE bağlantı hatası:', err);
  }
}

/* ---------- ekranlar ---------- */
function show(name) {
  $$('.screen').forEach(s => s.classList.add('hidden'));
  $('#screen-' + name).classList.remove('hidden');
  $$('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'home') loadWidgets();
  if (name === 'pets') loadPets();
  if (name === 'friends') loadFriends();
  if (name === 'messages') loadConversations();
  if (name === 'profile') loadProfile();
}
$$('#tabbar button').forEach(b => b.onclick = () => show(b.dataset.screen));

/* ---------- auth ---------- */
function setAuthMode(m) {
  authMode = m;
  $('#tabLogin').classList.toggle('active', m === 'login');
  $('#tabRegister').classList.toggle('active', m === 'register');
  $('#authName').classList.toggle('hidden', m === 'login');
  $('#authErr').textContent = '';
}
$('#tabLogin').onclick = () => setAuthMode('login');
$('#tabRegister').onclick = () => setAuthMode('register');

$('#authSubmit').onclick = async () => {
  try {
    const body = {
      username: $('#authUser').value,
      password: $('#authPass').value,
      name: $('#authName').value
    };
    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const d = await api(url, { method: 'POST', body: JSON.stringify(body) });
    token = d.token; me = d.user;
    localStorage.setItem('pawly_token', token);
    $('#authModal').classList.add('hidden');
    boot();
    toast(`Hoş geldin ${me.name} 🐾`);
  } catch (e) { $('#authErr').textContent = e.message; }
};

if ($('#authGuest')) {
  $('#authGuest').onclick = async () => {
    try {
      const d = await api('/api/auth/guest', { method: 'POST' });
      token = d.token; me = d.user;
      localStorage.setItem('pawly_token', token);
      $('#authModal').classList.add('hidden');
      boot();
      toast(`Misafir olarak giriş yapıldı 🐾`);
    } catch (e) { $('#authErr').textContent = e.message; }
  };
}

/* ---------- ana yükleme ---------- */
async function boot() {
  $('#hiName').textContent = me.name;
  $('#whoami').textContent = '@' + me.username;
  connectEvents();
  show('home');
}

let currentRelationships = [];

/* ---------- bento widget panosu ---------- */
async function loadWidgets() {
  try {
    const [wd, pd, rd] = await Promise.all([
      api('/api/widgets'),
      api('/api/pets'),
      api('/api/pair/relationships').catch(() => ({ relationships: [] }))
    ]);
    moods = wd.moods;
    myStamps = wd.widget.stamps;
    allStamps = wd.widget.allStamps;
    pets = pd.pets;
    species = pd.species;
    currentRelationships = rd.relationships || [];

    renderBentoGrid(wd.widget, pets, currentRelationships);
  } catch (e) {
    console.error('Bento panosu yükleme hatası:', e);
  }
}

function daysLeft(date) {
  if (!date) return 0;
  return Math.ceil((new Date(date + 'T23:59:59') - Date.now()) / 86400000);
}

function renderBentoGrid(w, petList, relList) {
  const container = $('#bentoGrid');
  if (!container) return;

  const today = new Date().toISOString().slice(0, 10);
  const pet = petList && petList[0];
  const rel = relList && relList[0];
  const cd = (w.countdowns || [])[0];

  let petCardHtml = '';
  if (pet) {
    const face = !pet.hatched ? '🥚' : (pet.sleeping ? '💤' : speciesFace(pet));
    petCardHtml = `
      <div class="bento-card bento-span-2 bento-pet">
        <div class="bento-header">
          <span class="bento-label">🐾 Ortak Canavar</span>
          <span class="badge">Sv.${pet.level} · ${esc(pet.stageName)}</span>
        </div>
        <div class="bento-pet-content">
          <span class="bento-pet-avatar clickable-pet" data-home-tap="${pet.id}" title="Okşamak için tıkla!">${face}</span>
          <div class="bento-pet-info">
            <div class="bento-pet-name">${esc(pet.name)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin:2px 0 6px">
              Ruh Hali: <b>${esc(pet.mood)}</b> ${pet.relationship ? `· 🔥 ${pet.relationship.streakDays} Gün Seri` : ''}
            </div>
            <div class="bars" style="margin:4px 0 0">
              ${bar('Açlık', '🍽', pet.stats.food, '#3ddc97')}
              ${bar('Enerji', '⚡', pet.stats.energy, '#7c5cff')}
            </div>
          </div>
        </div>
        <div class="bento-pet-quickactions">
          <button data-quick-act="feed" data-id="${pet.id}">🍽 Besle</button>
          <button data-quick-act="pet" data-id="${pet.id}">🤗 Sev</button>
          <button data-screen-jump="pets">Canavarlarım →</button>
        </div>
      </div>
    `;
  } else {
    petCardHtml = `
      <div class="bento-card bento-span-2 bento-pet" style="text-align:center;justify-content:center">
        <div class="bento-header">
          <span class="bento-label">🐾 Canavar Yuvası</span>
        </div>
        <div style="font-size:42px;margin:6px 0">🥚</div>
        <div class="bento-pet-name" style="font-size:18px">Henüz canavarın yok</div>
        <p class="hint" style="margin:4px 0 10px">Arkadaşınla ortak bir yumurta çatlatıp büyütmeye başla!</p>
        <button class="btn btn-sm" style="align-self:center" data-screen-jump="pets">🥚 Yumurta Al</button>
      </div>
    `;
  }

  let streakCardHtml = '';
  if (rel) {
    const isCouple = rel.type === 'couple';
    streakCardHtml = `
      <div class="bento-card bento-span-1 bento-streak">
        <div class="bento-header">
          <span class="bento-label">💞 Dostluk Serisi</span>
          <span class="badge ${isCouple ? 'badge-couple' : 'badge-best_friend'}">${isCouple ? '❤️' : '⭐'}</span>
        </div>
        <div class="bento-streak-num">🔥 ${rel.streakDays}</div>
        <div class="bento-streak-partner"><b>${esc(rel.partner.name)}</b> ile</div>
        <button class="btn-miss-you" data-send-miss="${esc(rel.partner.username)}">Özledim ❤️</button>
      </div>
    `;
  } else {
    streakCardHtml = `
      <div class="bento-card bento-span-1 bento-streak" style="justify-content:center">
        <div class="bento-label" style="justify-content:center">🔗 Eşleşme</div>
        <div style="font-size:28px;margin:4px 0">🤝</div>
        <div style="font-size:11px;color:var(--text-muted)">Bir partner ile bağlan</div>
        <button class="btn ghost btn-sm" style="margin-top:8px" data-screen-jump="friends">Bağlan →</button>
      </div>
    `;
  }

  const moodCardHtml = `
    <div class="bento-card bento-span-1 bento-mood">
      <div class="bento-header">
        <span class="bento-label">✨ Ruh Halim</span>
        <span style="font-size:10px;color:var(--text-dim)">${w.moodDate === today ? 'Bugün' : 'Seçilmedi'}</span>
      </div>
      <div class="bento-mood-face">${w.moodDate === today ? w.mood : '🤔'}</div>
      <div class="bento-mood-row">
        ${moods.slice(0, 5).map(m => `
          <button class="bento-mood-btn ${w.mood === m && w.moodDate === today ? 'sel' : ''}" data-home-mood="${m}">${m}</button>
        `).join('')}
      </div>
    </div>
  `;

  const noteCardHtml = `
    <div class="bento-card bento-span-1 bento-note">
      <div class="bento-header">
        <span class="bento-label">📌 Hızlı Not</span>
        <button class="btn ghost btn-sm" style="min-height:28px;padding:2px 8px;font-size:11px" id="bentoNoteSave">Kaydet</button>
      </div>
      <textarea id="bentoNoteInput" placeholder="Aklından geçenler...">${esc(w.note || '')}</textarea>
    </div>
  `;

  const todosCardHtml = `
    <div class="bento-card bento-span-1 bento-todos">
      <div class="bento-header">
        <span class="bento-label">📝 Görevler</span>
        <span style="font-size:11px;color:var(--text-muted)">${(w.todos || []).filter(t => t.done).length}/${(w.todos || []).length}</span>
      </div>
      <div class="bento-todos-list">
        ${(w.todos || []).slice(0, 3).map(t => `
          <div class="bento-todo-item ${t.done ? 'done' : ''}">
            <button class="bento-todo-chk" data-todo-id="${t.id}">${t.done ? '✓' : ''}</button>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.text)}</span>
          </div>
        `).join('')}
        ${!(w.todos || []).length ? '<p class="hint" style="margin:4px 0">Görev yok ✨</p>' : ''}
      </div>
      <form id="bentoTodoForm" style="display:flex;gap:4px;margin-top:auto">
        <input id="bentoTodoInput" placeholder="Yeni görev..." maxlength="50" style="padding:6px 8px;font-size:11px">
        <button type="submit" class="btn btn-sm" style="min-height:30px;padding:2px 10px">+</button>
      </form>
    </div>
  `;

  const countdownCardHtml = `
    <div class="bento-card bento-span-1 bento-countdown">
      <div class="bento-header">
        <span class="bento-label">⏰ Geri Sayım</span>
      </div>
      <div class="bento-countdown-val">${cd ? daysLeft(cd.date) : '—'}</div>
      <div class="bento-countdown-lbl">${cd ? esc(cd.title) : 'Özel gün ekle'}</div>
      <div style="font-size:10px;color:var(--text-dim);margin-top:4px">${cd ? 'gün kaldı' : '—'}</div>
    </div>
  `;

  const stampsCardHtml = `
    <div class="bento-card bento-span-2 bento-stamps">
      <div class="bento-header">
        <span class="bento-label">🛂 Pasaport Damgalarım</span>
        <span style="font-size:11px;color:var(--text-muted)">${(myStamps || []).length}/${(allStamps || []).length} Şehir</span>
      </div>
      <div class="bento-stamps-rail">
        ${(allStamps || []).map(s => {
          const got = (myStamps || []).some(x => x.id === s.id);
          return `
            <div class="bento-stamp-badge ${got ? 'got' : ''}" data-stamp-id="${s.id}" title="${s.label} (${got ? 'Kazanıldı' : 'Tıkla damgala!'})">
              <span class="flag">${s.flag}</span>
              <span style="font-size:9px;margin-top:2px">${esc(s.label)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.innerHTML = `
    ${petCardHtml}
    ${streakCardHtml}
    ${moodCardHtml}
    ${noteCardHtml}
    ${todosCardHtml}
    ${countdownCardHtml}
    ${stampsCardHtml}
  `;

  // --- Olay Dinleyicileri ---
  // Pano Yenileme
  if ($('#btnRefreshBoard')) {
    $('#btnRefreshBoard').onclick = () => {
      loadWidgets();
      toast('Pano güncellendi 🔄');
    };
  }

  // Canavar hızlı bakım butonları
  $$('#bentoGrid [data-quick-act]').forEach(b => {
    b.onclick = async () => {
      await petAction(b.dataset.id, b.dataset.quickAct);
      loadWidgets();
    };
  });

  // Canavar dokunma / sevme
  $$('#bentoGrid [data-home-tap]').forEach(el => {
    el.onclick = async () => {
      const rect = el.getBoundingClientRect();
      spawnHeart(rect.left + rect.width / 2, rect.top, '💖');
      el.classList.add('squish-anim');
      setTimeout(() => el.classList.remove('squish-anim'), 350);
      try {
        await api(`/api/pets/${el.dataset.homeTap}/tap`, { method: 'POST' });
      } catch {}
    };
  });

  // Özledim butonu
  $$('#bentoGrid [data-send-miss]').forEach(b => {
    b.onclick = async () => {
      const rect = b.getBoundingClientRect();
      spawnHeart(rect.left + rect.width / 2, rect.top - 10, '❤️');
      toast(`${b.dataset.sendMiss} kullanıcısına özlemini fırlattın! ❤️`);
      try {
        await api('/api/messages/' + b.dataset.sendMiss, {
          method: 'POST',
          body: JSON.stringify({ text: 'Seni çok özledim! ❤️', kind: 'text' })
        });
      } catch {}
    };
  });

  // Ruh hali butonu
  $$('#bentoGrid [data-home-mood]').forEach(b => {
    b.onclick = async () => {
      try {
        const d = await api('/api/widgets/mood', { method: 'POST', body: JSON.stringify({ mood: b.dataset.homeMood }) });
        toast('Ruh halin kaydedildi ' + d.mood);
        loadWidgets();
      } catch(err) { toast(err.message); }
    };
  });

  // Not kaydetme
  if ($('#bentoNoteSave')) {
    $('#bentoNoteSave').onclick = async () => {
      try {
        await api('/api/widgets/note', { method: 'PUT', body: JSON.stringify({ note: $('#bentoNoteInput').value }) });
        toast('Notun kaydedildi 📌');
      } catch(err) { toast(err.message); }
    };
  }

  // Görev ekleme & tikleme
  if ($('#bentoTodoForm')) {
    $('#bentoTodoForm').onsubmit = async (e) => {
      e.preventDefault();
      const val = $('#bentoTodoInput').value.trim();
      if (!val) return;
      try {
        await api('/api/widgets/todos', { method: 'POST', body: JSON.stringify({ text: val }) });
        $('#bentoTodoInput').value = '';
        loadWidgets();
      } catch(err) { toast(err.message); }
    };
  }
  $$('#bentoGrid [data-todo-id]').forEach(b => {
    b.onclick = async () => {
      try {
        await api('/api/widgets/todos/' + b.dataset.todoId, { method: 'PUT' });
        loadWidgets();
      } catch(err) { toast(err.message); }
    };
  });

  // Damga tıklama
  $$('#bentoGrid [data-stamp-id]').forEach(b => {
    b.onclick = async () => {
      try {
        await api('/api/widgets/stamps', { method: 'POST', body: JSON.stringify({ id: b.dataset.stampId }) });
        toast('Damga pasaporta basıldı! 🛂');
        loadWidgets();
      } catch(err) { toast(err.message); }
    };
  });

  // Sekmeler arası hızlı geçiş
  $$('#bentoGrid [data-screen-jump]').forEach(b => {
    b.onclick = () => show(b.dataset.screenJump);
  });
}

function speciesFace(p) {
  const map = { blob: '🫧', dino: '🦖', bunny: '🐰', ghost: '👻', bear: '🐻', cat: '🐱' };
  return map[p.species] || '🐾';
}

function renderPetWidget() {
  if ($('#screen-home').classList.contains('hidden')) return;
  loadWidgets();
}

/* ---------- todos ---------- */
function renderTodos(todos) {
  if (!$('#todoList')) return;
  $('#todoList').innerHTML = todos.length ? todos.map(t => `
    <li class="${t.done ? 'done' : ''}">
      <button class="chk" data-id="${t.id}">${t.done ? '✓' : ''}</button>
      <span>${esc(t.text)}</span>
      <button data-del="${t.id}">✕</button>
    </li>`).join('') : '<li style="background:none;color:var(--dim)">Henüz görev yok</li>';

  $$('#todoList .chk').forEach(b => b.onclick = async () => {
    await api('/api/widgets/todos/' + b.dataset.id, { method: 'PUT' });
    loadWidgets();
  });
  $$('#todoList [data-del]').forEach(b => b.onclick = async () => {
    await api('/api/widgets/todos/' + b.dataset.del, { method: 'DELETE' });
    loadWidgets();
  });
}
if ($('#todoForm')) {
  $('#todoForm').onsubmit = async e => {
    e.preventDefault();
    const v = $('#todoInput').value.trim();
    if (!v) return;
    try { await api('/api/widgets/todos', { method: 'POST', body: JSON.stringify({ text: v }) }); $('#todoInput').value = ''; loadWidgets(); }
    catch (err) { toast(err.message); }
  };
}
if ($('#noteSave')) {
  $('#noteSave').onclick = async () => {
    await api('/api/widgets/note', { method: 'PUT', body: JSON.stringify({ note: $('#noteInput').value }) });
    toast('Not kaydedildi 📝');
  };
}

/* ---------- geri sayım ---------- */
function renderCountdowns(list) {
  if (!$('#cdList')) return;
  $('#cdList').innerHTML = list.length ? list.map(c => `
    <div class="cd-item"><b>${esc(c.title)}</b><span class="hint">${esc(c.date)}</span>
      <span class="days">${daysLeft(c.date)} gün</span>
      <button data-del="${c.id}">✕</button></div>`).join('') : '<p class="hint">Henüz geri sayım yok</p>';
  $$('#cdList [data-del]').forEach(b => b.onclick = async () => {
    await api('/api/widgets/countdowns/' + b.dataset.del, { method: 'DELETE' });
    loadWidgets();
  });
}
if ($('#cdForm')) {
  $('#cdForm').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/api/widgets/countdowns', { method: 'POST', body: JSON.stringify({ title: $('#cdTitle').value, date: $('#cdDate').value }) });
      $('#cdTitle').value = ''; $('#cdDate').value = ''; loadWidgets();
    } catch (err) { toast(err.message); }
  };
}

/* ---------- damgalar ---------- */
function renderStamps() {
  if (!$('#stampGrid')) return;
  $('#stampGrid').innerHTML = allStamps.map(s => {
    const got = myStamps.some(x => x.id === s.id);
    return `<div class="stamp ${got ? 'got' : ''}" data-id="${s.id}"><span class="fl">${s.flag}</span>${esc(s.label)}</div>`;
  }).join('');
  $$('#stampGrid .stamp').forEach(el => el.onclick = async () => {
    try { const d = await api('/api/widgets/stamps', { method: 'POST', body: JSON.stringify({ id: el.dataset.id }) }); myStamps = d.stamps; toast('Damga alındı! 🛂'); renderStamps(); }
    catch (e) { toast(e.message); }
  });
}

/* ---------- canavarlar ---------- */
async function loadPets() {
  const d = await api('/api/pets');
  pets = d.pets; species = d.species;
  renderSpeciesRow();
  renderPets();
}
function renderSpeciesRow() {
  $('#speciesRow').innerHTML = Object.entries(species).map(([k, v]) =>
    `<button data-sp="${k}" class="${k === currentSpecies ? 'sel' : ''}">${speciesIcon(k)}</button>`).join('');
  $$('#speciesRow button').forEach(b => b.onclick = () => { currentSpecies = b.dataset.sp; renderSpeciesRow(); });
}
function speciesIcon(k) { return { blob: '🫧', dino: '🦕', bunny: '🐰', ghost: '👻', bear: '🐻', cat: '🐱' }[k] || '🐾'; }

function bar(label, icon, val, color) {
  return `<div class="bar"><span class="lbl">${icon}</span>
    <div class="track"><div class="fill" style="width:${Math.round(val)}%;background:${color}"></div></div>
    <span>${Math.round(val)}</span></div>`;
}

function renderPets() {
  if (!pets.length) {
    $('#petList').innerHTML = '<div class="panel"><p class="hint">Henüz canavarın yok. Aşağıdan bir yumurta al!</p></div>';
    return;
  }
  $('#petList').innerHTML = pets.map(p => {
    const others = p.owners.filter(o => o.username !== me.username);
    const face = !p.hatched ? '🥚' : (p.sleeping ? '💤' : speciesFace(p));
    const cds = p.remainingCooldowns || {};

    return `<div class="pet ${p.sleeping ? 'sleeping' : ''}" data-id="${p.id}">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
        <span class="badge">Sv.${p.level} · ${esc(p.stageName)}</span>
        ${p.relationship ? `<span class="badge badge-streak">🔥 ${p.relationship.streakDays} Gün Seri</span>` : ''}
      </div>

      <!-- EVRİM İLERLEME ÇUBUĞU -->
      <div class="stage-meter" title="Evrim: %${p.stageProgress}">
        <div class="stage-meter-fill" style="width:${p.stageProgress}%"></div>
      </div>

      ${p.poopList ? p.poopList.slice(0, 3).map((_, i) => `<span class="poop p${i + 1}">💩</span>`).join('') : ''}
      <span class="art clickable-pet" data-tap="${p.id}" title="Sevmek ve okşamak için tıkla!">${face}</span>
      <h2>${esc(p.name)}</h2>
      <p class="sub">${p.hatched ? 'Ruh Hali: ' + esc(p.mood) : 'Henüz çatlamadı'}
        ${others.length ? ' · 👥 ' + others.map(o => esc(o.name)).join(', ') + ' ile' : ''}</p>

      ${p.hatched ? `
      <div class="bars">
        ${bar('Açlık', '🍽', p.stats.food, '#3ddc97')}
        ${bar('Su', '💧', p.stats.water, '#4cc9f0')}
        ${bar('Temizlik', '🫧', p.stats.clean, '#ffc93c')}
        ${bar('Enerji', '⚡', p.stats.energy, '#7c5cff')}
        ${bar('Mutluluk', '💖', p.stats.happy, '#ff7aa2')}
      </div>
      <div class="actions">
        <button data-act="feed" data-id="${p.id}" ${cds.feed ? 'disabled' : ''}>🍽 Besle ${cds.feed ? `(${cds.feed}s)` : ''}</button>
        <button data-act="water" data-id="${p.id}" ${cds.water ? 'disabled' : ''}>💧 Su ver ${cds.water ? `(${cds.water}s)` : ''}</button>
        <button data-act="clean" data-id="${p.id}" ${cds.clean ? 'disabled' : ''}>🫧 Yıka ${cds.clean ? `(${cds.clean}s)` : ''}</button>
        <button data-act="play" data-id="${p.id}" ${cds.play ? 'disabled' : ''}>🎾 Oyna ${cds.play ? `(${cds.play}s)` : ''}</button>
        <button data-act="pet" data-id="${p.id}" ${cds.pet ? 'disabled' : ''}>🤗 Sev ${cds.pet ? `(${cds.pet}s)` : ''}</button>
        <button data-act="sleep" data-id="${p.id}">${p.sleeping ? '☀️ Uyandır' : '💤 Uyut'}</button>
        ${p.poops > 0 ? `<button data-act="poop" data-id="${p.id}">💩 Temizle (${p.poops})</button>` : ''}
        ${p.isOwner ? `<button data-act="del" data-id="${p.id}" title="Sil">🗑</button>` : ''}
      </div>

      <!-- WIDGETABLE SON HAREKETLER (ACTION LOG) -->
      <div class="pet-logs">
        <div class="pet-logs-title">📜 Son Hareketler</div>
        ${(p.logs && p.logs.length) ? p.logs.slice(0, 4).map(l => `
          <div class="pet-log-row">
            <span class="actor-dot" style="background:${l.actor ? l.actor.color : '#ff7aa2'}"></span>
            <span class="log-txt">${esc(l.label)}</span>
            <span class="log-time">${timeAgo(l.at)}</span>
          </div>
        `).join('') : '<p class="hint" style="margin:2px 0">Henüz hareket yok. Bir çilek ver!</p>'}
      </div>
      ` : `
      <p class="hint">Yumurtayı çatlatmak için ${p.hatchNeeded > 1 ? 'tüm sahiplerin' : 'senin'} tıklaması gerekiyor
        (${p.hatchProgress}/${p.hatchNeeded})</p>
      <button class="btn hatch-btn" data-act="hatch" data-id="${p.id}">🔥 Tıkla ve çatlat!</button>`}
    </div>`;
  }).join('');

  $$('#petList [data-act]').forEach(b => b.onclick = () => petAction(b.dataset.id, b.dataset.act));

  // Canlı dokunma / sevme dürtmesi
  $$('#petList [data-tap]').forEach(el => el.onclick = async (e) => {
    const rect = el.getBoundingClientRect();
    spawnHeart(rect.left + rect.width / 2, rect.top, '💖');
    el.classList.add('squish-anim');
    setTimeout(() => el.classList.remove('squish-anim'), 350);
    try {
      await api(`/api/pets/${el.dataset.tap}/tap`, { method: 'POST' });
    } catch {}
  });
}

async function petAction(id, act) {
  if (act === 'del') {
    if (!confirm('Bu canavar silinsin mi?')) return;
    try { const d = await api('/api/pets/' + id, { method: 'DELETE' }); pets = d.pets; renderPets(); toast('Silindi'); } catch (e) { toast(e.message); }
    return;
  }
  const url = act === 'hatch' ? `/api/pets/${id}/hatch`
    : act === 'poop' ? `/api/pets/${id}/clean-poop`
    : act === 'sleep' ? `/api/pets/${id}/sleep`
    : `/api/pets/${id}/care`;
  try {
    const d = await api(url, { method: 'POST', body: JSON.stringify({ action: act }) });
    pets = d.pets;
    renderPets();
    if (d.toast) toast(d.toast);
  } catch (e) { toast(e.message); }
}

$('#createPet').onclick = async () => {
  try {
    const d = await api('/api/pets', {
      method: 'POST',
      body: JSON.stringify({ name: $('#petName').value, species: currentSpecies, withUser: $('#petWith').value.trim() || null })
    });
    pets = d.pets;
    $('#petName').value = ''; $('#petWith').value = '';
    renderPets();
    toast('🥚 Yumurta hazır!');
  } catch (e) { toast(e.message); }
};

/* ---------- arkadaşlar & eşleşme (pairing) ---------- */
async function loadFriends() {
  // Eşleşme kodu ve ilişkiler
  try {
    const pc = await api('/api/pair/my-code');
    if ($('#myPairCode')) $('#myPairCode').textContent = pc.pairCode;
  } catch {}

  try {
    const rd = await api('/api/pair/relationships');
    renderRelationships(rd.relationships || []);
  } catch {}

  const d = await api('/api/friends');
  renderIncoming(d.incoming);
  renderFriends(d.friends);
}

function renderRelationships(list) {
  const container = $('#relationshipList');
  if (!container) return;
  if (!list || !list.length) {
    container.innerHTML = '<p class="hint">Henüz aktif bir eşleşmen yok. Yukarıdaki kodunu arkadaşınla paylaş!</p>';
    return;
  }

  const typeLabels = {
    couple: { text: '❤️ Sevgili (Couple)', cls: 'badge-couple' },
    best_friend: { text: '⭐ Kanka (Best Friend)', cls: 'badge-best_friend' },
    friend: { text: '🐾 Dost (Friend)', cls: 'badge-friend' }
  };

  container.innerHTML = list.map(r => {
    const p = r.partner;
    const typeInfo = typeLabels[r.type] || typeLabels.best_friend;
    return `
      <div class="rel-item">
        ${avatarEl(p)}
        <div style="flex:1">
          <div style="font-weight:700">${esc(p.name)} <span class="un">@${esc(p.username)}</span></div>
          <div>
            <span class="badge ${typeInfo.cls}">${typeInfo.text}</span>
            <span class="badge badge-streak">🔥 ${r.streakDays} Gün</span>
          </div>
          ${r.sharedPet ? `<div class="st" style="margin-top:4px">🐾 Ortak Canavar: <b>${esc(r.sharedPet.name)}</b></div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button class="btn" style="padding:6px 10px;font-size:12px" data-chat="${esc(p.username)}">💬 Mesaj</button>
          <button class="btn ghost" style="padding:6px 10px;font-size:11px;color:#ff8fa3" data-delrel="${r.id}">Bağı Bitir</button>
        </div>
      </div>
    `;
  }).join('');

  $$('#relationshipList [data-chat]').forEach(b => b.onclick = () => { show('messages'); openChat(b.dataset.chat); });
  $$('#relationshipList [data-delrel]').forEach(b => b.onclick = async () => {
    if (!confirm('Bu eşleşmeyi sonlandırmak istediğinizden emin misiniz?')) return;
    try {
      await api('/api/pair/relationship/' + b.dataset.delrel, { method: 'DELETE' });
      toast('Eşleşme sonlandırıldı');
      loadFriends();
    } catch(err) { toast(err.message); }
  });
}

// Kod kopyalama ve bağlama butonları
if ($('#btnCopyCode')) {
  $('#btnCopyCode').onclick = async () => {
    try {
      const code = $('#myPairCode').textContent.trim();
      await navigator.clipboard.writeText(code);
      toast('Eşleşme kodu kopyalandı! 📋');
    } catch {
      toast('Kod: ' + $('#myPairCode').textContent);
    }
  };
}

if ($('#btnRegenCode')) {
  $('#btnRegenCode').onclick = async () => {
    if (!confirm('Yeni bir eşleşme kodu üretilsin mi? (Eski kod geçersiz kalacaktır)')) return;
    try {
      const d = await api('/api/pair/regenerate-code', { method: 'POST' });
      $('#myPairCode').textContent = d.pairCode;
      toast('Yeni eşleşme kodu oluşturuldu 🔄');
    } catch(err) { toast(err.message); }
  };
}

if ($('#pairConnectForm')) {
  $('#pairConnectForm').onsubmit = async (e) => {
    e.preventDefault();
    const code = $('#inputPairCode').value.trim();
    const type = $('#selectPairType').value;
    if (!code) return toast('Lütfen 6 haneli kodu girin');
    try {
      const d = await api('/api/pair/connect', {
        method: 'POST',
        body: JSON.stringify({ code, type })
      });
      toast(d.message || 'Eşleşme başarılı! 🎉');
      $('#inputPairCode').value = '';
      loadFriends();
    } catch(err) { toast(err.message); }
  };
}
function avatarEl(u, txt) {
  return `<div class="av" style="background:${u.color}">${esc(txt || u.name[0].toUpperCase())}</div>`;
}
function renderFriends(list) {
  $('#friendList').innerHTML = list.length ? list.map(f => `
    <div class="li">${avatarEl(f.user)}
      <div><div class="nm">${esc(f.user.name)}</div><div class="un">@${esc(f.user.username)}</div>
      ${f.pet ? `<div class="st">🐾 ${esc(f.pet.name)} — ${esc(f.pet.mood)}</div>` : ''}</div>
      <div class="push"><button data-chat="${esc(f.user.username)}">💬</button></div>
    </div>`).join('') : '<p class="hint">Henüz arkadaşın yok. Yukarıdan ara!</p>';
  $$('#friendList [data-chat]').forEach(b => b.onclick = () => { show('messages'); openChat(b.dataset.chat); });
}
function renderIncoming(list) {
  $('#incomingList').innerHTML = list.length ? list.map(r => `
    <div class="li">${avatarEl(r.fromInfo)}
      <div><div class="nm">${esc(r.fromInfo.name)}</div><div class="un">@${esc(r.fromInfo.username)}</div></div>
      <div class="push">
        <button class="ok" data-acc="${r.id}">Kabul</button>
        <button data-rej="${r.id}">Reddet</button>
      </div></div>`).join('') : '<p class="hint">Bekleyen istek yok</p>';
  $$('#incomingList [data-acc]').forEach(b => b.onclick = async () => {
    await api('/api/friends/respond', { method: 'POST', body: JSON.stringify({ requestId: b.dataset.acc, accept: true }) });
    toast('Artık arkadaşsınız 💞'); loadFriends();
  });
  $$('#incomingList [data-rej]').forEach(b => b.onclick = async () => {
    await api('/api/friends/respond', { method: 'POST', body: JSON.stringify({ requestId: b.dataset.rej, accept: false }) });
    loadFriends();
  });
}
let searchTimer;
$('#searchInput').oninput = e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) { $('#searchResults').innerHTML = ''; return; }
  searchTimer = setTimeout(async () => {
    const d = await api('/api/friends/search?q=' + encodeURIComponent(q));
    $('#searchResults').innerHTML = d.users.length ? d.users.map(u => `
      <div class="li">${avatarEl(u)}
        <div><div class="nm">${esc(u.name)}</div><div class="un">@${esc(u.username)}</div></div>
        <div class="push">${u.status === 'none' ? `<button class="ok" data-add="${esc(u.username)}">➕ Ekle</button>`
          : u.status === 'sent' ? '<button disabled>📨 Gönderildi</button>' : '<button disabled>✓ Arkadaş</button>'}</div>
      </div>`).join('') : '<p class="hint">Sonuç yok</p>';
    $$('#searchResults [data-add]').forEach(b => b.onclick = async () => {
      try { await api('/api/friends/request', { method: 'POST', body: JSON.stringify({ username: b.dataset.add }) }); toast('İstek gönderildi 💌'); b.textContent = '📨 Gönderildi'; }
      catch (err) { toast(err.message); }
    });
  }, 280);
};

/* ---------- mesajlar ---------- */
let stickers = [];
async function loadConversations() {
  const d = await api('/api/messages/conversations');
  stickers = d.stickers;
  renderStickerTray();
  $('#convoList').innerHTML = d.conversations.length ? d.conversations.map(c => `
    <div class="convo" data-u="${esc(c.user.username)}">${avatarEl(c.user)}
      <div style="flex:1;min-width:0"><div class="nm">${esc(c.user.name)}</div>
        <div class="last">${c.lastMessage.kind === 'sticker' ? '😊 sticker' : esc(c.lastMessage.text)}</div></div>
      ${c.unread ? `<span class="cnt">${c.unread}</span>` : ''}
    </div>`).join('') : '<p class="hint">Henüz sohbet yok. Arkadaş ekleyip yaz!</p>';
  $$('#convoList .convo').forEach(el => el.onclick = () => openChat(el.dataset.u));
}

async function openChat(username) {
  currentChat = username;
  $('#chatFoot').classList.remove('hidden');
  $('#stickerTray').classList.add('hidden');
  const d = await api('/api/messages/' + username);
  $('#chatHead').textContent = '@' + username;
  renderMessages(d.messages);
}
function renderMessages(msgs) {
  const body = $('#chatBody');
  body.innerHTML = msgs.length ? '' : '<p class="hint">İlk mesajı sen yaz 💌</p>';
  msgs.forEach(m => {
    const el = document.createElement('div');
    el.className = 'bubble ' + (m.mine ? 'mine' : 'theirs') + (m.kind === 'sticker' ? ' sticker' : '');
    if (m.kind === 'doodle') {
      el.innerHTML = `<img data-doodle="${m.text}">`;
      loadDoodle(m.text, el);
    } else {
      el.textContent = m.text;
    }
    const t = document.createElement('span');
    t.className = 'time';
    t.textContent = new Date(m.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    el.appendChild(t);
    body.appendChild(el);
  });
  body.scrollTop = body.scrollHeight;
}
async function loadDoodle(id, el) {
  try {
    const d = await api('/api/messages/doodle/' + id);
    const img = el.querySelector('img');
    if (img) img.src = d.doodle.data;
  } catch { el.textContent = '🎨 çizim yüklenemedi'; }
}

$('#btnSend').onclick = sendMsg;
$('#msgInput').onkeydown = e => { if (e.key === 'Enter') sendMsg(); };
async function sendMsg() {
  const v = $('#msgInput').value.trim();
  if (!v || !currentChat) return;
  try {
    $('#msgInput').value = '';
    const d = await api('/api/messages/' + currentChat, { method: 'POST', body: JSON.stringify({ text: v, kind: 'text' }) });
    const body = $('#chatBody');
    if (body.querySelector('.hint')) body.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'bubble mine';
    el.textContent = v;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  } catch (e) { toast(e.message); }
}
function renderStickerTray() {
  $('#stickerTray').innerHTML = stickers.map(s => `<button data-s="${s}">${s}</button>`).join('');
  $$('#stickerTray button').forEach(b => b.onclick = async () => {
    if (!currentChat) return;
    try {
      await api('/api/messages/' + currentChat, { method: 'POST', body: JSON.stringify({ text: b.dataset.s, kind: 'sticker' }) });
      $('#stickerTray').classList.add('hidden');
      const el = document.createElement('div');
      el.className = 'bubble mine sticker'; el.textContent = b.dataset.s;
      $('#chatBody').appendChild(el); $('#chatBody').scrollTop = 1e9;
    } catch (e) { toast(e.message); }
  });
}
$('#btnSticker').onclick = () => $('#stickerTray').classList.toggle('hidden');

/* ---------- çizim ---------- */
const canvas = $('#canvas'), ctx = canvas.getContext('2d');
let drawing = false, color = '#ff7aa2', last = null;
const COLORS = ['#111', '#ff7aa2', '#ff9d6e', '#ffc93c', '#3ddc97', '#4cc9f0', '#7c5cff', '#fff'];
$('#colorRow').innerHTML = COLORS.map(c => `<button data-c="${c}" style="background:${c}" class="${c === color ? 'sel' : ''}"></button>`).join('');
$$('#colorRow button').forEach(b => b.onclick = () => {
  color = b.dataset.c;
  $$('#colorRow button').forEach(x => x.classList.toggle('sel', x === b));
});
function pos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: (p.clientX - r.left) * (canvas.width / r.width), y: (p.clientY - r.top) * (canvas.height / r.height) };
}
function start(e) { drawing = true; last = pos(e); e.preventDefault(); }
function move(e) {
  if (!drawing) return;
  const p = pos(e);
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  last = p; e.preventDefault();
}
function end() { drawing = false; }
['mousedown', 'touchstart'].forEach(ev => canvas.addEventListener(ev, start, { passive: false }));
['mousemove', 'touchmove'].forEach(ev => canvas.addEventListener(ev, move, { passive: false }));
['mouseup', 'mouseleave', 'touchend'].forEach(ev => canvas.addEventListener(ev, end));

$('#btnDoodle').onclick = () => { if (!currentChat) return toast('Önce sohbet seç'); ctx.clearRect(0, 0, canvas.width, canvas.height); $('#doodleModal').classList.remove('hidden'); };
$('#doodleCancel').onclick = () => $('#doodleModal').classList.add('hidden');
$('#doodleClear').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
$('#doodleSend').onclick = async () => {
  try {
    const data = canvas.toDataURL('image/png');
    await api('/api/messages/' + currentChat, { method: 'POST', body: JSON.stringify({ text: data, kind: 'doodle' }) });
    const el = document.createElement('div');
    el.className = 'bubble mine';
    el.innerHTML = `<img src="${data}">`;
    $('#chatBody').appendChild(el); $('#chatBody').scrollTop = 1e9;
    $('#doodleModal').classList.add('hidden');
    toast('Çizim gönderildi 🎨');
  } catch (e) { toast(e.message); }
};

/* ---------- profil ---------- */
async function loadProfile() {
  const pd = await api('/api/pets');
  const wd = await api('/api/widgets');
  $('#profilePanel').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
      <div class="av" style="width:60px;height:60px;font-size:24px;background:${me.color}">${esc(me.name[0].toUpperCase())}</div>
      <div><div style="font-size:20px;font-weight:800">${esc(me.name)}</div>
      <div class="hint">@${esc(me.username)}</div></div>
    </div>
    <div class="row" style="margin-bottom:14px">
      <input id="pfName" value="${esc(me.name)}" maxlength="30">
      <button class="btn" id="pfSave">Kaydet</button>
    </div>
    <p class="hint">🎨 Rengin: <input type="color" id="pfColor" value="${me.color}" style="width:44px;height:34px;padding:2px;vertical-align:middle"></p>
    <div style="display:flex;gap:10px;margin:16px 0">
      <div class="widget" style="flex:1"><div class="w-label">Canavar</div><div class="w-value">${pd.pets.length}</div></div>
      <div class="widget" style="flex:1"><div class="w-label">Damga</div><div class="w-value">${wd.widget.stamps.length}</div></div>
      <div class="widget" style="flex:1"><div class="w-label">Görev</div><div class="w-value">${wd.widget.todos.length}</div></div>
    </div>
    ${me.isGuest ? `
      <div class="guest-banner">
        <div style="font-weight:700;color:var(--warn)">⚠️ Misafir Hesabı</div>
        <p class="hint" style="margin:0">Verilerini kaybetmemek için hesabına bir kullanıcı adı ve şifre belirle:</p>
        <input id="cvUser" placeholder="Kullanıcı adı (min 3 harf)" maxlength="24">
        <input id="cvName" value="${esc(me.name)}" placeholder="İsim" maxlength="30">
        <input id="cvPass" type="password" placeholder="Şifre belirle (min 4 karakter)">
        <button class="btn" id="cvSubmit">Hesabımı Kalıcı Yap 🔒</button>
      </div>
    ` : ''}
    <button class="btn danger wide" id="logout">Çıkış yap</button>`;

  if ($('#cvSubmit')) {
    $('#cvSubmit').onclick = async () => {
      try {
        const d = await api('/api/auth/convert-guest', {
          method: 'POST',
          body: JSON.stringify({
            username: $('#cvUser').value,
            name: $('#cvName').value,
            password: $('#cvPass').value
          })
        });
        token = d.token; me = d.user;
        localStorage.setItem('pawly_token', token);
        toast('Hesabın başarıyla kalıcı hale getirildi! 🎉');
        boot();
        loadProfile();
      } catch(err) { toast(err.message); }
    };
  }

  $('#pfSave').onclick = async () => {
    const d = await api('/api/auth/me', { method: 'PUT', body: JSON.stringify({ name: $('#pfName').value, color: $('#pfColor').value }) });
    me = d.user; toast('Profil güncellendi'); loadProfile();
  };
  $('#pfColor').onchange = async () => {
    const d = await api('/api/auth/me', { method: 'PUT', body: JSON.stringify({ color: $('#pfColor').value }) });
    me = d.user;
  };
  $('#logout').onclick = () => {
    localStorage.removeItem('pawly_token'); token = ''; me = null;
    $('#authModal').classList.remove('hidden');
  };
}

/* ---------- başlat ---------- */
(async () => {
  if (token) {
    try { const d = await api('/api/auth/me'); me = d.user; $('#authModal').classList.add('hidden'); boot(); return; }
    catch { token = ''; localStorage.removeItem('pawly_token'); }
  }
  $('#authModal').classList.remove('hidden');
})();

// canavarların açlığı zamanla düşsün diye 60 sn'de bir yenile
setInterval(() => { if (me && !$('#screen-pets').classList.contains('hidden')) loadPets(); }, 60000);
