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
let missCombo = 0;
let comboTimer = null;
let bentoHeart3D = null;
let hubHeart3D = null;
let hubHeartbeatTimer = null;
let candyJarPhysics = null;
let isDrawingDoodle = false;
let doodleStrokes = [];
let currentDoodleStroke = [];
let currentDoodleColor = '#FF6584';

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
      if (window.PawlyAudio) {
        window.PawlyAudio.soundHarpScale(data.combo || 1);
        window.PawlyAudio.vibrateHeartbeat();
      }
      spawnHeart(null, null, data.note ? '💌' : '❤️');
      if (bentoHeart3D && typeof bentoHeart3D.triggerTapPulse === 'function') {
        bentoHeart3D.triggerTapPulse(1.2);
      }
      if (hubHeart3D && typeof hubHeart3D.triggerTapPulse === 'function') {
        hubHeart3D.triggerTapPulse(1.2);
      }
      toast(data.toast || 'Partnerin seni çok özledi! ❤️');
      loadHomeBento();
      if ($('#missYouModal') && !$('#missYouModal').classList.contains('hidden')) {
        refreshMissYouHub();
      }
    });

    sse.addEventListener('widget:love_bomb', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) {
        window.PawlyAudio.soundLoveBomb();
        window.PawlyAudio.vibrateBomb();
      }
      triggerLoveRain(80);
      showLoveBombAlert(data);
      loadHomeBento();
      if ($('#missYouModal') && !$('#missYouModal').classList.contains('hidden')) {
        refreshMissYouHub();
      }
    });

    sse.addEventListener('widget:heart_sync', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundHappy();
      toast(`✨ ${data.partner?.name || 'Partnerin'} ile aynı anda birbirinizi düşünüyorsunuz! ✨`);
      updateHeartSyncUI(true);
    });

    sse.addEventListener('widget:distance', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundPop(550);
      toast(`Partnerin konumunu güncelledi: ${data.location?.name || ''}`);
      loadHomeBento();
    });

    sse.addEventListener('widget:together', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
      showTogetherCelebration(data.toast);
      loadHomeBento();
    });

    sse.addEventListener('widget:jar', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundBubble();
      if (candyJarPhysics && data.candy) {
        candyJarPhysics.dropCandy(data.candy);
      }
      toast(data.toast || 'Kavanoza yeni bir duygu şekeri eklendi! 🍬');
      loadHomeBento();
    });

    sse.addEventListener('widget:doodle', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundHappy();
      spawnHeart(null, null, '🎨');
      toast(data.toast || 'Partnerin sana yeni bir aşk karalaması gönderdi! 🎨');
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
      if (window.PawlyAudio) window.PawlyAudio.soundHappy();
      spawnHeart(null, null, '💖');
      toast(`${data.actor.name} canavarı okşadı 🤗`);
      triggerPetSquish();
    });

    sse.addEventListener('pet:created', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
      if (data.message) toast(data.message);
      loadPets();
    });

    sse.addEventListener('pet:updated', (e) => {
      const data = JSON.parse(e.data);
      if (data.toast) toast(data.toast);
      loadPets();
    });

    sse.addEventListener('pet:adventure_started', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundAdventureStart();
      toast(data.toast || 'Canavar maceraya çıktı! 🎒');
      loadPets();
      loadHomeBento();
    });

    sse.addEventListener('pet:adventure_returned', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) {
        window.PawlyAudio.soundDoorbell();
        setTimeout(() => window.PawlyAudio.soundCameraShutter(), 700);
      }
      toast(data.toast || 'Canavar seyahatten döndü! 📸');
      if (data.souvenir) {
        showPolaroidModal(data.souvenir);
      }
      loadPets();
      loadHomeBento();
    });

    sse.addEventListener('widget:plant_watered', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) window.PawlyAudio.soundBubble();
      spawnHeart(null, null, '💧');
      toast(data.toast || 'Partnerin ortak çiçeği suladı! 💧');
      loadHomeBento();
    });

    sse.addEventListener('widget:daily_qa', (e) => {
      const data = JSON.parse(e.data);
      if (window.PawlyAudio) {
        if (data.revealed) window.PawlyAudio.soundFanfare();
        else window.PawlyAudio.soundHeart();
      }
      toast(data.toast || 'Günün sorusu güncellendi! 💌');
      loadHomeBento();
    });

    sseConnection = sse;
  } catch (err) {
    console.error('SSE bağlantı hatası:', err);
  }
}

function triggerPetSquish() {
  const fig = $('#petAvatarFigure') || $('#petSvgBox');
  if (fig) {
    fig.classList.add('squish-anim');
    setTimeout(() => fig.classList.remove('squish-anim'), 400);
  }
}

