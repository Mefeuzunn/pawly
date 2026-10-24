const express = require('express');
const { get, save, nid } = require('./db');
const { requireAuth, publicUser } = require('./auth');
const { sendToUser } = require('./events');

const router = express.Router();

function getActivePartner(user) {
  const db = get();
  const rel = (db.relationships || []).find(r => 
    (r.a === user.username || r.b === user.username) && r.status === 'active'
  );
  if (!rel) return null;
  const partnerUsername = rel.a === user.username ? rel.b : rel.a;
  return db.users.find(u => u.username === partnerUsername) || null;
}

const MOODS = ['😀', '🥰', '😐', '😢', '😡', '😴', '🤩', '🤒'];
const STAMPS = [
  { id: 'paris', label: 'Paris', flag: '🇫🇷' }, { id: 'tokyo', label: 'Tokyo', flag: '🇯🇵' },
  { id: 'nyc', label: 'New York', flag: '🇺🇸' }, { id: 'rome', label: 'Roma', flag: '🇮🇹' },
  { id: 'istanbul', label: 'İstanbul', flag: '🇹🇷' }, { id: 'london', label: 'Londra', flag: '🇬🇧' },
  { id: 'sydney', label: 'Sidney', flag: '🇦🇺' }, { id: 'cairo', label: 'Kahire', flag: '🇪🇬' }
];

// --- Panoyu getir ---
router.get('/', requireAuth, (req, res) => {
  const w = req.user.widget;
  const today = new Date().toISOString().slice(0, 10);
  const defaultLayout = ['pet', 'streak', 'mood', 'todos', 'note', 'countdown', 'stamps'];
  res.json({
    widget: {
      mood: w.mood, moodDate: w.moodDate || null,
      todos: w.todos, note: w.note,
      countdowns: w.countdowns,
      stamps: w.stamps, allStamps: STAMPS,
      layout: w.layout || defaultLayout
    },
    moods: MOODS
  });
});

// --- Bento Yerleşimini Kaydet ---
router.put('/layout', requireAuth, (req, res) => {
  const { layout } = req.body || {};
  if (Array.isArray(layout)) {
    req.user.widget.layout = layout.slice(0, 15);
    save();
  }
  res.json({ ok: true, layout: req.user.widget.layout });
});

// --- Ruh hali seç (günde 1) ---
router.post('/mood', requireAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const w = req.user.widget;
  if (w.moodDate === today) return res.status(400).json({ error: 'Bugünün ruh halini zaten seçtin' });
  if (!MOODS.includes(req.body.mood)) return res.status(400).json({ error: 'Geçersiz ruh hali' });
  w.mood = req.body.mood;
  w.moodDate = today;
  save();
  res.json({ mood: w.mood, moodDate: w.moodDate });
});

// --- Not ---
router.put('/note', requireAuth, (req, res) => {
  req.user.widget.note = String(req.body.note || '').slice(0, 280);
  save();
  res.json({ note: req.user.widget.note });
});

// --- Yapılacaklar ---
router.post('/todos', requireAuth, (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 80);
  if (!text) return res.status(400).json({ error: 'Boş görev' });
  const t = { id: nid('t'), text, done: false, createdAt: new Date().toISOString() };
  req.user.widget.todos.unshift(t);
  req.user.widget.todos = req.user.widget.todos.slice(0, 20);
  save();
  res.json({ todos: req.user.widget.todos });
});
router.put('/todos/:id', requireAuth, (req, res) => {
  const t = req.user.widget.todos.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Yok' });
  t.done = !t.done;
  save();
  res.json({ todos: req.user.widget.todos });
});
router.delete('/todos/:id', requireAuth, (req, res) => {
  req.user.widget.todos = req.user.widget.todos.filter(x => x.id !== req.params.id);
  save();
  res.json({ todos: req.user.widget.todos });
});

// --- Geri sayım ---
router.post('/countdowns', requireAuth, (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 40);
  const date = String(req.body.date || '');
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Başlık ve tarih gerekli' });
  const c = { id: nid('c'), title, date, createdAt: new Date().toISOString() };
  req.user.widget.countdowns.push(c);
  req.user.widget.countdowns = req.user.widget.countdowns.slice(0, 10);
  save();
  res.json({ countdowns: req.user.widget.countdowns });
});
router.delete('/countdowns/:id', requireAuth, (req, res) => {
  req.user.widget.countdowns = req.user.widget.countdowns.filter(x => x.id !== req.params.id);
  save();
  res.json({ countdowns: req.user.widget.countdowns });
});

