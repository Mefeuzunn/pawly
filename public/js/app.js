/* ==========================================================================
   Pawly — Widgetable Tarzı Sosyal Widget'lar ve Evcil Hayvan İstemci Motoru
   ========================================================================== */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Uygulama Durumu
let token = localStorage.getItem('pawly_token') || '';
let me = null;
let pets = [];
let species = {};
let activePet = null;
let currentRoom = 'living';
let currentSimMode = 'lock';
let myRelationship = null;
let partnerUser = null;
let currentHat = localStorage.getItem('pawly_pet_hat') || '';
let currentClothes = localStorage.getItem('pawly_pet_clothes') || '';
let sseConnection = null;
let toastTimer = null;

// API Yardımcısı
const api = async (p, o = {}) => {
  const r = await fetch(p, {
    ...o,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    }
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Bir hata oluştu');
  return d;
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>✨</span> <span>${m}</span>`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
}

function spawnHeart(x, y, emoji = '💖') {
  const el = document.createElement('div');
  el.className = 'floating-heart';
  el.textContent = emoji;
  const startX = x || (window.innerWidth / 2 + (Math.random() * 60 - 30));
  const startY = y || (window.innerHeight / 2 + (Math.random() * 60 - 30));
  el.style.left = `${startX}px`;
  el.style.top = `${startY}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function timeAgo(date) {
  if (!date) return '';
  const diffSec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diffSec < 60) return 'az önce';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} sa önce`;
  return `${Math.floor(diffSec / 86400)} gün önce`;
}

// ==========================================================================
// REALTIME SSE ETKİNLİK MOTORU
// ==========================================================================
function connectEvents() {
  if (!token) return;
  if (sseConnection) {
    try { sseConnection.close(); } catch {}
    sseConnection = null;
  }
  try {
    const sse = new EventSource('/api/events?token=' + encodeURIComponent(token));
    sse.addEventListener('ready', () => {
      console.log('🐾 Pawly Realtime Hub bağlı!');
    });

    sse.addEventListener('widget:miss_you', (e) => {
      const data = JSON.parse(e.data);
      spawnHeart(null, null, '❤️');
      toast(data.toast || 'Partnerin seni çok özledi! ❤️');
      loadHomeBento();
    });

    sse.addEventListener('widget:distance', (e) => {
      const data = JSON.parse(e.data);
      toast(`Partnerin konumunu güncelledi: ${data.location?.name || ''}`);
      loadHomeBento();
    });

    sse.addEventListener('widget:jar', (e) => {
      const data = JSON.parse(e.data);
      toast(data.toast || 'Kavanoza yeni bir duygu şekeri eklendi! 🍬');
      loadHomeBento();
    });

    sse.addEventListener('pet:action', (e) => {
      const data = JSON.parse(e.data);
      if (data.toast) toast(data.toast);
      loadPets();
      loadHomeBento();
    });

    sse.addEventListener('pet:tap', (e) => {
      const data = JSON.parse(e.data);
      spawnHeart(null, null, '💖');
      toast(`${data.actor.name} canavarı okşadı 🤗`);
      triggerPetSquish();
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
  } catch (err) {
    console.error('SSE bağlantı hatası:', err);
  }
}

function triggerPetSquish() {
  const fig = $('#petAvatarFigure');
  if (fig) {
    fig.classList.add('squish-anim');
    setTimeout(() => fig.classList.remove('squish-anim'), 400);
  }
}

// ==========================================================================
// EKRAN VE SEKME DEĞİŞİMİ
// ==========================================================================
function showScreen(screenId) {
  $$('.screen').forEach(s => s.classList.add('hidden'));
  const target = $(`#screen-${screenId}`);
  if (target) target.classList.remove('hidden');

  $$('#tabbar button').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'home') loadHomeBento();
  if (screenId === 'pets') loadPets();
  if (screenId === 'simulator') renderPhoneSimulator();
  if (screenId === 'friends') loadTogetherHub();
  if (screenId === 'messages') loadChat();
  if (screenId === 'profile') renderProfile();
}