// ==========================================================================
// EKRAN VE SEKME DEĞİŞİMİ
// ==========================================================================
function showScreen(screenId) {
  if (window.PawlyAudio) window.PawlyAudio.soundPop(500);

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
    const [boardData, missData, sleepData, distData, jarData, statusData, doodleData, plantData, dailyQaData] = await Promise.all([
      api('/api/widgets'),
      api('/api/widgets/miss-you').catch(() => ({ sent: 999, received: 420 })),
      api('/api/widgets/sleep').catch(() => ({
        me: { hours: 7.5, weekly: [7.2, 7.8, 6.5, 7.5, 8.0, 7.5, 7.5] },
        partner: { hours: 8.2, weekly: [8.0, 8.2, 7.5, 8.0, 8.5, 8.0, 8.2] },
        winner: 'partner',
        advice: 'İkiniz de dengeli dinleniyorsunuz! 🌙'
      })),
      api('/api/widgets/distance').catch(() => ({ distanceKm: 5.3, myLocation: { name: 'Evde 🏠' }, partnerLocation: { name: 'Kafede ☕' } })),
      api('/api/widgets/jar').catch(() => ({ candies: [] })),
      api('/api/widgets/status').catch(() => ({ me: { status: 'Mutlu 🥰' } })),
      api('/api/widgets/doodle').catch(() => ({ doodle: null })),
      api('/api/widgets/plant').catch(() => ({ plant: { stageLabel: 'Filiz', stageEmoji: '🌿', growth: 35, info: { name: 'Aşk Gülü 🌹' } } })),
      api('/api/widgets/daily-qa').catch(() => ({ question: 'Günün sorusu', revealed: false }))
    ]);

    const currentPet = pets[0] || null;

    // 1. MISS YOU WIDGET (With 3D WebGL Puffy Clay Heart & Combo System)
    const missCount = (missData.sent || 0) + (missData.received || 0);
    const missCard = `
      <div class="bento-card widget-miss-you">
        <div class="bento-header">
          <span class="bento-label">❤️ Miss You</span>
          <span class="badge badge-couple">+1 Özlem</span>
        </div>
        ${missCombo > 1 ? `<div class="miss-you-combo-badge">${missCombo}x COMBO! 🔥</div>` : ''}
        <div class="miss-you-heart-3d-wrap" id="missYouHeart3DBox" title="Kalbi pompala!">
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
        <div class="miss-you-count" id="missYouCount">${missCount || 0}</div>
        <div class="miss-you-subtitle">Kocaman bir özlem gönder</div>
        <div class="miss-you-partner-note">${partnerUser ? `${partnerUser.name} ile senkronize` : 'Partnerinle canlı paylaş'}</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn-miss-tap" id="btnSendMissYou" style="flex:1">
            <span>❤️</span>
            <span>Özledim!</span>
          </button>
          <button class="btn ghost btn-sm" id="btnOpenMissYouHub" title="Detaylı Özledim Paneli" style="font-size:16px;padding:8px 12px;background:#FFF0F3;border:1.5px solid #FF85A1">
            ✨
          </button>
        </div>
      </div>
    `;

    // 2. SLEEP TRACKER (ME VS PARTNER & 7-DAY DUAL BARS + TROPHY)
    const meHours = sleepData.me?.hours || 7.5;
    const partnerHours = sleepData.partner?.hours || 8.2;
    const meWeekly = sleepData.me?.weekly || [7.2, 7.8, 6.5, 7.5, 8.0, 7.5, 7.5];
    const partnerWeekly = sleepData.partner?.weekly || [8.0, 8.2, 7.5, 8.0, 8.5, 8.0, 8.2];
    const winner = sleepData.winner || 'tie';

    const trophyHtml = winner === 'me' ?
      `<div class="sleep-trophy-badge">🏆 Altın Uyku Kupası Sende!</div>` :
      winner === 'partner' ?
      `<div class="sleep-trophy-badge">🏆 Altın Uyku Kupası ${partnerUser?.name || 'Alex'}'te!</div>` :
      `<div class="sleep-trophy-badge">🤝 Eşit Dinlenme!</div>`;

    const sleepCard = `
      <div class="bento-card widget-sleep">
        <div class="bento-header">
          <span class="bento-label">💤 Uyku Takibi</span>
          <span class="badge" style="background:#E6FAF5;color:#2EB080">Me vs Partner</span>
        </div>
        <div class="sleep-vs-container">
          <div class="sleep-circles">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#E2E8F0" stroke-width="8"/>
              <circle cx="65" cy="65" r="40" fill="none" stroke="#E2E8F0" stroke-width="8"/>
              <circle cx="65" cy="65" r="54" fill="none" stroke="#38C793" stroke-width="8" stroke-dasharray="339" stroke-dashoffset="${339 - (339 * Math.min(partnerHours / 10, 1))}" stroke-linecap="round" transform="rotate(-90 65 65)"/>
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

        <!-- 7 Günlük Çubuk Grafik Karşılaştırması -->
        <div class="sleep-weekly-chart">
          ${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, idx) => `
            <div class="sleep-day-col">
              <div class="sleep-dual-bars">
                <div class="sleep-bar-me" style="height:${Math.max(10, Math.min(55, Math.round(((meWeekly[idx] || 7) / 10) * 55)))}px" title="Sen: ${meWeekly[idx] || 7} sa"></div>
                <div class="sleep-bar-partner" style="height:${Math.max(10, Math.min(55, Math.round(((partnerWeekly[idx] || 7) / 10) * 55)))}px" title="${partnerUser?.name || 'Partner'}: ${partnerWeekly[idx] || 7} sa"></div>
              </div>
              <span class="sleep-day-lbl">${day}</span>
            </div>
          `).join('')}
        </div>

        <div style="text-align:center">${trophyHtml}</div>
        <div class="sleep-bubble-note">${sleepData.advice || '"Get some sleep, babe 💕"'}</div>
      </div>
    `;

    // 3. DISTANCE & TOGETHER WIDGET
    const distKm = distData.distanceKm || 5.3;
    const isTogether = distData.together;
    const distanceCard = `
      <div class="bento-card bento-span-2 widget-distance ${isTogether ? 'together-glow-aura' : ''}">
        <div class="bento-header">
          <span class="bento-label">📍 Mesafe & Canlı Durum</span>
          <span class="badge ${isTogether ? 'badge-couple' : ''}">${isTogether ? 'Birlikteyiz 💕' : 'Farklı Yerlerde'}</span>
        </div>
        <div class="distance-km-hero">${isTogether ? '0 km' : `${distKm} km`}</div>
        <div class="distance-sublabel">${isTogether ? 'Şu anda birliktesiniz! Sarılma zamanı!' : 'Aramızdaki tatlı mesafe'}</div>

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
            <span>Şu anda aynı yerdesiniz! Sarılma modu aktif!</span>
          </div>
        ` : ''}
      </div>
    `;

    // 4. MOOD CANDY JAR WIDGET (2D Fizik Motoru ile)
    const candies = jarData.candies || [];
    const moodJarCard = `
      <div class="bento-card widget-jar">
        <div class="bento-header">
          <span class="bento-label">🍬 Duygu Kavanozu</span>
          <span class="badge" id="jarCountBadge">${candies.length} Şeker</span>
        </div>
        <div class="jar-lid-knob"></div>
        <div class="candy-jar-canvas-box" id="candyJarBox" title="Kavanozu sallamak için dokun!">
          <canvas id="candyJarCanvas" width="170" height="180"></canvas>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Kavanoza Duygu Şekeri At:</div>
        <div class="jar-mood-picker">
          <button class="jar-mood-btn" data-drop-mood="love" data-emoji="💖" data-color="#FF7B90" title="Aşk">💖</button>
          <button class="jar-mood-btn" data-drop-mood="happy" data-emoji="✨" data-color="#FFD166" title="Mutlu">✨</button>
          <button class="jar-mood-btn" data-drop-mood="calm" data-emoji="🌿" data-color="#70D6BB" title="Huzurlu">🌿</button>
          <button class="jar-mood-btn" data-drop-mood="tired" data-emoji="😴" data-color="#9D7BFF" title="Yorgun">😴</button>
          <button class="jar-mood-btn" data-drop-mood="sweet" data-emoji="🍓" data-color="#FF4D79" title="Tatlı">🍓</button>
        </div>
      </div>
    `;

    // 5. LIVE DOODLE WIDGET (Canlı Karalama & Ortak Çizim)
    const curDoodle = doodleData?.doodle || null;
    const doodleCard = `
      <div class="bento-card widget-doodle">
        <div class="bento-header">
          <span class="bento-label">🎨 Canlı Karalama</span>
          <span class="badge" style="background:#FFF0F5;color:#E91E63">Canlı Tuval</span>
        </div>
        <div class="doodle-preview-box" id="btnOpenDoodle" title="Çizim yapmak için tıkla!">
          ${curDoodle && curDoodle.previewDataUrl ? `
            <img src="${curDoodle.previewDataUrl}" class="doodle-preview-img" alt="Canlı Karalama">
          ` : `
            <div style="font-size:13px;color:var(--text-muted);display:flex;flex-direction:column;align-items:center;gap:4px">
              <span style="font-size:26px">✏️</span>
              <span>Partnerine bir aşk notu çiz!</span>
            </div>
          `}
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px">
          ${curDoodle ? `${curDoodle.fromName} tarafından çizildi 💕` : 'Partnerinle kilit ekranı gibi ortak karala'}
        </div>
        <button class="btn peach btn-sm wide" id="btnDrawDoodle">🎨 Çiz / Karala</button>
      </div>
    `;

    // 6. STATUS BUBBLE WIDGET
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

    // 7. PET SUMMARY CARD WITH SVG MASCOT
    let petSummaryCard = '';
    if (currentPet) {
      const petMascotSvg = window.PawlyMascot && currentPet.hatched ?
        window.PawlyMascot.renderMascotSVG(currentPet.species, currentPet.sleeping ? 'sleeping' : 'idle', { hat: currentHat, clothes: currentClothes }) :
        (window.PawlyMascot ? window.PawlyMascot.renderEggSVG(currentPet.hatchProgress, currentPet.hatchNeeded) : '🐱');

      petSummaryCard = `
        <div class="bento-card bento-span-2" style="background:linear-gradient(145deg,#FFFBF5,#FFF2E5);border-color:#FFE0C2">
          <div class="bento-header">
            <span class="bento-label">🐾 Ortak Canavarımız</span>
            <span class="badge">Sv.${currentPet.level} · ${esc(currentPet.stageName)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:16px">
            <div style="width:75px;height:75px;cursor:pointer;flex-shrink:0" id="homePetTap" title="Okşa!">${petMascotSvg}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-pure)">${esc(currentPet.name)}</div>
              <div style="font-size:12px;color:var(--text-muted);margin:2px 0 6px">
                Ruh Hali: <b>${esc(currentPet.mood)}</b> · ${currentPet.relationship ? `🔥 ${currentPet.relationship.streakDays} Gün Seri` : ''}
              </div>
              ${currentPet.adventure ? `
                <div style="display:inline-flex;align-items:center;gap:4px;background:#FFF2E5;color:#D9480F;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin-bottom:6px">
                  <span>🎒</span> <span>${currentPet.adventure.destination?.name || 'Macerada'}</span>
                </div>
              ` : ''}
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

    // 8. COUPLES LOVE GARDEN WIDGET (Ortak Aşk & Çiçek Bahçesi)
    const plantObj = plantData?.plant || {
      stageLabel: 'Filiz',
      stageEmoji: '🌿',
      growth: 35,
      info: { name: 'Aşk Gülü 🌹' }
    };
    const plantCard = `
      <div class="bento-card widget-plant">
        <div class="bento-header">
          <span class="bento-label">🌱 Ortak Çift Bahçesi</span>
          <span class="badge" style="background:#D8F5EA;color:#1B4D3E">${esc(plantObj.stageLabel || 'Filiz')}</span>
        </div>
        <div class="plant-display-stage">
          <div class="plant-flower-hero">${plantObj.stageEmoji || '🌿'}</div>
          <div style="font-size:12px;font-weight:700;color:var(--text-pure);margin-top:4px">${esc(plantObj.info?.name || 'Aşk Çiçeği')}</div>
          <div class="plant-growth-track">
            <div class="plant-growth-fill" style="width:${plantObj.growth || 0}%"></div>
          </div>
          <div style="font-size:10px;font-weight:700;color:#2EB080">%${plantObj.growth || 0} Büyüme İlerlemesi</div>
        </div>
        <button class="btn-water-plant" id="btnWaterPlant">💧 Birlikte Sula (+25)</button>
      </div>
    `;

    // 9. GÜNÜN ÇİFT SORUSU (DAILY COUPLE Q&A WIDGET)
    const qa = dailyQaData || { question: 'Günün sorusu', revealed: false };
    const myAns = qa.myAnswer;
    const partnerAns = qa.partnerAnswer;
    const isRevealed = qa.revealed;

    const qaCard = `
      <div class="bento-card bento-span-2 widget-qa">
        <div class="bento-header">
          <span class="bento-label">💌 Günün Çift Sorusu</span>
          <span class="badge" style="background:#FFF0F5;color:#E91E63">${isRevealed ? '✨ Cevaplar Açıldı' : (myAns ? '🔒 Partner Bekleniyor' : 'Cevapla')}</span>
        </div>
        <div class="qa-question-box">${esc(qa.question || 'Günün sorusu yükleniyor...')}</div>

        ${isRevealed ? `
          <div class="qa-answers-revealed-grid">
            <div class="qa-answer-bubble me">
              <div style="font-size:10px;font-weight:700;margin-bottom:2px">● Sen</div>
              <div>"${esc(myAns)}"</div>
            </div>
            <div class="qa-answer-bubble partner">
              <div style="font-size:10px;font-weight:700;margin-bottom:2px">● ${partnerUser ? esc(partnerUser.name) : 'Partner'}</div>
              <div>"${esc(partnerAns)}"</div>
            </div>
            <div style="text-align:center;font-size:11px;font-weight:800;color:#FF6584;margin-top:4px">
              ✨ %100 Kalp Uyumu! +40 XP Kazanıldı 💕
            </div>
          </div>
        ` : myAns ? `
          <div class="qa-locked-secret-card">
            <span style="font-size:22px">💌 🔒</span>
            <b>Cevabın mühürlendi!</b>
            <span>"${esc(myAns)}"</span>
            <span style="font-size:10px;color:var(--text-dim);margin-top:4px">${partnerUser ? esc(partnerUser.name) : 'Partnerin'} de cevaplayınca ikinizin cevabı aynı anda açılacak!</span>
          </div>
        ` : `
          <div style="display:flex;gap:6px">
            <input id="inputDailyQAAnswer" placeholder="Gizli cevabını yaz... 💌" maxlength="240" style="flex:1;font-size:12px">
            <button class="btn peach btn-sm" id="btnSubmitDailyQA">Gönder 💌</button>
          </div>
        `}
      </div>
    `;

    container.innerHTML = `
      ${missCard}
      ${sleepCard}
      ${distanceCard}
      ${moodJarCard}
      ${doodleCard}
      ${statusCard}
      ${plantCard}
      ${qaCard}
      ${petSummaryCard}
    `;

    bindHomeEvents();
    initBentoHeart3D();
    initCandyJar2D(candies);

  } catch (err) {
    console.error('Bento yükleme hatası:', err);
  }
}