// --- Pasaport damgası ---
router.post('/stamps', requireAuth, (req, res) => {
  const st = STAMPS.find(s => s.id === req.body.id);
  if (!st) return res.status(400).json({ error: 'Geçersiz damga' });
  if (req.user.widget.stamps.some(s => s.id === st.id)) return res.status(400).json({ error: 'Bu damgan zaten var' });
  req.user.widget.stamps.push({ id: st.id, at: new Date().toISOString() });
  save();
  res.json({ stamps: req.user.widget.stamps });
});

// ==========================================================================
// WIDGETABLE ÖZEL SOSYAL WIDGET'LARI
// ==========================================================================

// In-memory dual presence map for Heart Sync (username -> timestamp)
const missYouPresences = new Map();

// 1. Miss You Widget (Özlemini Gönder, Kombo, Aşk Bombası ve Fısıltı Notu)
router.post('/miss-you', requireAuth, (req, res) => {
  req.user.widget.missYou = (req.user.widget.missYou || 0) + 1;
  const partner = getActivePartner(req.user);
  const now = new Date();
  const hour = now.getHours();

  const combo = Math.max(1, Number(req.body && req.body.combo) || 1);
  const isBomb = !!(req.body && req.body.isBomb) || (combo >= 10);
  const note = String((req.body && req.body.note) || '').trim().slice(0, 100);

  const entry = {
    id: nid('m'),
    from: req.user.username,
    fromName: req.user.name,
    to: partner ? partner.username : null,
    combo,
    isBomb,
    note,
    at: now.toISOString(),
    hour
  };

  // Geçmişi kaydet (son 50 kayıt)
  req.user.widget.missHistory = req.user.widget.missHistory || [];
  req.user.widget.missHistory.push(entry);
  if (req.user.widget.missHistory.length > 50) req.user.widget.missHistory = req.user.widget.missHistory.slice(-50);

  // Saatlik ısı haritasını güncelle
  req.user.widget.missHeatmap = req.user.widget.missHeatmap || {};
  req.user.widget.missHeatmap[hour] = (req.user.widget.missHeatmap[hour] || 0) + 1;

  if (partner) {
    partner.widget.missYouReceived = (partner.widget.missYouReceived || 0) + 1;
    partner.widget.missHistory = partner.widget.missHistory || [];
    partner.widget.missHistory.push(entry);
    if (partner.widget.missHistory.length > 50) partner.widget.missHistory = partner.widget.missHistory.slice(-50);

    partner.widget.missHeatmap = partner.widget.missHeatmap || {};
    partner.widget.missHeatmap[hour] = (partner.widget.missHeatmap[hour] || 0) + 1;

    // Aşk Bombası SSE olayı
    if (isBomb) {
      sendToUser(partner.username, 'widget:love_bomb', {
        from: publicUser(req.user),
        combo,
        note,
        toast: `${req.user.name} sana ${combo}x Aşk Bombası fırlattı! 💣❤️`
      });
    }

    // Normal Özlem Bildirimi
    sendToUser(partner.username, 'widget:miss_you', {
      from: publicUser(req.user),
      count: req.user.widget.missYou,
      combo,
      note,
      isBomb,
      toast: note ? `${req.user.name}: "${note}" ❤️` : `${req.user.name} sana kocaman bir özlem gönderdi! ❤️`
    });
  }

  save();
  res.json({ ok: true, count: req.user.widget.missYou, entry });
});

router.get('/miss-you', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  res.json({
    sent: req.user.widget.missYou || 0,
    received: req.user.widget.missYouReceived || 0,
    partner: partner ? publicUser(partner) : null
  });
});

// 1.B Miss You Geçmiş & Saatlik Isı Haritası
router.get('/miss-you/history', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  const history = req.user.widget.missHistory || [];
  const heatmap = req.user.widget.missHeatmap || {};

  // Partnerin son fısıltı notunu bul
  const partnerNotes = (partner && partner.widget.missHistory ? partner.widget.missHistory : [])
    .filter(h => h.from === (partner ? partner.username : '') && h.note);
  const latestPartnerNote = partnerNotes.length ? partnerNotes[partnerNotes.length - 1] : null;

  // Çift kalp senkronu kontrolü (son 18 saniyede partner aktif mi?)
  const partnerLastSeen = partner ? (missYouPresences.get(partner.username) || 0) : 0;
  const synced = partner ? (Date.now() - partnerLastSeen < 18000) : false;

  res.json({
    sent: req.user.widget.missYou || 0,
    received: req.user.widget.missYouReceived || 0,
    history: history.slice(-20),
    heatmap,
    latestPartnerNote,
    synced,
    partner: partner ? publicUser(partner) : null
  });
});