// ==========================================================================
// EKRAN 1: BENTO HOME & WIDGETABLE WIDGET'LARI
// ==========================================================================
async function loadHomeBento() {
  const container = $('#bentoGrid');
  if (!container) return;

  try {
    const [boardData, missData, sleepData, distData, jarData, statusData] = await Promise.all([
      api('/api/widgets'),
      api('/api/widgets/miss-you').catch(() => ({ sent: 999, received: 420 })),
      api('/api/widgets/sleep').catch(() => ({ me: { hours: 7.5 }, partner: { hours: 8.2 } })),
      api('/api/widgets/distance').catch(() => ({ distanceKm: 5.3, myLocation: { name: 'Evde 🏠' }, partnerLocation: { name: 'Kafede ☕' } })),
      api('/api/widgets/jar').catch(() => ({ candies: [] })),
      api('/api/widgets/status').catch(() => ({ me: { status: 'Mutlu 🥰' } }))
    ]);

    // Aktif pet bul
    const currentPet = pets[0] || null;

    // 1. MISS YOU WIDGET
    const missCount = (missData.sent || 0) + (missData.received || 0);
    const missCard = `
      <div class="bento-card widget-miss-you">
        <div class="bento-header">
          <span class="bento-label">❤️ Miss You</span>
          <span class="badge badge-couple">+1 Özlem</span>
        </div>
        <div class="miss-you-heart-wrap" id="btnMissYouHeart">
          <svg class="miss-you-heart-svg" viewBox="0 0 100 90">
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF7B90"/>
                <stop offset="100%" stop-color="#FF5277"/>
              </linearGradient>
            </defs>
            <path fill="url(#heartGrad)" d="M50 85 C15 55 0 35 0 20 C0 8 10 0 23 0 C34 0 44 8 50 18 C56 8 66 0 77 0 C90 0 100 8 100 20 C100 35 85 55 50 85 Z"/>
          </svg>
        </div>
        <div class="miss-you-count" id="missYouCount">${missCount || 999}</div>
        <div class="miss-you-subtitle">Kocaman bir özlem gönder</div>
        <div class="miss-you-partner-note">${partnerUser ? `${partnerUser.name} ile senkronize` : 'Partnerinle canlı paylaş'}</div>
        <button class="btn-miss-tap" id="btnSendMissYou">
          <span>❤️</span>
          <span>Özledim!</span>
        </button>
      </div>
    `;

    // 2. SLEEP TRACKER (ME VS PARTNER)
    const meHours = sleepData.me?.hours || 7.5;
    const partnerHours = sleepData.partner?.hours || 8.2;
    const sleepCard = `
      <div class="bento-card widget-sleep">
        <div class="bento-header">
          <span class="bento-label">💤 Uyku Takibi</span>
          <span class="badge" style="background:#E6FAF5;color:#2EB080">Me vs Partner</span>
        </div>
        <div class="sleep-vs-container">
          <div class="sleep-circles">
            <!-- Concentric Progress Rings -->
            <svg width="130" height="130" viewBox="0 0 130 130">
              <!-- Background Tracks -->
              <circle cx="65" cy="65" r="54" fill="none" stroke="#E2E8F0" stroke-width="8"/>
              <circle cx="65" cy="65" r="40" fill="none" stroke="#E2E8F0" stroke-width="8"/>
              <!-- Partner Arc (Mint) -->
              <circle cx="65" cy="65" r="54" fill="none" stroke="#38C793" stroke-width="8" stroke-dasharray="339" stroke-dashoffset="${339 - (339 * Math.min(partnerHours / 10, 1))}" stroke-linecap="round" transform="rotate(-90 65 65)"/>
              <!-- Me Arc (Peach) -->
              <circle cx="65" cy="65" r="40" fill="none" stroke="#FFA34E" stroke-width="8" stroke-dasharray="251" stroke-dashoffset="${251 - (251 * Math.min(meHours / 10, 1))}" stroke-linecap="round" transform="rotate(-90 65 65)"/>
            </svg>
            <div class="sleep-vs-badge">VS</div>
          </div>
        </div>
        <div class="sleep-details-row">
          <div class="sleep-person">
            <div class="sleep-person-name" style="color:#E65100">● Ben</div>
            <div class="sleep-person-val">${meHours} sa</div>
          </div>
          <div class="sleep-person">
            <div class="sleep-person-name" style="color:#2EB080">● ${partnerUser ? partnerUser.name : 'Alex'}</div>
            <div class="sleep-person-val">${partnerHours} sa</div>
          </div>
        </div>
        <div class="sleep-bubble-note">"Get some sleep, babe 💕"</div>
      </div>
    `;

    // 3. DISTANCE & TOGETHER WIDGET
    const distKm = distData.distanceKm || 5.3;
    const isTogether = distData.together;
    const distanceCard = `
      <div class="bento-card bento-span-2 widget-distance">
        <div class="bento-header">
          <span class="bento-label">📍 Mesafe & Canlı Durum</span>
          <span class="badge ${isTogether ? 'badge-couple' : ''}">${isTogether ? 'Birlikteyiz 💕' : 'Farklı Yerlerde'}</span>
        </div>
        <div class="distance-km-hero">${isTogether ? '0 km' : `${distKm} km`}</div>
        <div class="distance-sublabel">${isTogether ? 'Şu anda birliktesiniz!' : 'Aramızdaki tatlı mesafe'}</div>

        <div class="distance-track-visual">
          <div class="distance-avatar" title="Sen">${me?.name ? me.name[0].toUpperCase() : 'B'}</div>
          <div class="distance-line">
            <span class="distance-heart-pulsing">💕</span>
          </div>
          <div class="distance-avatar" style="background:#FFEBF0;border-color:#FF6584" title="Partnerin">${partnerUser ? partnerUser.name[0].toUpperCase() : 'A'}</div>
        </div>

        <div class="distance-locations-row">
          <button class="dist-chip ${distData.myLocation?.label === 'home' ? 'active' : ''}" data-loc="home" data-name="Evde 🏠">Evde 🏠</button>
          <button class="dist-chip ${distData.myLocation?.label === 'work' ? 'active' : ''}" data-loc="work" data-name="İşte 🏢">İşte 🏢</button>
          <button class="dist-chip ${distData.myLocation?.label === 'cafe' ? 'active' : ''}" data-loc="cafe" data-name="Kafede ☕">Kafede ☕</button>
          <button class="dist-chip ${distData.myLocation?.label === 'road' ? 'active' : ''}" data-loc="road" data-name="Yolda 🚗">Yolda 🚗</button>
          <button class="dist-chip ${isTogether ? 'active' : ''}" data-together="true">Birlikteyiz 💕</button>
        </div>

        ${isTogether ? `
          <div class="together-banner">
            <span>🥰</span>
            <span>We are together in Istanbul! Sarılma zamanı!</span>
          </div>
        ` : ''}
      </div>
    `;

    // 4. MOOD CANDY JAR WIDGET
    const candies = jarData.candies || [];
    const candyColors = ['#FF7B90', '#FFD166', '#06D6A0', '#118AB2', '#9D7BFF'];
    const moodJarCard = `
      <div class="bento-card widget-jar">
        <div class="bento-header">
          <span class="bento-label">🍬 Duygu Kavanozu</span>
          <span class="badge">${candies.length} Şeker</span>
        </div>
        <div class="jar-illustration-wrap">
          <div class="jar-lid"></div>
          <div class="jar-candies-grid" id="jarCandiesGrid">
            ${candies.slice(-18).map(c => `
              <div class="jar-candy-bubble" style="background:${c.color || '#FF7B90'}">${c.emoji || '✨'}</div>
            `).join('')}
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--text-muted)">Kavanoza Duygu Şekeri At:</div>
        <div class="jar-mood-picker">
          <button class="jar-mood-btn" data-drop-mood="love" data-emoji="💖" data-color="#FF7B90" title="Aşk">💖</button>
          <button class="jar-mood-btn" data-drop-mood="happy" data-emoji="✨" data-color="#FFD166" title="Mutlu">✨</button>
          <button class="jar-mood-btn" data-drop-mood="calm" data-emoji="🌿" data-color="#70D6BB" title="Huzurlu">🌿</button>
          <button class="jar-mood-btn" data-drop-mood="tired" data-emoji="😴" data-color="#9D7BFF" title="Yorgun">😴</button>
        </div>
      </div>
    `;

    // 5. STATUS BUBBLE WIDGET
    const statusObj = statusData.me || { status: 'Mutlu 🥰', emoji: '🥰', text: 'Seni düşünüyorum!' };
    const statusCard = `
      <div class="bento-card widget-status">
        <div class="bento-header">
          <span class="bento-label">💭 Anlık Durum</span>
          <span class="badge">Widgetable Durum</span>
        </div>
        <div class="status-bubble-card">
          <div class="status-emoji-large">${statusObj.emoji || '🥰'}</div>
          <div>
            <div class="status-text-title">${esc(statusObj.status)}</div>
            <div class="status-text-sub">${esc(statusObj.text || '')}</div>
          </div>
        </div>
        <div class="status-quick-picker">
          <button class="status-pick-item" data-status="Mutlu 🥰" data-emoji="🥰" data-text="Harika bir gün!">Mutlu 🥰</button>
          <button class="status-pick-item" data-status="Açım 🍜" data-emoji="🍜" data-text="Karnım gurulduyor!">Açım 🍜</button>
          <button class="status-pick-item" data-status="Uykulu 😴" data-emoji="😴" data-text="Yatak çağırıyor...">Uykulu 😴</button>
          <button class="status-pick-item" data-status="Tuvalette 💩" data-emoji="💩" data-text="Rahatsız etmeyin!">Tuvalette 💩</button>
          <button class="status-pick-item" data-status="Özledim ❤️" data-emoji="❤️" data-text="Aklımdasın!">Özledim ❤️</button>
        </div>
      </div>
    `;

    // 6. PET SUMMARY CARD
    let petSummaryCard = '';
    if (currentPet) {
      const petFace = !currentPet.hatched ? '🥚' : (currentPet.sleeping ? '💤' : speciesIcon(currentPet.species));
      petSummaryCard = `
        <div class="bento-card bento-span-2" style="background:linear-gradient(145deg,#FFFBF5,#FFF2E5);border-color:#FFE0C2">
          <div class="bento-header">
            <span class="bento-label">🐾 Ortak Canavarımız</span>
            <span class="badge">Sv.${currentPet.level} · ${esc(currentPet.stageName)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:52px;cursor:pointer;line-height:1" id="homePetTap" title="Okşa!">${petFace}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-pure)">${esc(currentPet.name)}</div>
              <div style="font-size:12px;color:var(--text-muted);margin:2px 0 6px">
                Ruh Hali: <b>${esc(currentPet.mood)}</b> · ${currentPet.relationship ? `🔥 ${currentPet.relationship.streakDays} Gün Seri` : ''}
              </div>
              <div style="display:flex;gap:10px">
                <div style="font-size:11px;font-weight:700;color:#2EB080">🍽 Açlık: %${currentPet.stats.food}</div>
                <div style="font-size:11px;font-weight:700;color:#7B55E8">⚡ Enerji: %${currentPet.stats.energy}</div>
                <div style="font-size:11px;font-weight:700;color:#FF6584">💖 Mutluluk: %${currentPet.stats.happy}</div>
              </div>
            </div>
            <button class="btn btn-sm" id="btnGoPetHouse">Odaya Git →</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${missCard}
      ${sleepCard}
      ${distanceCard}
      ${moodJarCard}
      ${statusCard}
      ${petSummaryCard}
    `;

    // Dinleyicileri Bağla
    bindHomeEvents();

  } catch (err) {
    console.error('Bento yükleme hatası:', err);
  }
}

function bindHomeEvents() {
  // Miss you heart click
  const sendMiss = async () => {
    spawnHeart(null, null, '❤️');
    triggerPetSquish();
    try {
      const res = await api('/api/widgets/miss-you', { method: 'POST' });
      toast('Özlemin partnerine uçtu! ❤️');
      const cnt = $('#missYouCount');
      if (cnt) cnt.textContent = res.count || (parseInt(cnt.textContent) + 1);
    } catch {}
  };

  if ($('#btnMissYouHeart')) $('#btnMissYouHeart').onclick = sendMiss;
  if ($('#btnSendMissYou')) $('#btnSendMissYou').onclick = sendMiss;

  // Candy Jar Drop
  $$('.jar-mood-btn').forEach(btn => {
    btn.onclick = async () => {
      const { dropMood, emoji, color } = btn.dataset;
      spawnHeart(null, null, emoji);
      try {
        await api('/api/widgets/jar/drop', {
          method: 'POST',
          body: JSON.stringify({ mood: dropMood, emoji, color })
        });
        toast('Kavanoza şeker attın! 🍬');
        loadHomeBento();
      } catch (e) { toast(e.message); }
    };
  });

  // Location chips
  $$('.dist-chip').forEach(btn => {
    btn.onclick = async () => {
      if (btn.dataset.together) {
        await api('/api/widgets/distance', {
          method: 'POST',
          body: JSON.stringify({ together: true, distanceKm: 0 })
        });
        toast('Birlikteyiz moduna geçildi! 💕');
      } else {
        await api('/api/widgets/distance', {
          method: 'POST',
          body: JSON.stringify({
            together: false,
            distanceKm: 5.3,
            location: { label: btn.dataset.loc, name: btn.dataset.name }
          })
        });
        toast(`Konumun güncellendi: ${btn.dataset.name}`);
      }
      loadHomeBento();
    };
  });

  // Status pickers
  $$('.status-pick-item').forEach(btn => {
    btn.onclick = async () => {
      const { status, emoji, text } = btn.dataset;
      try {
        await api('/api/widgets/status', {
          method: 'POST',
          body: JSON.stringify({ status, emoji, text })
        });
        toast(`Durumun güncellendi: ${status}`);
        loadHomeBento();
      } catch (e) { toast(e.message); }
    };
  });

  // Home pet tap
  if ($('#homePetTap')) {
    $('#homePetTap').onclick = () => {
      spawnHeart(null, null, '💖');
      triggerPetSquish();
      toast('Canavarı okşadın 🤗');
    };
  }

  if ($('#btnGoPetHouse')) {
    $('#btnGoPetHouse').onclick = () => showScreen('pets');
  }

  if ($('#btnRefreshBoard')) {
    $('#btnRefreshBoard').onclick = () => {
      loadHomeBento();
      toast('Pano yenilendi 🔄');
    };
  }
}

// ==========================================================================
// EKRAN 2: PET HOUSE & ODALAR (SCREENSHOT 2 & 3)
// ==========================================================================
async function loadPets() {
  try {
    const d = await api('/api/pets');
    pets = d.pets || [];
    species = d.species || {};
    activePet = pets[0] || null;

    renderSpeciesRow();
    renderPetHouse();
    renderPetList();
  } catch (err) {
    console.error('Pets yükleme hatası:', err);
  }
}

function speciesIcon(k) {
  return { blob: '🫧', dino: '🦖', bunny: '🐰', ghost: '👻', bear: '🐻', cat: '🐱' }[k] || '🐱';
}

function renderSpeciesRow() {
  const row = $('#speciesRow');
  if (!row) return;
  row.innerHTML = Object.entries(species).map(([k, v]) => `
    <button class="btn ghost btn-sm" data-sp="${k}" style="font-size:18px">${speciesIcon(k)}</button>
  `).join('');
}

function renderPetHouse() {
  const stage = $('#roomStage');
  const bubble = $('#petSpeechBubble');
  const face = $('#petFaceEmoji');
  const hatSlot = $('#petHatSlot');
  const clothesSlot = $('#petClothesSlot');

  if (!stage || !activePet) {
    if (bubble) bubble.textContent = 'Henüz canavarın yok. Aşağıdan bir yumurta al! 🥚';
    return;
  }

  // Kıyafetleri göster
  if (hatSlot) hatSlot.textContent = currentHat;
  if (clothesSlot) clothesSlot.textContent = currentClothes;

  // Yüz ifadesi
  const petIcon = !activePet.hatched ? '🥚' : (activePet.sleeping ? '💤' : speciesIcon(activePet.species));
  if (face) face.textContent = petIcon;

  // Temizle ve odayı kur
  stage.className = `room-stage room-theme-${currentRoom}`;
  $$('.room-prop').forEach(p => p.remove());

  // Oda öğeleri
  if (currentRoom === 'living') {
    stage.insertAdjacentHTML('afterbegin', `
      <div class="living-fireplace room-prop">🔥</div>
      <div class="living-plant room-prop">🪴</div>
      <div class="living-picture room-prop">🖼️</div>
    `);
    if (bubble) bubble.textContent = activePet.hatched ? 'Cozy living room! Let\'s cuddle by the fire! 🛋️' : 'Yumurta şömine yanında ısınıyor 🥚';
  } else if (currentRoom === 'kitchen') {
    stage.insertAdjacentHTML('afterbegin', `
      <div class="kitchen-tablecloth room-prop"></div>
      <div class="kitchen-dish room-prop">🍓 🥛 🐟</div>
    `);
    if (bubble) bubble.textContent = 'So hungry! My tummy is rumbling! 🥺';
  } else if (currentRoom === 'bath') {
    stage.insertAdjacentHTML('afterbegin', `
      <div class="bath-tub-visual room-prop">
        <div class="bath-ducky">🐥</div>
      </div>
      <div class="floating-soap-bubble room-prop" style="top:40px;left:40px" data-pop="true">🫧</div>
      <div class="floating-soap-bubble room-prop" style="top:80px;right:60px" data-pop="true">🫧</div>
      <div class="floating-soap-bubble room-prop" style="top:120px;left:70px" data-pop="true">🫧</div>
    `);
    if (bubble) bubble.textContent = 'Mmm... warm bubble bath is so fresh! 🫧';

    // Baloncuk patlatma
    $$('[data-pop]').forEach(b => {
      b.onclick = () => {
        spawnHeart(b.getBoundingClientRect().left, b.getBoundingClientRect().top, '✨');
        b.style.transform = 'scale(1.6)';
        b.style.opacity = '0';
        setTimeout(() => b.remove(), 200);
        toast('Baloncuk patlattın! 🫧');
      };
    });
  } else if (currentRoom === 'bed') {
    stage.insertAdjacentHTML('afterbegin', `
      <div class="bed-frame-visual room-prop">
        <div class="bed-duvet"></div>
      </div>
      <div class="zzz-cloud room-prop">💤</div>
    `);
    if (bubble) bubble.textContent = activePet.sleeping ? 'Mışıl mışıl uyuyor... Zzz 💤' : 'I\'m so sleepy... tuck me in! 🛏️';
  } else if (currentRoom === 'tamagotchi') {
    // Screenshot 3 Retro Casing
    stage.innerHTML = `
      <div class="tamagotchi-casing room-prop">
        <div class="tamagotchi-keychain-loop"></div>
        <div class="tamagotchi-screen-frame">
          <div class="pet-speech-bubble" style="font-size:11px;padding:4px 8px;margin-bottom:6px">So hungry! My tummy is rumbling! 🥺</div>
          <div style="font-size:54px;line-height:1" class="clickable-pet" id="tamagotchiPet">${petIcon}</div>
        </div>
        <div class="tamagotchi-buttons-row">
          <button class="tamagotchi-btn" data-tama="feed" title="Mama">🦴</button>
          <button class="tamagotchi-btn" data-tama="water" title="Su">🥣</button>
          <button class="tamagotchi-btn" data-tama="love" title="Sevgi">🍼</button>
        </div>
      </div>
    `;

    // Tamagotchi düğmeleri
    $$('[data-tama]').forEach(btn => {
      btn.onclick = async () => {
        spawnHeart(null, null, '💖');
        toast('Tamagotchi düğmesine bastın!');
        if (activePet) {
          const act = btn.dataset.tama === 'feed' ? 'feed' : btn.dataset.tama === 'water' ? 'water' : 'pet';
          await petCare(activePet.id, act);
        }
      };
    });
    return;
  }

  // Tıklama ile okşama
  const petFig = $('#petAvatarFigure');
  if (petFig) {
    petFig.onclick = () => {
      spawnHeart(null, null, '💖');
      triggerPetSquish();
      if (bubble) bubble.textContent = 'I love you so much! 🤗';
      if (activePet) api(`/api/pets/${activePet.id}/tap`, { method: 'POST' }).catch(() => {});
    };
  }
}

function renderPetList() {
  const list = $('#petList');
  if (!list || !pets.length) return;

  list.innerHTML = pets.map(p => `
    <div class="panel" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-size:24px">${speciesIcon(p.species)}</span>
          <b style="font-size:16px;margin-left:6px">${esc(p.name)}</b>
          <span class="badge" style="margin-left:6px">Sv.${p.level}</span>
        </div>
        <div>
          ${!p.hatched ? `
            <button class="btn btn-sm" data-hatch="${p.id}">Tıkla & Çatlat 🥚</button>
          ` : `
            <span style="font-size:12px;color:var(--text-muted)">Ruh Hali: <b>${esc(p.mood)}</b></span>
          `}
        </div>
      </div>
    </div>
  `).join('');

  $$('[data-hatch]').forEach(b => {
    b.onclick = async () => {
      try {
        const res = await api(`/api/pets/${b.dataset.hatch}/hatch`, { method: 'POST' });
        toast(res.toast || 'Yumurtaya tıkladın! 🥚');
        loadPets();
      } catch (e) { toast(e.message); }
    };
  });
}

async function petCare(id, action) {
  try {
    const res = await api(`/api/pets/${id}/care`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    spawnHeart(null, null, '✨');
    triggerPetSquish();
    toast('Bakım yapıldı! 🐾');
    loadPets();
  } catch (e) {
    toast(e.message);
  }
}

// ==========================================================================
// EKRAN 3: TELEFON WIDGET SİMÜLATÖRÜ (SCREENSHOTS 3, 4, 5)
// ==========================================================================
function renderPhoneSimulator() {
  const screen = $('#iphoneScreenContent');
  if (!screen) return;

  const petIcon = activePet ? speciesIcon(activePet.species) : '🐱';

  if (currentSimMode === 'lock') {
    // Kilit Ekranı (Screenshot 3 & 4)
    screen.innerHTML = `
      <div class="iphone-status-bar">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>

      <div class="lockscreen-clock-wrap">
        <div class="lockscreen-date">Cumartesi, 24 Ekim</div>
        <div class="lockscreen-time">09:41</div>
      </div>

      <!-- Kilit Ekranı Widget'ları -->
      <div class="lockscreen-widgets-rail">
        <!-- Outline Pet Widget (Screenshot 3) -->
        <div class="lockscreen-widget-rect">
          <span style="font-size:26px">${petIcon}</span>
          <div style="font-size:10px;font-weight:700;line-height:1.2;color:#2D1E14">
            "Wait! I forgot to kiss you! 💋"
          </div>
        </div>

        <!-- Egg Hatch Circle Widget (Screenshot 3) -->
        <div class="lockscreen-widget-circle">
          <span style="font-size:20px">🥚</span>
          <span style="font-size:8px;font-weight:700;color:#2D1E14;margin-top:2px">Hatch 20h</span>
        </div>
      </div>

      <!-- Kilit Ekranı Bildirim Kartı (Miss You) -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);border-radius:18px;padding:12px;margin-top:14px;border:1.5px solid rgba(255,255,255,0.8)">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text-muted)">
          <span>🐾 Pawly Miss You</span>
          <span>Az önce</span>
        </div>
        <div style="font-size:13px;font-weight:700;color:#2D1E14;margin-top:4px">
          Alex sana kocaman bir özlem gönderdi! ❤️ (+999)
        </div>
      </div>

      <!-- Kilit Ekranı Mesafe Bildirimi -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);border-radius:18px;padding:12px;margin-top:8px;border:1.5px solid rgba(255,255,255,0.8)">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text-muted)">
          <span>📍 Mesafe Takibi</span>
          <span>Canlı</span>
        </div>
        <div style="font-size:13px;font-weight:700;color:#2D1E14;margin-top:4px">
          Alex • 5.3 km uzakta (Kafede ☕)
        </div>
      </div>
    `;
  } else {
    // Ana Ekran (Home Screen Widgets)
    screen.innerHTML = `
      <div class="iphone-status-bar">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>

      <div class="homescreen-grid">
        <!-- 2x2 Sleep VS Widget -->
        <div class="homescreen-widget-2x2">
          <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:#2EB080">
            <span>💤 Uyku VS</span>
            <span>8.2h vs 7.5h</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:center;font-size:32px">
            😴
          </div>
          <div style="font-size:9px;font-weight:700;text-align:center;color:#2D1E14">
            Alex kazandı! 🏆
          </div>
        </div>

        <!-- 2x2 Miss You Heart Widget -->
        <div class="homescreen-widget-2x2" style="background:rgba(255,235,240,0.9);border-color:#FFD2DC">
          <div style="font-size:10px;font-weight:700;color:#FF6584">❤️ Miss You</div>
          <div style="text-align:center">
            <div style="font-family:var(--font-display);font-size:26px;font-weight:700;color:#FF6584">999</div>
            <div style="font-size:9px;font-weight:700;color:#2D1E14">Özlem Gönderildi</div>
          </div>
          <div style="font-size:9px;color:#A68E7C;text-align:center">Canlı Senkron</div>
        </div>

        <!-- Standart Uygulama İkonları -->
        <div class="homescreen-app-icon">
          <div class="app-icon-squircle" style="background:#FFF">📸</div>
          <span class="app-icon-name">Fotoğraf</span>
        </div>
        <div class="homescreen-app-icon">
          <div class="app-icon-squircle" style="background:#FFEAA7">⏰</div>
          <span class="app-icon-name">Saat</span>
        </div>
        <div class="homescreen-app-icon">
          <div class="app-icon-squircle" style="background:#74B9FF">☀️</div>
          <span class="app-icon-name">Hava</span>
        </div>
        <div class="homescreen-app-icon">
          <div class="app-icon-squircle" style="background:#55EFC4">🗺️</div>
          <span class="app-icon-name">Harita</span>
        </div>

        <!-- 4x2 Tamagotchi / Pet Widget -->
        <div class="homescreen-widget-4x2">
          <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700">
            <span>🐾 Ponçik (Kedi)</span>
            <span style="color:#2EB080">Mutlu 🥰</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
            <span style="font-size:38px">${petIcon}</span>
            <div style="font-size:11px;font-weight:600;color:#2D1E14;line-height:1.3">
              "Karnım tok, enerjim yerinde! Beni sevmeye devam et 💕"
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ==========================================================================
// EKRAN 4: EŞLEŞME, DOSTLUK VE PARTNER (TOGETHER HUB)
// ==========================================================================
async function loadTogetherHub() {
  try {
    const [codeData, relData] = await Promise.all([
      api('/api/pair/my-code'),
      api('/api/friends/relationships').catch(() => ({ relationships: [] }))
    ]);

    // Kod görüntüle
    const codeEl = $('#myPairCode');
    if (codeEl) codeEl.textContent = codeData.pairCode || '------';

    // Aktif ilişkiler
    const rels = relData.relationships || [];
    myRelationship = rels[0] || null;
    partnerUser = myRelationship ? myRelationship.partner : null;

    updateHeaderPartner();

    const relList = $('#relationshipList');
    if (relList) {
      if (!rels.length) {
        relList.innerHTML = `
          <div style="text-align:center;padding:14px;color:var(--text-muted)">
            Henüz aktif bir eşleşmen yok. Kodunu paylaş veya yukarıdaki <b>Demo Partner</b> butonuyla hemen dene! 💕
          </div>
        `;
      } else {
        relList.innerHTML = rels.map(r => `
          <div class="list-item">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="who-avatar" style="background:${r.partner?.color || 'var(--accent-pink)'}">
                ${r.partner?.name ? r.partner.name[0].toUpperCase() : 'P'}
              </div>
              <div>
                <b style="font-size:15px;color:var(--text-pure)">${esc(r.partner?.name)}</b>
                <div style="font-size:12px;color:var(--text-muted)">
                  ${r.type === 'couple' ? '❤️ Sevgili' : '⭐ Kanka'} · 🔥 ${r.streakDays || 1} Gün Seri
                </div>
              </div>
            </div>
            <button class="btn ghost btn-sm" data-break-rel="${r.id}">Ayrıl</button>
          </div>
        `).join('');
      }
    }

    // Demo partner butonu
    const btnDemo = $('#btnConnectDemoPartner');
    if (btnDemo) {
      btnDemo.onclick = async () => {
        try {
          const res = await api('/api/pair/demo', { method: 'POST' });
          toast(res.message || 'Alex 💕 ile eşleştin!');
          await loadTogetherHub();
          await loadPets();
          await loadHomeBento();
        } catch (e) { toast(e.message); }
      };
    }

  } catch (err) {
    console.error('Together hub hatası:', err);
  }
}

function updateHeaderPartner() {
  const pill = $('#topbarPartnerPill');
  const nameEl = $('#topbarPartnerName');
  const streakEl = $('#topbarStreak');

  if (!pill) return;

  if (myRelationship && partnerUser) {
    pill.classList.remove('hidden');
    if (nameEl) nameEl.textContent = `${partnerUser.name} ⇄`;
    if (streakEl) streakEl.textContent = `🔥 ${myRelationship.streakDays || 1}`;
    pill.onclick = () => showScreen('friends');
  } else {
    pill.classList.add('hidden');
  }
}

// ==========================================================================
// EKRAN 5 & 6: SOHBET, PROFİL VE AYARLAR
// ==========================================================================
async function loadChat() {
  const head = $('#chatHead');
  const body = $('#chatBody');
  const foot = $('#chatFoot');

  if (!partnerUser) {
    if (head) head.textContent = 'Partner Yok';
    if (body) body.innerHTML = '<p class="hint" style="margin:auto">Sohbet etmek için bir partnerle eşleşmelisin.</p>';
    if (foot) foot.classList.add('hidden');
    return;
  }

  if (head) head.textContent = `${partnerUser.name} ile Sohbet 💕`;
  if (foot) foot.classList.remove('hidden');

  try {
    const data = await api(`/api/messages/${partnerUser.username}`);
    const msgs = data.messages || [];

    if (body) {
      body.innerHTML = msgs.length ? msgs.map(m => `
        <div class="bubble ${m.from === me.username ? 'me' : 'other'}">
          ${esc(m.text)}
        </div>
      `).join('') : '<p class="hint" style="margin:auto">İlk tatlı mesajı sen gönder 💕</p>';
      body.scrollTop = body.scrollHeight;
    }
  } catch {}
}

function renderProfile() {
  const panel = $('#profilePanel');
  if (!panel || !me) return;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <div class="who-avatar" style="width:54px;height:54px;font-size:24px;background:${me.color || 'var(--accent-pink)'}">
        ${me.name ? me.name[0].toUpperCase() : 'U'}
      </div>
      <div>
        <h2 style="font-size:18px;margin:0">${esc(me.name)}</h2>
        <div style="font-size:12px;color:var(--text-muted)">@${esc(me.username)} ${me.isGuest ? '· ⚡ Misafir Hesap' : ''}</div>
        <div style="font-size:11px;color:var(--accent-pink);font-weight:700;margin-top:2px">Kod: ${me.pairCode || 'Yok'}</div>
      </div>
    </div>

    ${me.isGuest ? `
      <div style="background:#FFF5EA;border:1.5px solid #FFE0C2;border-radius:14px;padding:12px;margin-bottom:14px">
        <div style="font-weight:700;font-size:13px;color:#D9480F">⚡ Misafir Hesabını Kalıcı Yap</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Evcil hayvanını ve eşleşmelerini kaybetmemek için bir şifre belirle:</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <input id="convertName" placeholder="İsim" value="${esc(me.name)}">
          <input id="convertUser" placeholder="Kullanıcı adı" value="${esc(me.username)}">
          <input id="convertPass" type="password" placeholder="Yeni Şifre">
          <button class="btn btn-sm" id="btnConvertGuest">Hesabı Kaydet</button>
        </div>
      </div>
    ` : ''}

    <button class="btn ghost wide" id="btnLogout" style="color:#D94848">Oturumu Kapat 🚪</button>
  `;

  if ($('#btnLogout')) {
    $('#btnLogout').onclick = () => {
      localStorage.removeItem('pawly_token');
      token = '';
      location.reload();
    };
  }

  if ($('#btnConvertGuest')) {
    $('#btnConvertGuest').onclick = async () => {
      try {
        const body = {
          name: $('#convertName').value,
          username: $('#convertUser').value,
          password: $('#convertPass').value
        };
        const res = await api('/api/auth/convert-guest', { method: 'POST', body: JSON.stringify(body) });
        token = res.token;
        localStorage.setItem('pawly_token', token);
        toast('Hesabınız kalıcı olarak kaydedildi! 🎉');
        me = res.user;
        renderProfile();
      } catch (e) { toast(e.message); }
    };
  }
}

// ==========================================================================
// BAŞLANGIÇ VE EVENT ATAMALARI (INIT)
// ==========================================================================
async function init() {
  // Tabbar butonları
  $$('#tabbar button').forEach(b => {
    b.onclick = () => showScreen(b.dataset.screen);
  });

  // Kilit / Ana Ekran Simülatör geçişi
  $$('[data-sim-mode]').forEach(b => {
    b.onclick = () => {
      $$('[data-sim-mode]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentSimMode = b.dataset.simMode;
      renderPhoneSimulator();
    };
  });

  // Oda Sekmeleri (Screenshot 2)
  $$('#roomTabsBar .room-tab-btn').forEach(b => {
    b.onclick = () => {
      $$('#roomTabsBar .room-tab-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentRoom = b.dataset.room;

      if (currentRoom === 'closet') {
        $('#closetPanel').classList.remove('hidden');
      } else {
        $('#closetPanel').classList.add('hidden');
        renderPetHouse();
      }
    };
  });

  // Gardırop butonları
  $$('[data-outfit-hat]').forEach(b => {
    b.onclick = () => {
      currentHat = b.dataset.outfitHat;
      localStorage.setItem('pawly_pet_hat', currentHat);
      toast('Şapka giyildi! 👒');
      renderPetHouse();
    };
  });

  $$('[data-outfit-clothes]').forEach(b => {
    b.onclick = () => {
      currentClothes = b.dataset.outfitClothes;
      localStorage.setItem('pawly_pet_clothes', currentClothes);
      toast('Kıyafet giyildi! 👗');
      renderPetHouse();
    };
  });

  // Pet Bakım Butonları
  $$('#petCareActionsGrid .pet-care-btn').forEach(b => {
    b.onclick = async () => {
      if (!activePet) return;
      await petCare(activePet.id, b.dataset.petCare);
    };
  });

  // Yeni Yumurta Al
  if ($('#createPet')) {
    $('#createPet').onclick = async () => {
      const name = $('#petName').value.trim();
      const withUser = $('#petWith').value.trim();
      if (!name) return toast('Canavarına bir isim ver!');
      try {
        await api('/api/pets', {
          method: 'POST',
          body: JSON.stringify({ name, species: 'cat', withUser })
        });
        toast('Yeni yumurtan yuvasına yerleşti! 🥚');
        $('#petName').value = '';
        $('#petWith').value = '';
        loadPets();
      } catch (e) { toast(e.message); }
    };
  }

  // Kod Kopyalama
  if ($('#btnCopyCode')) {
    $('#btnCopyCode').onclick = () => {
      const c = $('#myPairCode').textContent;
      navigator.clipboard.writeText(c);
      toast('Eşleşme kodu panoya kopyalandı! 📋');
    };
  }

  // Kod ile Eşleşme Formu
  if ($('#pairConnectForm')) {
    $('#pairConnectForm').onsubmit = async (e) => {
      e.preventDefault();
      const code = $('#inputPairCode').value.trim();
      const type = $('#selectPairType').value;
      if (!code) return toast('Lütfen 6 haneli kodu yazın');
      try {
        const res = await api('/api/pair/connect', {
          method: 'POST',
          body: JSON.stringify({ code, type })
        });
        toast(res.message || 'Eşleşme başarıyla tamamlandı! 🎉');
        $('#inputPairCode').value = '';
        loadTogetherHub();
        loadHomeBento();
      } catch (err) { toast(err.message); }
    };
  }

  // Auth Modal & Giriş Yönetimi
  if ($('#tabLogin')) {
    $('#tabLogin').onclick = () => {
      $('#tabLogin').style.background = '#fff';
      $('#tabRegister').style.background = 'none';
      $('#authName').classList.add('hidden');
      $('#authSubmit').textContent = 'Giriş Yap 🚀';
    };
  }

  if ($('#tabRegister')) {
    $('#tabRegister').onclick = () => {
      $('#tabRegister').style.background = '#fff';
      $('#tabLogin').style.background = 'none';
      $('#authName').classList.remove('hidden');
      $('#authSubmit').textContent = 'Kaydol ✨';
    };
  }

  if ($('#authGuest')) {
    $('#authGuest').onclick = async () => {
      try {
        const res = await api('/api/auth/guest', { method: 'POST' });
        token = res.token;
        localStorage.setItem('pawly_token', token);
        $('#authModal').classList.add('hidden');
        toast('Misafir olarak giriş yapıldı! ⚡');
        await bootApp();
      } catch (e) { toast(e.message); }
    };
  }

  if ($('#authSubmit')) {
    $('#authSubmit').onclick = async () => {
      const isReg = !$('#authName').classList.contains('hidden');
      const u = $('#authUser').value.trim();
      const p = $('#authPass').value;
      const n = $('#authName').value.trim();

      try {
        const path = isReg ? '/api/auth/register' : '/api/auth/login';
        const body = isReg ? { username: u, password: p, name: n } : { username: u, password: p };
        const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
        token = res.token;
        localStorage.setItem('pawly_token', token);
        $('#authModal').classList.add('hidden');
        toast('Giriş başarılı! 🐾');
        await bootApp();
      } catch (e) {
        const err = $('#authErr');
        if (err) {
          err.textContent = e.message;
          err.classList.remove('hidden');
        }
      }
    };
  }

  // Oturum kontrolü
  if (token) {
    try {
      await bootApp();
      $('#authModal').classList.add('hidden');
    } catch {
      $('#authModal').classList.remove('hidden');
    }
  } else {
    $('#authModal').classList.remove('hidden');
  }
}

async function bootApp() {
  const myData = await api('/api/users/me');
  me = myData.user;

  const hi = $('#hiName');
  if (hi) hi.textContent = me.name || me.username;

  const av = $('#myAvatar');
  if (av) {
    av.style.background = me.color || 'var(--accent-pink)';
    av.textContent = me.name ? me.name[0].toUpperCase() : '🐾';
  }

  connectEvents();
  await loadTogetherHub();
  await loadPets();
  await loadHomeBento();
}

window.addEventListener('DOMContentLoaded', init);