// ==========================================================================
// FAZ 2: MISS YOU HUB, 3D PUFFY HEART & LOVE BOMB ENTEGRASYONU
// ==========================================================================

function triggerLoveRain(count = 60) {
  const canvas = document.getElementById('loveRainCanvas');
  if (!canvas) return;
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const emojis = ['❤️', '💖', '💕', '✨', '🌸', '🍓', '🍬', '🥰'];
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 250,
      vx: (Math.random() - 0.5) * 3,
      vy: 3.5 + Math.random() * 5.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.1,
      size: 18 + Math.random() * 18,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      opacity: 1
    });
  }

  let animId;
  const start = performance.now();
  function render(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      if (p.y > canvas.height - 100) {
        p.opacity -= 0.025;
      }
      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }
    });

    if (alive && (now - start < 4000)) {
      animId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animId);
      canvas.classList.add('hidden');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  animId = requestAnimationFrame(render);
}

function showLoveBombAlert(data) {
  const modal = $('#loveBombModal');
  if (!modal) return;
  const title = $('#loveBombTitle');
  const sub = $('#loveBombSub');
  const note = $('#loveBombNote');

  if (title) title.textContent = `${data.combo || 10}x AŞK BOMBASI! 💣❤️`;
  if (sub) sub.textContent = `${data.from?.name || 'Alex'} sana ${data.combo || 10}x Aşk Bombası fırlattı!`;
  if (note) {
    if (data.note) {
      note.textContent = `"${data.note}"`;
      note.classList.remove('hidden');
    } else {
      note.classList.add('hidden');
    }
  }
  modal.classList.remove('hidden');
}

function initBentoHeart3D() {
  const box = $('#missYouHeart3DBox');
  if (!box) return;
  if (window.MissYou3DScene) {
    try {
      bentoHeart3D = new window.MissYou3DScene(box, { hero: false, scaleMultiplier: 0.95 });
    } catch (e) {
      console.warn('Bento 3D Heart init fallback:', e);
    }
  }
}