// 1.C Miss You Çift Varlık Kalp Atışı (Realtime Dual Heart Sync)
router.post('/miss-you/heartbeat', requireAuth, (req, res) => {
  missYouPresences.set(req.user.username, Date.now());
  const partner = getActivePartner(req.user);
  const partnerLastSeen = partner ? (missYouPresences.get(partner.username) || 0) : 0;
  const synced = partner ? (Date.now() - partnerLastSeen < 18000) : false;

  if (synced && partner) {
    sendToUser(partner.username, 'widget:heart_sync', {
      synced: true,
      partner: publicUser(req.user)
    });
  }

  res.json({
    ok: true,
    synced: !!synced,
    partner: partner ? publicUser(partner) : null
  });
});

// 2. Mesafe & Konum Durumu Widget'ı (Distance Widget)
router.post('/distance', requireAuth, (req, res) => {
  const { location, distanceKm, together } = req.body || {};
  if (location) req.user.widget.location = location;
  const partner = getActivePartner(req.user);

  let currentDist = typeof distanceKm === 'number' ? distanceKm : 5.3;
  let isTogether = !!together || (currentDist <= 0.1);

  if (partner) {
    sendToUser(partner.username, 'widget:distance', {
      partner: publicUser(req.user),
      location: req.user.widget.location,
      distanceKm: currentDist,
      together: isTogether
    });

    if (isTogether) {
      sendToUser(partner.username, 'widget:together', {
        partner: publicUser(req.user),
        toast: `✨ ${req.user.name} ile Birlikteyiz moduna geçildi! 💕`
      });
    }
  }
  save();
  res.json({
    ok: true,
    distanceKm: currentDist,
    together: isTogether,
    myLocation: req.user.widget.location,
    partnerLocation: partner ? partner.widget.location : null
  });
});

router.get('/distance', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  res.json({
    distanceKm: 5.3,
    together: false,
    myLocation: req.user.widget.location || { label: 'home', name: 'Evde 🏠' },
    partnerLocation: partner ? (partner.widget.location || { label: 'work', name: 'İşte 🏢' }) : null,
    partner: partner ? publicUser(partner) : null
  });
});

// 3. Uyku Takibi (Me vs Partner Sleep VS Widget & 7 Günlük Düello)
router.post('/sleep', requireAuth, (req, res) => {
  const { hours, quality, weekly } = req.body || {};
  const currentHours = typeof hours === 'number' ? hours : 7.5;
  const currentWeekly = Array.isArray(weekly) && weekly.length === 7 ? weekly : [7.2, 7.5, 8.0, 6.5, 7.5, 8.2, currentHours];

  req.user.widget.sleep = {
    hours: currentHours,
    quality: quality || 'Excellent',
    weekly: currentWeekly,
    updatedAt: new Date().toISOString()
  };
  const partner = getActivePartner(req.user);
  if (partner) {
    sendToUser(partner.username, 'widget:sleep', {
      partner: publicUser(req.user),
      sleep: req.user.widget.sleep
    });
  }
  save();
  res.json({ ok: true, sleep: req.user.widget.sleep });
});

router.get('/sleep', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  const meSleep = req.user.widget.sleep || {
    hours: 7.5,
    quality: 'Excellent',
    weekly: [7.2, 7.8, 6.5, 7.5, 8.0, 7.5, 7.5]
  };
  const partnerSleep = partner ? (partner.widget.sleep || {
    hours: 6.2,
    quality: 'Good',
    weekly: [6.0, 6.5, 5.8, 6.2, 7.0, 6.5, 6.2]
  }) : {
    hours: 8.0,
    quality: 'Great',
    weekly: [7.5, 8.0, 8.0, 7.0, 8.5, 8.0, 8.0]
  };

  // 7 Günlük Galip Hesabı (Altın Kupa 🏆)
  const meSum = meSleep.weekly.reduce((a, b) => a + b, 0);
  const partnerSum = partnerSleep.weekly.reduce((a, b) => a + b, 0);
  let winner = 'tie';
  if (meSum > partnerSum + 1) winner = 'me';
  else if (partnerSum > meSum + 1) winner = 'partner';

  let caringAdvice = 'İkiniz de dengeli dinleniyorsunuz! 🌙';
  if (partnerSleep.hours < 6.5) {
    caringAdvice = `${partner ? partner.name : 'Partnerin'} bu gece az uyumuş, ona bir papatya çayı gönder ☕`;
  } else if (meSleep.hours < 6.5) {
    caringAdvice = 'Bu gece biraz erken uyumayı dene, sağlığın çok önemli 💕';
  }

  res.json({
    me: meSleep,
    partner: partnerSleep,
    partnerUser: partner ? publicUser(partner) : null,
    winner,
    days: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    advice: caringAdvice
  });
});