async function openMissYouHub() {
  const modal = $('#missYouModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const hubBox = $('#missYouHub3DBox');
  if (hubBox && !hubHeart3D && window.MissYou3DScene) {
    try {
      hubHeart3D = new window.MissYou3DScene(hubBox, { hero: true, scaleMultiplier: 1.25 });
    } catch (e) {
      console.warn('Hub 3D Heart fallback:', e);
    }
  }

  if (hubBox) {
    hubBox.onclick = () => sendMissAction({ combo: missCombo + 1 });
  }

  await refreshMissYouHub();

  clearInterval(hubHeartbeatTimer);
  hubHeartbeatTimer = setInterval(async () => {
    if (modal.classList.contains('hidden')) {
      clearInterval(hubHeartbeatTimer);
      return;
    }
    try {
      const ping = await api('/api/widgets/miss-you/heartbeat', { method: 'POST' });
      updateHeartSyncUI(ping.synced);
    } catch {}
  }, 8000);
}

function closeMissYouHub() {
  const modal = $('#missYouModal');
  if (modal) modal.classList.add('hidden');
  clearInterval(hubHeartbeatTimer);
}

function updateHeartSyncUI(synced) {
  const beacon = $('#hubSyncBeacon');
  const txt = $('#hubSyncText');
  if (!beacon || !txt) return;

  if (synced) {
    beacon.classList.add('synced');
    txt.textContent = '✨ Canlı Çift Kalp ✨';
    if (hubHeart3D && typeof hubHeart3D.setHeartSync === 'function') hubHeart3D.setHeartSync(true);
    if (bentoHeart3D && typeof bentoHeart3D.setHeartSync === 'function') bentoHeart3D.setHeartSync(true);
  } else {
    beacon.classList.remove('synced');
    txt.textContent = 'Tekli Kalp';
    if (hubHeart3D && typeof hubHeart3D.setHeartSync === 'function') hubHeart3D.setHeartSync(false);
    if (bentoHeart3D && typeof bentoHeart3D.setHeartSync === 'function') bentoHeart3D.setHeartSync(false);
  }
}

async function refreshMissYouHub() {
  try {
    const data = await api('/api/widgets/miss-you/history');
    if ($('#hubSentCount')) $('#hubSentCount').textContent = data.sent || 0;
    if ($('#hubReceivedCount')) $('#hubReceivedCount').textContent = data.received || 0;

    const whisperBox = $('#hubPartnerWhisperBox');
    const whisperTxt = $('#hubPartnerWhisperText');
    const whisperTime = $('#hubPartnerWhisperTime');
    if (data.latestPartnerNote && whisperTxt) {
      whisperTxt.textContent = `"${data.latestPartnerNote.note}"`;
      const date = new Date(data.latestPartnerNote.at);
      whisperTime.textContent = `${data.partner?.name || 'Partnerin'} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      whisperBox?.classList.remove('hidden');
    }

    const heatmapContainer = $('#hubHeatmapBars');
    if (heatmapContainer) {
      heatmapContainer.innerHTML = '';
      const heatmap = data.heatmap || {};
      const counts = Object.values(heatmap).map(Number);
      const maxCount = Math.max(1, ...counts);
      const currentHour = new Date().getHours();

      for (let h = 0; h < 24; h++) {
        const count = Number(heatmap[h] || 0);
        const col = document.createElement('div');
        col.className = 'heatmap-bar-col';
        col.title = `Saat ${h < 10 ? '0' + h : h}:00 — ${count} Özlem`;

        const bar = document.createElement('div');
        bar.className = 'heatmap-bar' + (count > 0 ? ' active' : '') + (h === currentHour ? ' now' : '');
        const heightPct = count > 0 ? Math.max(15, Math.round((count / maxCount) * 100)) : 8;
        bar.style.height = `${heightPct}%`;

        const lbl = document.createElement('div');
        lbl.className = 'heatmap-label';
        lbl.textContent = (h % 4 === 0 || h === 23) ? `${h}` : '';

        col.appendChild(bar);
        col.appendChild(lbl);
        heatmapContainer.appendChild(col);
      }
    }

    updateHeartSyncUI(data.synced);
  } catch (err) {
    console.warn('Miss you hub yükleme hatası:', err);
  }
}

async function sendMissAction(options = {}) {
  const isBomb = !!options.isBomb || ((options.combo || 1) >= 10);
  const combo = options.combo || (missCombo + 1);
  const note = options.note || '';

  missCombo = combo;
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    missCombo = 0;
    const badge = $('.miss-you-combo-badge');
    if (badge) badge.remove();
  }, 2500);

  // Prosedürel Ses & Titreşim
  if (window.PawlyAudio) {
    if (isBomb) {
      window.PawlyAudio.soundLoveBomb();
      window.PawlyAudio.vibrateBomb();
    } else {
      window.PawlyAudio.soundHarpScale(missCombo);
      window.PawlyAudio.vibrateHeartbeat();
    }
  }

  // 3D Kalp Yay Pompası
  if (bentoHeart3D && typeof bentoHeart3D.triggerTapPulse === 'function') {
    bentoHeart3D.triggerTapPulse(1 + Math.min(missCombo, 20) * 0.08);
  }
  if (hubHeart3D && typeof hubHeart3D.triggerTapPulse === 'function') {
    hubHeart3D.triggerTapPulse(1 + Math.min(missCombo, 20) * 0.08);
  }

  // Yüzen Kalp Efektleri
  for (let i = 0; i < (isBomb ? 8 : 3); i++) {
    setTimeout(() => spawnHeart(null, null, note ? '💌' : (isBomb ? '💣' : '❤️')), i * 60);
  }
  triggerPetSquish();

  // Aşk Yağmuru FX (Love Rain)
  if (isBomb || [5, 10, 25, 50].includes(missCombo)) {
    triggerLoveRain(isBomb ? 70 : 40);
    toast(`${missCombo}x AŞK BOMBASI PATLADI! 💣❤️‍🔥`);
  } else if (missCombo > 1) {
    toast(`${missCombo}x AŞK KOMBOSU! 🔥`);
  }

  // Sayaçları güncelle
  const cnt = $('#missYouCount');
  if (cnt) cnt.textContent = parseInt(cnt.textContent || '0') + 1;
  const hubSent = $('#hubSentCount');
  if (hubSent) hubSent.textContent = parseInt(hubSent.textContent || '0') + 1;

  try {
    const res = await api('/api/widgets/miss-you', {
      method: 'POST',
      body: JSON.stringify({ combo: missCombo, note, isBomb })
    });
    if (cnt && res.count) cnt.textContent = res.count;
    if (hubSent && res.count) hubSent.textContent = res.count;
  } catch (e) {
    console.warn('Miss you post hatası:', e);
  }
}

// ==========================================================================
// FAZ 4: 2D FİZİKSEL ŞEKER KAVANOZU, LIVE DOODLE & TOGETHER CELEBRATION
// ==========================================================================

function initCandyJar2D(candies = []) {
  const canvas = $('#candyJarCanvas');
  if (!canvas) return;

  if (window.CandyJarPhysics) {
    if (candyJarPhysics) {
      candyJarPhysics.destroy();
      candyJarPhysics = null;
    }
    try {
      candyJarPhysics = new window.CandyJarPhysics(canvas);
      candyJarPhysics.loadCandies(candies);
    } catch (e) {
      console.warn('Candy Jar 2D motoru başlatılamadı:', e);
    }
  }
}

function showTogetherCelebration(msg) {
  const modal = $('#togetherModal');
  if (!modal) return;
  const sub = $('#togetherSubText');
  if (sub && msg) sub.textContent = msg;
  modal.classList.remove('hidden');
  triggerLoveRain(60);
}

function openDoodleModal() {
  const modal = $('#doodleModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const canvas = $('#doodleDrawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = currentDoodleColor;

  // Tuvali temizle ve beyaz arka plan ver
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  doodleStrokes = [];

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawingDoodle = true;
    const p = getPos(e);
    currentDoodleStroke = { color: currentDoodleColor, width: 4, points: [p] };
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const drawMove = (e) => {
    if (!isDrawingDoodle) return;
    e.preventDefault();
    const p = getPos(e);
    currentDoodleStroke.points.push(p);
    ctx.strokeStyle = currentDoodleColor;
    ctx.lineWidth = 4;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    if (!isDrawingDoodle) return;
    isDrawingDoodle = false;
    if (currentDoodleStroke.points && currentDoodleStroke.points.length) {
      doodleStrokes.push(currentDoodleStroke);
    }
    currentDoodleStroke = [];
  };

  canvas.onpointerdown = startDraw;
  canvas.onpointermove = drawMove;
  canvas.onpointerup = endDraw;
  canvas.onpointerleave = endDraw;
}

function closeDoodleModal() {
  const modal = $('#doodleModal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================================================
// FAZ 5: MACERA & KEŞİF, POLAROID & SEYAHAT ALBÜMÜ
// ==========================================================================

let availableDestinations = [];
let selectedDestinationId = 'tokyo';

async function openAdventureModal() {
  if (!activePet) return toast('Önce bir canavar seçmelisin!');
  if (!activePet.hatched) return toast('Yumurta henüz çatlamadı!');
  if (activePet.sleeping) return toast('Canavar uyurken seyahate çıkamaz!');
  if (activePet.adventure && !activePet.adventure.isFinished) {
    return toast('Canavar şu an zaten bir macerada!');
  }

  const modal = $('#adventureModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  try {
    const data = await api(`/api/pets/${activePet.id}/adventure`);
    availableDestinations = data.destinations || [];
    renderAdventureDestinations();
  } catch (err) {
    toast(err.message);
  }
}

function closeAdventureModal() {
  const modal = $('#adventureModal');
  if (modal) modal.classList.add('hidden');
}

function renderAdventureDestinations() {
  const list = $('#adventureDestList');
  if (!list) return;

  list.innerHTML = availableDestinations.map(d => `
    <div class="dest-choice-card ${d.id === selectedDestinationId ? 'selected' : ''}" data-dest-id="${d.id}">
      <div class="dest-card-main">
        <div class="dest-card-avatar">${d.stamp === 'tokyo' ? '🌸' : d.stamp === 'paris' ? '🗼' : d.stamp === 'istanbul' ? '🌉' : d.stamp === 'antalya' ? '🏖️' : '🗽'}</div>
        <div>
          <div class="dest-card-title">${esc(d.name)}</div>
          <div class="dest-card-city">📍 ${esc(d.city)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">🎁 Getireceği hediye: <b>${esc(d.item)}</b></div>
        </div>
      </div>
      <div class="dest-card-badge">
        <div class="dest-duration-pill">⏱️ ${d.displayDuration}</div>
        <div class="dest-xp-reward">+${d.xpReward} XP</div>
      </div>
    </div>
  `).join('');

  $$('.dest-choice-card').forEach(card => {
    card.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      $$('.dest-choice-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedDestinationId = card.dataset.destId;
    };
  });
}

async function startAdventure() {
  if (!activePet) return;
  const isFast = $('#checkFastAdventure')?.checked || false;

  try {
    if (window.PawlyAudio) window.PawlyAudio.soundAdventureStart();
    const res = await api(`/api/pets/${activePet.id}/adventure/start`, {
      method: 'POST',
      body: JSON.stringify({
        destinationId: selectedDestinationId,
        testFast: isFast
      })
    });
    closeAdventureModal();
    toast(res.toast || 'Canavar yola çıktı! 🎒');
    await loadPets();
    loadHomeBento();
  } catch (err) {
    toast(err.message);
  }
}

function showPolaroidModal(souvenir) {
  if (!souvenir) return;
  const modal = $('#souvenirPolaroidModal');
  if (!modal) return;

  const photoBg = $('#polaroidPhotoBg');
  if (photoBg) photoBg.style.background = souvenir.bgGradient || 'linear-gradient(135deg, #FFE5D9, #FFF1E6)';

  const stamp = $('#polaroidStamp');
  if (stamp) {
    stamp.innerHTML = `<span>${(souvenir.stamp || 'pawly').toUpperCase()}</span><span>★ 2026 ★</span>`;
  }

  const mascotWrap = $('#polaroidMascotWrap');
  if (mascotWrap && window.PawlyMascot) {
    mascotWrap.innerHTML = window.PawlyMascot.renderMascotSVG(souvenir.petSpecies || 'cat', 'happy', {
      hat: '👒',
      clothes: '👗'
    });
  }

  const itemBadge = $('#polaroidItemBadge');
  if (itemBadge) itemBadge.textContent = souvenir.item || '🎁 Hatıra';

  const locDate = $('#polaroidLocDate');
  if (locDate) locDate.textContent = `${souvenir.city || ''} • ${souvenir.date || ''}`;

  const caption = $('#polaroidCaptionText');
  if (caption) caption.textContent = `"${souvenir.caption || ''}"`;

  const footer = $('#polaroidFooterDetails');
  if (footer) footer.textContent = `Getiren: ${souvenir.broughtBy || souvenir.petName || 'Pawly'} 🐾 • Karşılayan: ${souvenir.welcomedBy || (typeof me !== 'undefined' && me ? me.name : 'Sen')} 💕`;

  modal.classList.remove('hidden');
}

function closePolaroidModal() {
  const modal = $('#souvenirPolaroidModal');
  if (modal) modal.classList.add('hidden');
}

async function openTravelAlbumModal() {
  if (!activePet) return toast('Önce bir canavar seçmelisin!');
  const modal = $('#travelAlbumModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  try {
    const data = await api(`/api/pets/${activePet.id}/adventure`);
    const souvenirs = data.souvenirs || [];
    const allDests = data.destinations || [
      { id: 'tokyo', name: 'Tokyo 🌸', stamp: 'tokyo' },
      { id: 'paris', name: 'Paris 🗼', stamp: 'paris' },
      { id: 'istanbul', name: 'İstanbul 🌉', stamp: 'istanbul' },
      { id: 'antalya', name: 'Antalya 🏖️', stamp: 'antalya' },
      { id: 'nyc', name: 'New York 🗽', stamp: 'nyc' }
    ];

    // Pasaport Damgalarını Göster
    const stampsRow = $('#passportStampsRow');
    const unlockedStamps = new Set(souvenirs.map(s => s.destinationId || s.stamp));
    if (stampsRow) {
      stampsRow.innerHTML = allDests.map(d => {
        const isUnlocked = unlockedStamps.has(d.id);
        const icon = d.id === 'tokyo' ? '🌸' : d.id === 'paris' ? '🗼' : d.id === 'istanbul' ? '🌉' : d.id === 'antalya' ? '🏖️' : '🗽';
        return `
          <div class="passport-stamp-badge ${isUnlocked ? 'unlocked' : 'locked'}" title="${d.name}">
            <span style="font-size:20px">${icon}</span>
            <span style="font-size:8px;font-weight:800">${d.id.toUpperCase()}</span>
          </div>
        `;
      }).join('');
    }

    const countSpan = $('#passportStampCount');
    if (countSpan) countSpan.textContent = `${unlockedStamps.size} / ${allDests.length} Damga`;

    // Polaroid Galeri Grid
    const grid = $('#travelAlbumGrid');
    if (grid) {
      if (souvenirs.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:30px 10px;color:var(--text-muted)">
            <div style="font-size:36px;margin-bottom:8px">🎒📸</div>
            <div style="font-weight:700;font-size:14px;color:var(--text-pure)">Henüz Hiç Seyahat Fotoğrafı Yok</div>
            <div style="font-size:12px;margin-top:4px">Canavarını ilk macerasına gönder, sana özel Polaroid fotoğraflar getirsin!</div>
          </div>
        `;
      } else {
        grid.innerHTML = souvenirs.map((s, idx) => `
          <div class="album-polaroid-mini" data-album-idx="${idx}" style="transform:rotate(${idx % 2 === 0 ? '-1.5deg' : '1.5deg'})">
            <div class="album-mini-thumb" style="background:${s.bgGradient || '#FFF3E6'}">
              <span>${s.item ? s.item.split(' ')[0] : '📸'}</span>
            </div>
            <div class="album-mini-title">${esc(s.destinationName || s.city || 'Hatıra')}</div>
            <div class="album-mini-date">${esc(s.date || '')}</div>
          </div>
        `).join('');

        $$('.album-polaroid-mini').forEach(item => {
          item.onclick = () => {
            const idx = Number(item.dataset.albumIdx);
            const s = souvenirs[idx];
            if (s) {
              if (window.PawlyAudio) window.PawlyAudio.soundCameraShutter();
              showPolaroidModal(s);
            }
          };
        });
      }
    }
  } catch (err) {
    toast(err.message);
  }
}

function closeTravelAlbumModal() {
  const modal = $('#travelAlbumModal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================================================
// FAZ 6: KİLİT EKRANI DUVAR KÂĞIDI & PWA
// ==========================================================================

let currentWallpaperTheme = 'sakura';

function openWallpaperModal() {
  const modal = $('#wallpaperModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  updateWallpaperPreview();
}

function closeWallpaperModal() {
  const modal = $('#wallpaperModal');
  if (modal) modal.classList.add('hidden');
}

function updateWallpaperPreview() {
  const canvas = $('#wallpaperPreviewCanvas');
  if (!canvas || !window.PawlyWallpaper) return;
  window.PawlyWallpaper.renderPreview(canvas, {
    theme: currentWallpaperTheme,
    petName: activePet ? activePet.name : 'Mochi',
    partnerName: partnerUser ? partnerUser.name : 'Alex',
    streakDays: (activePet && activePet.relationship) ? activePet.relationship.streakDays : 12,
    petSpecies: activePet ? activePet.species : 'cat'
  });
}

function downloadHdWallpaper() {
  if (!window.PawlyWallpaper) return;
  if (window.PawlyAudio) window.PawlyAudio.soundCameraShutter();
  toast('HD Kilit ekranı duvar kâğıdı hazırlanıp indiriliyor... 📸');
  window.PawlyWallpaper.downloadWallpaper({
    theme: currentWallpaperTheme,
    petName: activePet ? activePet.name : 'Mochi',
    partnerName: partnerUser ? partnerUser.name : 'Alex',
    streakDays: (activePet && activePet.relationship) ? activePet.relationship.streakDays : 12,
    petSpecies: activePet ? activePet.species : 'cat'
  });
}

// ==========================================================================
// RAHATLATICI ORTAM SESLERİ (COZY LO-FI AMBIENCE) & BÜYÜME GÜNLÜĞÜ
// ==========================================================================

function openAmbienceModal() {
  $('#ambienceModal')?.classList.remove('hidden');
  updateAmbienceUI();
}

function closeAmbienceModal() {
  $('#ambienceModal')?.classList.add('hidden');
}

function updateAmbienceUI() {
  const activeType = window.PawlyAudio ? window.PawlyAudio.getActiveAmbience() : null;
  $$('.ambience-card-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ambience === (activeType || 'off'));
  });
  const topbarBtn = $('#btnAmbienceToggle');
  if (topbarBtn) {
    topbarBtn.textContent = activeType === 'rain' ? '🌧️' : activeType === 'fire' ? '🔥' : activeType === 'musicbox' ? '🎶' : '🎵';
  }
}

function openPetDiaryModal() {
  if (!activePet) return toast('Önce bir canavar seçmelisin!');
  const modal = $('#petDiaryModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const list = $('#diaryTimelineList');
  if (!list) return;

  const milestones = [
    { icon: '🥚', title: 'Yumurta Sıcak Yuvaya Kondu', desc: `${activePet.name} için sevgi dolu bir yuva hazırlandı.`, date: activePet.createdAt ? new Date(activePet.createdAt).toLocaleDateString('tr-TR') : '1. Gün', xp: '+20 XP' },
    { icon: '🐣', title: 'İlk Çatlama ve Merhaba!', desc: activePet.hatched ? 'Kabuk çatladı ve dünyaya gözlerini açtı!' : 'Henüz kuluçkada ısınıyor...', date: activePet.hatched ? 'Çatladı' : 'Bekleniyor', xp: '+50 XP' },
    { icon: '🍓', title: 'İlk Lezzetli Öğün', desc: 'Mutfakta taze çilek ve süt ile karnını doyurdu.', date: 'Harika İştah', xp: '+25 XP' },
    { icon: '🫧', title: 'Köpüklü Banyo Keyfi', desc: 'Süngerle sabunlanıp mis kokulu baloncuklar çıkardı.', date: 'Pırıl Pırıl', xp: '+30 XP' }
  ];

  if (activePet.souvenirs && activePet.souvenirs.length > 0) {
    activePet.souvenirs.forEach(s => {
      milestones.push({
        icon: '🎒',
        title: `${s.destinationName || s.city} Macerası`,
        desc: `Seyahatten dönerken "${s.item}" hediyesini getirdi.`,
        date: s.date || 'Hatıra',
        xp: '+75 XP'
      });
    });
  }

  if (activePet.relationship) {
    milestones.push({
      icon: '🔥',
      title: `${activePet.relationship.streakDays} Günlük Sevgi Serisi`,
      desc: 'Partnerinle her gün düzenli canavar bakımı yapıldı!',
      date: 'Canlı Seri',
      xp: `+${activePet.relationship.streakDays * 10} XP`
    });
  }

  list.innerHTML = milestones.map(m => `
    <div class="diary-milestone-card">
      <div class="milestone-icon-bubble">${m.icon}</div>
      <div class="milestone-content" style="flex:1">
        <h4>${esc(m.title)}</h4>
        <p>${esc(m.desc)}</p>
        <div style="display:flex;justify-content:space-between">
          <span class="milestone-meta">📅 ${esc(m.date)}</span>
          <span style="font-size:10px;font-weight:800;color:var(--accent-mint)">${m.xp}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function closePetDiaryModal() {
  $('#petDiaryModal')?.classList.add('hidden');
}

function bindHomeEvents() {
  if ($('#btnMissYouHeart')) $('#btnMissYouHeart').onclick = () => sendMissAction();
  if ($('#missYouHeart3DBox')) $('#missYouHeart3DBox').onclick = () => sendMissAction();
  if ($('#btnSendMissYou')) $('#btnSendMissYou').onclick = () => sendMissAction();
  if ($('#btnOpenMissYouHub')) $('#btnOpenMissYouHub').onclick = openMissYouHub;

  // Candy Jar Drop with 2D Canvas Physics
  $$('.jar-mood-btn').forEach(btn => {
    btn.onclick = async () => {
      const { dropMood, emoji, color } = btn.dataset;
      if (window.PawlyAudio) window.PawlyAudio.soundBubble();
      spawnHeart(null, null, emoji);

      // 2D Fiziksel Şeker Düşürme
      if (candyJarPhysics) {
        candyJarPhysics.dropCandy({ mood: dropMood, emoji, color });
      }

      try {
        const res = await api('/api/widgets/jar/drop', {
          method: 'POST',
          body: JSON.stringify({ mood: dropMood, emoji, color })
        });
        toast('Kavanoza şeker attın! 🍬');
        const badge = $('#jarCountBadge');
        if (badge && res.candies) badge.textContent = `${res.candies.length} Şeker`;
      } catch (e) { toast(e.message); }
    };
  });

  // Location chips & Together Mode
  $$('.dist-chip').forEach(btn => {
    btn.onclick = async () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(520);
      if (btn.dataset.together) {
        if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
        showTogetherCelebration('✨ Mesafe 0 km! Birlikteyiz moduna geçildi! Sarılma zamanı! 💕');
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

  // Live Doodle Butonları
  if ($('#btnOpenDoodle')) $('#btnOpenDoodle').onclick = openDoodleModal;
  if ($('#btnDrawDoodle')) $('#btnDrawDoodle').onclick = openDoodleModal;
  if ($('#btnCloseDoodle')) $('#btnCloseDoodle').onclick = closeDoodleModal;
  if ($('#btnCloseTogether')) $('#btnCloseTogether').onclick = () => $('#togetherModal')?.classList.add('hidden');

  // Doodle Palet Seçimi
  $$('.doodle-color-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.doodle-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDoodleColor = btn.dataset.color || '#FF6584';
      const canvas = $('#doodleDrawCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = currentDoodleColor;
      }
    };
  });

  // Doodle Temizle
  if ($('#btnDoodleClear')) {
    $('#btnDoodleClear').onclick = () => {
      const canvas = $('#doodleDrawCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        doodleStrokes = [];
      }
    };
  }

  // Doodle Gönder
  if ($('#btnDoodleSend')) {
    $('#btnDoodleSend').onclick = async () => {
      const canvas = $('#doodleDrawCanvas');
      if (!canvas) return;
      const previewDataUrl = canvas.toDataURL('image/png', 0.85);

      try {
        if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
        toast('Aşk karalaman gönderiliyor... 🎨');
        await api('/api/widgets/doodle', {
          method: 'POST',
          body: JSON.stringify({
            strokes: doodleStrokes,
            previewDataUrl
          })
        });
        closeDoodleModal();
        toast('Karalaman partnerine ulaştı! 💕');
        loadHomeBento();
      } catch (e) {
        toast(e.message);
      }
    };
  }

  // Status pickers
  $$('.status-pick-item').forEach(btn => {
    btn.onclick = async () => {
      const { status, emoji, text } = btn.dataset;
      if (window.PawlyAudio) window.PawlyAudio.soundPop(650);
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
      if (window.PawlyAudio) window.PawlyAudio.soundHappy();
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
      if (window.PawlyAudio) window.PawlyAudio.soundPop(700);
      loadHomeBento();
      toast('Pano yenilendi 🔄');
    };
  }

  // Plant Sulama Eylemi
  if ($('#btnWaterPlant')) {
    $('#btnWaterPlant').onclick = async () => {
      if (window.PawlyAudio) window.PawlyAudio.soundBubble();
      spawnHeart(null, null, '💧');
      try {
        const res = await api('/api/widgets/plant/water', { method: 'POST' });
        toast(res.toast || 'Çiçek sulandı! 💧');
        if (res.bloomed && window.PawlyAudio) window.PawlyAudio.soundFanfare();
        loadHomeBento();
      } catch (e) { toast(e.message); }
    };
  }

  // Günün Çift Sorusu Gönderimi
  if ($('#btnSubmitDailyQA')) {
    $('#btnSubmitDailyQA').onclick = async () => {
      const input = $('#inputDailyQAAnswer');
      const answer = input ? input.value.trim() : '';
      if (!answer) return toast('Lütfen bir cevap yazın! 💌');
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      try {
        const res = await api('/api/widgets/daily-qa', {
          method: 'POST',
          body: JSON.stringify({ answer })
        });
        if (window.PawlyAudio) {
          if (res.revealed) window.PawlyAudio.soundFanfare();
          else window.PawlyAudio.soundHeart();
        }
        toast(res.toast || 'Cevabın kaydedildi! 💌');
        loadHomeBento();
      } catch (e) { toast(e.message); }
    };
  }
}

// ==========================================================================
// EKRAN 2: PET HOUSE & MİNİ-OYUNLAR (SCREENSHOT 2 & 3)
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
  if (!stage) return;

  if (window.PawlyRoomGame) {
    window.PawlyRoomGame.setupRoomStage(stage, activePet, currentRoom, async (act) => {
      if (activePet) await petCare(activePet.id, act);
    });
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
        if (window.PawlyAudio) window.PawlyAudio.soundPop(400);
        const res = await api(`/api/pets/${b.dataset.hatch}/hatch`, { method: 'POST' });
        if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
        toast(res.toast || 'Yumurtaya tıkladın! 🥚');
        loadPets();
      } catch (e) { toast(e.message); }
    };
  });
}

async function petCare(id, action) {
  try {
    let res;
    if (action === 'sleep') {
      res = await api(`/api/pets/${id}/sleep`, { method: 'POST' });
    } else if (action === 'hatch') {
      res = await api(`/api/pets/${id}/hatch`, { method: 'POST' });
    } else if (action === 'adventure_speedup') {
      res = await api(`/api/pets/${id}/adventure/speedup`, { method: 'POST' });
      toast('Seyahat hızlandırıldı! ⚡');
      await loadPets();
      return;
    } else if (action === 'adventure_claim') {
      res = await api(`/api/pets/${id}/adventure/claim`, { method: 'POST' });
      if (window.PawlyAudio) {
        window.PawlyAudio.soundDoorbell();
        setTimeout(() => window.PawlyAudio.soundCameraShutter(), 700);
      }
      if (res.souvenir) showPolaroidModal(res.souvenir);
      toast(res.toast || 'Hatıra fotoğrafı ve hediye albüme kaydedildi! 📸');
      await loadPets();
      return;
    } else if (action === 'adventure_finished') {
      await loadPets();
      return;
    } else {
      res = await api(`/api/pets/${id}/care`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
    }
    spawnHeart(null, null, '✨');
    triggerPetSquish();
    if (res && res.toast) toast(res.toast);
    await loadPets();
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

  const petSvg = window.PawlyMascot && activePet ?
    window.PawlyMascot.renderMascotSVG(activePet.species, 'happy', { hat: currentHat, clothes: currentClothes }) :
    '<div style="font-size:32px">🐱</div>';

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
        <div class="lockscreen-widget-rect" id="simWidgetKiss" style="cursor:pointer">
          <div style="width:36px;height:36px;flex-shrink:0">${petSvg}</div>
          <div style="font-size:10px;font-weight:700;line-height:1.2;color:#2D1E14">
            "Wait! I forgot to kiss you! 💋"
          </div>
        </div>

        <!-- Egg Hatch Circle Widget (Screenshot 3) -->
        <div class="lockscreen-widget-circle" id="simWidgetEgg" style="cursor:pointer">
          <span style="font-size:22px">🥚</span>
          <span style="font-size:8px;font-weight:700;color:#2D1E14;margin-top:2px">Hatch 20h</span>
        </div>
      </div>

      <!-- Kilit Ekranı Bildirim Kartı (Miss You) -->
      <div style="background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);border-radius:18px;padding:12px;margin-top:14px;border:1.5px solid rgba(255,255,255,0.8);cursor:pointer" id="simMissCard">
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
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <div style="width:50px;height:50px;flex-shrink:0">${petSvg}</div>
            <div style="font-size:11px;font-weight:600;color:#2D1E14;line-height:1.3">
              "Karnım tok, enerjim yerinde! Beni sevmeye devam et 💕"
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Simülatör widget tıklama sesleri
  screen.querySelectorAll('[id^="sim"]').forEach(el => {
    el.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      el.classList.add('squish-anim');
      setTimeout(() => el.classList.remove('squish-anim'), 300);
    };
  });

  // Dynamic Island Etkileşimi
  const island = $('#iphoneIsland');
  if (island) {
    island.onclick = (e) => {
      if (e.target.closest('#btnIslandClose')) {
        e.stopPropagation();
        island.classList.remove('expanded');
        return;
      }
      if (e.target.closest('#btnIslandPetLove')) {
        e.stopPropagation();
        if (window.PawlyAudio) window.PawlyAudio.soundHappy();
        spawnHeart(null, null, '💖');
        toast(`${activePet ? activePet.name : 'Mochi'} sevgini hissetti! 🥰`);
        return;
      }
      if (e.target.closest('#btnIslandPetFeed')) {
        e.stopPropagation();
        if (window.PawlyAudio) window.PawlyAudio.soundEat();
        spawnHeart(null, null, '🍓');
        toast(`${activePet ? activePet.name : 'Mochi'}'ye lezzetli çilek verdin! 😋`);
        return;
      }
      island.classList.toggle('expanded');
      if (window.PawlyAudio) window.PawlyAudio.soundBounce();
    };
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

    const codeEl = $('#myPairCode');
    if (codeEl) codeEl.textContent = codeData.pairCode || '------';

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

    const btnDemo = $('#btnConnectDemoPartner');
    if (btnDemo) {
      btnDemo.onclick = async () => {
        try {
          if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
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
  // Ses Aç/Kapat Butonu
  const btnSound = $('#btnSoundToggle');
  if (btnSound && window.PawlyAudio) {
    btnSound.textContent = window.PawlyAudio.isSoundEnabled() ? '🔊' : '🔇';
    btnSound.onclick = () => {
      const active = window.PawlyAudio.toggleSound();
      btnSound.textContent = active ? '🔊' : '🔇';
      if (active) window.PawlyAudio.soundPop(880);
      toast(active ? 'Oyun sesleri açıldı 🔊' : 'Oyun sesleri kapatıldı 🔇');
    };
  }

  // Tabbar butonları
  $$('#tabbar button').forEach(b => {
    b.onclick = () => showScreen(b.dataset.screen);
  });

  // Kilit / Ana Ekran Simülatör geçişi
  $$('[data-sim-mode]').forEach(b => {
    b.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      $$('[data-sim-mode]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentSimMode = b.dataset.simMode;
      renderPhoneSimulator();
    };
  });

  // Oda Sekmeleri (Screenshot 2)
  $$('#roomTabsBar .room-tab-btn').forEach(b => {
    b.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(550);
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
      if (window.PawlyAudio) window.PawlyAudio.soundPop(700);
      currentHat = b.dataset.outfitHat;
      localStorage.setItem('pawly_pet_hat', currentHat);
      toast('Şapka giyildi! 👒');
      renderPetHouse();
      loadHomeBento();
    };
  });

  $$('[data-outfit-clothes]').forEach(b => {
    b.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(700);
      currentClothes = b.dataset.outfitClothes;
      localStorage.setItem('pawly_pet_clothes', currentClothes);
      toast('Kıyafet giyildi! 👗');
      renderPetHouse();
      loadHomeBento();
    };
  });

  // Pet Bakım Butonları
  $$('#petCareActionsGrid .pet-care-btn').forEach(b => {
    b.onclick = async () => {
      if (!activePet) return;
      if (!b.dataset.petCare) return;
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      await petCare(activePet.id, b.dataset.petCare);
    };
  });

  // Faz 5: Macera & Polaroid & Seyahat Albümü Butonları
  if ($('#btnOpenAdventure')) $('#btnOpenAdventure').onclick = openAdventureModal;
  if ($('#btnCloseAdventure')) $('#btnCloseAdventure').onclick = closeAdventureModal;
  if ($('#btnStartAdventure')) $('#btnStartAdventure').onclick = startAdventure;
  if ($('#btnOpenTravelAlbum')) $('#btnOpenTravelAlbum').onclick = openTravelAlbumModal;
  if ($('#btnCloseTravelAlbum')) $('#btnCloseTravelAlbum').onclick = closeTravelAlbumModal;
  if ($('#btnClosePolaroid')) $('#btnClosePolaroid').onclick = closePolaroidModal;
  if ($('#btnViewAlbumFromPolaroid')) {
    $('#btnViewAlbumFromPolaroid').onclick = () => {
      closePolaroidModal();
      openTravelAlbumModal();
    };
  }

  // Faz 6: Duvar Kâğıdı Butonları
  if ($('#btnOpenWallpaperModal')) $('#btnOpenWallpaperModal').onclick = openWallpaperModal;
  if ($('#btnCloseWallpaper')) $('#btnCloseWallpaper').onclick = closeWallpaperModal;
  if ($('#btnDownloadWallpaper')) $('#btnDownloadWallpaper').onclick = downloadHdWallpaper;

  $$('#wallpaperThemePicker button').forEach(btn => {
    btn.onclick = () => {
      if (window.PawlyAudio) window.PawlyAudio.soundPop(600);
      $$('#wallpaperThemePicker button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWallpaperTheme = btn.dataset.wpTheme || 'sakura';
      updateWallpaperPreview();
    };
  });

  // Büyüme Günlüğü Butonları
  if ($('#btnOpenPetDiary')) $('#btnOpenPetDiary').onclick = openPetDiaryModal;
  if ($('#btnClosePetDiary')) $('#btnClosePetDiary').onclick = closePetDiaryModal;

  // Rahatlatıcı Ortam Sesleri (Ambience) Butonları
  if ($('#btnAmbienceToggle')) $('#btnAmbienceToggle').onclick = openAmbienceModal;
  if ($('#btnCloseAmbience')) $('#btnCloseAmbience').onclick = closeAmbienceModal;

  $$('.ambience-card-btn').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.ambience;
      if (window.PawlyAudio) {
        if (type === 'off') {
          window.PawlyAudio.stopAmbience();
          toast('Ortam sesi kapatıldı 🔇');
        } else {
          window.PawlyAudio.startAmbience(type);
          const label = type === 'rain' ? 'Yumuşak Yağmur 🌧️' : type === 'fire' ? 'Sıcak Şömine 🔥' : 'Lofi Müzik Kutusu 🎶';
          toast(`${label} çalıyor...`);
        }
      }
      updateAmbienceUI();
    };
  });

  // Yeni Yumurta Al
  if ($('#createPet')) {
    $('#createPet').onclick = async () => {
      const name = $('#petName').value.trim();
      const withUser = $('#petWith').value.trim();
      if (!name) return toast('Canavarına bir isim ver!');
      try {
        if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
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
      if (window.PawlyAudio) window.PawlyAudio.soundPop(800);
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
        if (window.PawlyAudio) window.PawlyAudio.soundFanfare();
        toast(res.message || 'Eşleşme başarıyla tamamlandı! 🎉');
        $('#inputPairCode').value = '';
        loadTogetherHub();
        loadHomeBento();
      } catch (err) { toast(err.message); }
    };
  }

  // Faz 2: Miss You Hub & Love Bomb Modal Butonları
  if ($('#btnCloseMissYouHub')) {
    $('#btnCloseMissYouHub').onclick = closeMissYouHub;
  }
  if ($('#btnCloseLoveBomb')) {
    $('#btnCloseLoveBomb').onclick = () => {
      $('#loveBombModal')?.classList.add('hidden');
    };
  }

  // Aşk Bombası Hızlı Fırlatıcıları (5x, 10x, 25x, 50x)
  $$('.btn-bomb-burst').forEach(btn => {
    btn.onclick = () => {
      const bombCount = Number(btn.dataset.bomb) || 10;
      sendMissAction({ combo: bombCount, isBomb: true });
    };
  });

  // Fısıltı Notu Çipleri
  $$('.whisper-chip').forEach(chip => {
    chip.onclick = () => {
      const note = chip.dataset.whisper;
      if ($('#inputWhisperNote')) $('#inputWhisperNote').value = note;
      sendMissAction({ note });
      toast(`"${note}" partnerine fısıldandı! 💌`);
    };
  });

  // Fısıltı Notu Gönder
  if ($('#btnSendWhisper')) {
    $('#btnSendWhisper').onclick = () => {
      const input = $('#inputWhisperNote');
      const note = (input ? input.value : '').trim();
      if (!note) return toast('Lütfen bir fısıltı notu yaz!');
      sendMissAction({ note });
      toast(`"${note}" partnerine fısıldandı! 💌`);
      if (input) input.value = '';
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
        if (window.PawlyAudio) window.PawlyAudio.soundHappy();
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

// PWA Service Worker Kaydı
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('PWA ServiceWorker kayıt hatası:', err);
    });
  });
}