// 4. Duygu Kavanozu (Mood Jar Widget & 2D Fizik Verisi)
router.post('/jar/drop', requireAuth, (req, res) => {
  const { mood, color, emoji } = req.body || {};
  const candy = {
    id: nid('j'),
    mood: mood || 'happy',
    color: color || '#FFCAD4',
    emoji: emoji || '✨',
    sender: req.user.username,
    senderName: req.user.name,
    at: new Date().toISOString()
  };
  req.user.widget.jarCandies = req.user.widget.jarCandies || [];
  req.user.widget.jarCandies.push(candy);
  if (req.user.widget.jarCandies.length > 60) {
    req.user.widget.jarCandies = req.user.widget.jarCandies.slice(-60);
  }

  const partner = getActivePartner(req.user);
  if (partner) {
    partner.widget.jarCandies = partner.widget.jarCandies || [];
    partner.widget.jarCandies.push(candy);
    if (partner.widget.jarCandies.length > 60) partner.widget.jarCandies = partner.widget.jarCandies.slice(-60);
    sendToUser(partner.username, 'widget:jar', {
      candy,
      toast: `${req.user.name} kavanoza yeni bir duygu şekeri attı! 🍬`
    });
  }
  save();
  res.json({ ok: true, candies: req.user.widget.jarCandies, candy });
});

router.get('/jar', requireAuth, (req, res) => {
  res.json({
    candies: req.user.widget.jarCandies || []
  });
});

// 5. Anlık Durum Balonu (Status Bubble: Pooping, Hungry, Sleeping...)
router.post('/status', requireAuth, (req, res) => {
  const { status, emoji, text } = req.body || {};
  req.user.widget.statusBubble = {
    status: status || 'Mutlu 🥰',
    emoji: emoji || '🥰',
    text: text || 'Seni düşünüyorum!',
    at: new Date().toISOString()
  };
  const partner = getActivePartner(req.user);
  if (partner) {
    sendToUser(partner.username, 'widget:status', {
      partner: publicUser(req.user),
      statusBubble: req.user.widget.statusBubble
    });
  }
  save();
  res.json({ ok: true, statusBubble: req.user.widget.statusBubble });
});

router.get('/status', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  res.json({
    me: req.user.widget.statusBubble,
    partner: partner ? partner.widget.statusBubble : null,
    partnerUser: partner ? publicUser(partner) : null
  });
});

// 6. Canlı Ortak Karalama & Çizim (Live Doodle Widget)
router.post('/doodle', requireAuth, (req, res) => {
  const { strokes, previewDataUrl } = req.body || {};
  const doodle = {
    id: nid('d'),
    from: req.user.username,
    fromName: req.user.name,
    strokes: Array.isArray(strokes) ? strokes.slice(0, 500) : [],
    previewDataUrl: typeof previewDataUrl === 'string' ? previewDataUrl.slice(0, 100000) : null,
    at: new Date().toISOString()
  };

  req.user.widget.doodle = doodle;
  const partner = getActivePartner(req.user);
  if (partner) {
    partner.widget.doodle = doodle;
    sendToUser(partner.username, 'widget:doodle', {
      doodle,
      from: publicUser(req.user),
      toast: `${req.user.name} sana yeni bir aşk karalaması çizdi! 🎨`
    });
  }

  save();
  res.json({ ok: true, doodle });
});

router.get('/doodle', requireAuth, (req, res) => {
  const partner = getActivePartner(req.user);
  const doodle = req.user.widget.doodle || (partner ? partner.widget.doodle : null);
  res.json({
    doodle,
    partner: partner ? publicUser(partner) : null
  });
});

module.exports = router;
