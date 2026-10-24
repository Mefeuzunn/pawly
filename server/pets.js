const express = require('express');
const { get, save, nid } = require('./db');
const { requireAuth, publicUser } = require('./auth');
const { sendToPetOwners, sendToUser } = require('./events');

const router = express.Router();

const SPECIES = {
  blob:   { label: 'Blob',   color: '#ff7aa2', emoji: '🫧', desc: 'Neşeli ve yumuşacık damla' },
  dino:   { label: 'Dino',   color: '#3ddc97', emoji: '🦖', desc: 'Cesur minik yeşil dinozor' },
  bunny:  { label: 'Tavşan', color: '#ffc93c', emoji: '🐰', desc: 'Hızlı ve meraklı beyaz tavşan' },
  ghost:  { label: 'Hayalet',color: '#4cc9f0', emoji: '👻', desc: 'Sevimli ve yaramaz hayalet' },
  bear:   { label: 'Ayı',    color: '#c08457', emoji: '🐻', desc: 'Uykucu ve sıcakkanlı ayı' },
  cat:    { label: 'Kedi',   color: '#a78bfa', emoji: '🐱', desc: 'Mırıldayan zarif kedi' }
};

const STAGES = ['Yumurta', 'Yeni Doğan', 'Bebek', 'Çocuk', 'Genç', 'Yetişkin', 'Efsane'];
const STAGE_XP = [0, 20, 100, 250, 500, 900, 1500];

const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

// Deterministik zaman farkı (Delta-t) simülatörü
function tick(pet) {
  const now = Date.now();
  if (!pet.lastTick) pet.lastTick = now;
  const hrs = Math.min((now - pet.lastTick) / 3600000, 72);

  if (hrs > 0) {
    if (pet.sleeping) {
      // Uykudayken enerji hızla yenilenir, diğer ihtiyaçlar çok yavaş azalır
      pet.stats.energy = clamp(pet.stats.energy + hrs * 25);
      pet.stats.food = clamp(pet.stats.food - hrs * 1.5);
      pet.stats.water = clamp(pet.stats.water - hrs * 1.5);
      pet.stats.clean = clamp(pet.stats.clean - hrs * 1);
      if (pet.stats.energy >= 100) {
        pet.sleeping = false;
      }
    } else {
      // Uyanıkken normal tüketim
      pet.stats.food = clamp(pet.stats.food - hrs * 5);
      pet.stats.water = clamp(pet.stats.water - hrs * 6);
      pet.stats.clean = clamp(pet.stats.clean - hrs * 4);
      pet.stats.energy = clamp(pet.stats.energy - hrs * 3);

      // Mutluluk: Aç veya kirliyse daha hızlı düşer
      const penalty = (pet.stats.food < 40 || pet.stats.water < 40 || pet.stats.clean < 40) ? 7 : 3;
      pet.stats.happy = clamp(pet.stats.happy - hrs * penalty);

      // Temizlik 40'ın altına indikçe pislik oluşur (en fazla 4)
      if (pet.stats.clean < 50) {
        const pops = Math.floor(hrs / 6);
        for (let i = 0; i < pops && pet.poops.length < 4; i++) {
          pet.poops.push({ id: nid('pp'), at: now });
        }
      }
    }
    pet.lastTick = now;
  }

  // Ruh hali tespiti
  if (pet.stats.energy < 20) {
    pet.mood = 'uykulu';
  } else if (pet.stats.food < 25 || pet.stats.water < 25) {
    pet.mood = 'aç';
  } else if (pet.stats.clean < 25) {
    pet.mood = 'kirli';
  } else {
    const avg = (pet.stats.food + pet.stats.water + pet.stats.clean + pet.stats.energy + pet.stats.happy) / 5;
    pet.mood = avg > 75 ? 'mutlu' : avg > 50 ? 'iyi' : avg > 30 ? 'idare eder' : 'üzgün';
  }

  return pet;
}

function stageOf(pet) {
  let s = 0;
  STAGE_XP.forEach((x, i) => { if (pet.xp >= x) s = i; });
  return s;
}

function addLog(pet, user, action, label, xpGain = 0) {
  pet.logs = pet.logs || [];
  const oldStage = stageOf(pet);
  pet.xp += xpGain;
  const newStage = stageOf(pet);

  const logEntry = {
    id: nid('log'),
    actor: {
      username: user.username,
      name: user.name,
      color: user.color
    },
    action,
    label,
    xpGain,
    at: new Date().toISOString()
  };

  pet.logs.unshift(logEntry);
  if (pet.logs.length > 30) pet.logs = pet.logs.slice(0, 30);

  // Evrimleşti mi?
  if (newStage > oldStage) {
    pet.logs.unshift({
      id: nid('log'),
      actor: { username: 'pawly', name: 'Pawly', color: '#ff7aa2' },
      action: 'evolve',
      label: `🎉 ${pet.name} evrimleşti ve ${STAGES[newStage]} evresine ulaştı!`,
      xpGain: 0,
      at: new Date().toISOString()
    });
  }

  return logEntry;
}

function touchRelationshipStreak(pet) {
  if (!pet.relationshipId) return;
  const db = get();
  const rel = (db.relationships || []).find(r => r.id === pet.relationshipId);
  if (!rel) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const lastDate = rel.lastInteractionAt ? new Date(rel.lastInteractionAt).toISOString().slice(0, 10) : '';

  if (lastDate !== todayStr) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastDate === yesterday) {
      rel.streakDays = (rel.streakDays || 1) + 1;
    } else if (lastDate && lastDate < yesterday) {
      rel.streakDays = 1;
    }
  }
  rel.lastInteractionAt = now.toISOString();
}

function viewPet(pet, me) {
  tick(pet);
  const db = get();
  const st = stageOf(pet);
  const nextXp = STAGE_XP[st + 1] || null;
  const prevXp = STAGE_XP[st] || 0;
  const stageProgress = nextXp ? Math.min(100, Math.round(((pet.xp - prevXp) / (nextXp - prevXp)) * 100)) : 100;

  // Kullanıcının bekleme süreleri (Cooldown)
  const remainingCooldowns = {};
  if (me) {
    Object.keys(ACTIONS).forEach(act => {
      const last = (pet.cooldowns || {})[`${me.username}:${act}`] || 0;
      const cdSeconds = ACTIONS[act].cd;
      const passed = Math.floor((Date.now() - last) / 1000);
      remainingCooldowns[act] = Math.max(0, cdSeconds - passed);
    });
  }

  // Bağlı ilişki (varsa)
  let relationship = null;
  if (pet.relationshipId) {
    const rel = (db.relationships || []).find(r => r.id === pet.relationshipId);
    if (rel) {
      relationship = {
        id: rel.id,
        type: rel.type,
        streakDays: rel.streakDays || 1
      };
    }
  }

  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    speciesInfo: SPECIES[pet.species] || SPECIES.blob,
    owners: pet.owners.map(o => publicUser(db.users.find(u => u.username === o))),
    isOwner: me ? pet.owners.includes(me.username) : false,
    stats: pet.stats,
    poops: pet.poops.length,
    poopList: pet.poops,
    sleeping: pet.sleeping,
    xp: pet.xp,
    level: Math.floor(pet.xp / 100) + 1,
    stage: st,
    stageName: STAGES[st],
    nextStageXp: nextXp,
    stageProgress,
    hatched: pet.hatched,
    hatchProgress: pet.hatchTaps ? pet.hatchTaps.length : 1,
    hatchNeeded: pet.owners.length,
    mood: pet.mood,
    logs: (pet.logs || []).slice(0, 15),
    relationship,
    remainingCooldowns,
    createdAt: pet.createdAt
  };
}

function myPets(me) {
  const db = get();
  return (db.pets || [])
    .filter(p => p.owners.includes(me.username))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => viewPet(p, me));
}

// --- Yeni Canavar / Yumurta Oluştur (Bireysel veya Ortak) ---
router.post('/', requireAuth, (req, res) => {
  const db = get();
  const { name, species, withUser, relationshipId } = req.body || {};
  const n = String(name || '').trim().slice(0, 24);
  if (!n) return res.status(400).json({ error: 'Canavarına sevimli bir isim ver' });
  if (!SPECIES[species]) return res.status(400).json({ error: 'Geçersiz canavar türü' });

  const owners = [req.user.username];
  let targetRel = null;

  if (relationshipId) {
    targetRel = (db.relationships || []).find(r => r.id === relationshipId && r.status === 'active');
    if (!targetRel || (targetRel.a !== req.user.username && targetRel.b !== req.user.username)) {
      return res.status(404).json({ error: 'Aktif eşleşme bulunamadı' });
    }
    const partner = targetRel.a === req.user.username ? targetRel.b : targetRel.a;
    owners.push(partner);
  } else if (withUser) {
    const other = String(withUser).toLowerCase().trim();
    const u = db.users.find(x => x.username === other);
    if (!u) return res.status(404).json({ error: 'Arkadaş bulunamadı' });
    if (other === req.user.username) return res.status(400).json({ error: 'Kendinle ortak canavar olmaz' });

    // İlişki var mı?
    targetRel = (db.relationships || []).find(r => 
      ((r.a === req.user.username && r.b === other) || (r.a === other && r.b === req.user.username)) && r.status === 'active'
    );
    owners.push(other);
  }

  const pet = {
    id: nid('pet'),
    name: n,
    species,
    owners,
    relationshipId: targetRel ? targetRel.id : null,
    stats: { food: 75, water: 75, clean: 75, energy: 80, happy: 80 },
    poops: [],
    sleeping: false,
    xp: 0,
    hatched: false,
    hatchTaps: [req.user.username],
    cooldowns: {},
    logs: [],
    lastTick: Date.now(),
    mood: 'iyi',
    createdAt: new Date().toISOString()
  };

  // Tek kişilikse hemen çatlar; eşli ise diğer tarafın tıklaması beklenir
  if (pet.hatchTaps.length >= owners.length) {
    pet.hatched = true;
    pet.xp = 20;
    addLog(pet, req.user, 'hatch', `${pet.name} yumurtadan çıktı! 🐣`, 20);
  } else {
    addLog(pet, req.user, 'create', `${req.user.name} ortak bir yumurta bıraktı 🥚`, 0);
  }

  db.pets = db.pets || [];
  db.pets.push(pet);

  if (targetRel) {
    targetRel.sharedPetId = pet.id;
    touchRelationshipStreak(pet);
  }

  save();

  // Realtime bildirim
  sendToPetOwners(pet, 'pet:created', {
    pet: viewPet(pet, req.user),
    message: `${req.user.name} yeni bir canavar yumurtası oluşturdu! 🥚`
  });

  res.json({
    ok: true,
    pet: viewPet(pet, req.user),
    pets: myPets(req.user)
  });
});

// --- Yumurtayı Tıkla (Co-Parenting Çatlatma) ---
router.post('/:id/hatch', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });
  if (pet.hatched) return res.status(400).json({ error: 'Bu yumurta zaten çatladı' });

  pet.hatchTaps = pet.hatchTaps || [];
  if (!pet.hatchTaps.includes(req.user.username)) {
    pet.hatchTaps.push(req.user.username);
  }

  let toastMsg = 'Yumurtaya tıkladın! Diğer sahip bekleniyor 🥚';
  if (pet.hatchTaps.length >= pet.owners.length) {
    pet.hatched = true;
    pet.xp = 20;
    addLog(pet, req.user, 'hatch', `${pet.name} başarıyla çatladı ve dünyaya geldi! 🐣`, 20);
    touchRelationshipStreak(pet);
    toastMsg = '🎉 Tebrikler! Yumurtanız çatladı ve canavarınız doğdu!';
  } else {
    addLog(pet, req.user, 'tap', `${req.user.name} yumurtayı tıklattı 🥚`, 5);
  }

  save();

  sendToPetOwners(pet, 'pet:updated', {
    pet: viewPet(pet, req.user),
    toast: toastMsg
  });

  res.json({
    ok: true,
    pet: viewPet(pet, req.user),
    pets: myPets(req.user),
    toast: toastMsg
  });
});

// --- Bakım Eylemleri (Feed, Water, Clean, Pet, Play) ---
const ACTIONS = {
  feed:  { stat: 'food',  amount: 25, happyBonus: 5,  xp: 15, cd: 15, label: 'lezzetli mama verdi 🍓' },
  water: { stat: 'water', amount: 25, happyBonus: 5,  xp: 12, cd: 15, label: 'taptaze su içirdi 💧' },
  clean: { stat: 'clean', amount: 35, happyBonus: 5,  xp: 15, cd: 20, label: 'köpüklü banyo yaptırdı 🫧' },
  pet:   { stat: 'happy', amount: 20, happyBonus: 0,  xp: 10, cd: 5,  label: 'canavarı sevip okşadı 🤗' },
  play:  { stat: 'happy', amount: 25, happyBonus: 0,  costEnergy: 10, xp: 20, cd: 25, label: 'eğlenceli oyun oynadı 🎾' }
};

router.post('/:id/care', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });
  if (!pet.hatched) return res.status(400).json({ error: 'Önce yumurtayı çatlatmalısınız' });

  const action = req.body.action;
  const a = ACTIONS[action];
  if (!a) return res.status(400).json({ error: 'Geçersiz bakım işlemi' });

  tick(pet);

  // Uykudayken sadece sevme ve uyandırma yapılabilir
  if (pet.sleeping && action !== 'pet') {
    return res.status(400).json({ error: 'Canavar şu an mışıl mışıl uyuyor 💤' });
  }

  // Cooldown kontrolü
  pet.cooldowns = pet.cooldowns || {};
  const key = `${req.user.username}:${action}`;
  const last = pet.cooldowns[key] || 0;
  const passed = Math.floor((Date.now() - last) / 1000);
  if (passed < a.cd) {
    return res.status(429).json({ 
      error: `Biraz bekle (${a.cd - passed} sn kaldı)`,
      remainingSeconds: a.cd - passed
    });
  }
  pet.cooldowns[key] = Date.now();

  // Stat güncellemeleri
  pet.stats[a.stat] = clamp(pet.stats[a.stat] + a.amount);
  if (a.happyBonus) pet.stats.happy = clamp(pet.stats.happy + a.happyBonus);
  if (a.costEnergy) pet.stats.energy = clamp(pet.stats.energy - a.costEnergy);

  // Log ekle ve streak dokun
  const logEntry = addLog(pet, req.user, action, `${req.user.name} ${a.label}`, a.xp);
  touchRelationshipStreak(pet);
  pet.lastTick = Date.now();

  save();

  const formattedPet = viewPet(pet, req.user);

  // Realtime Event: Tüm sahiplere bildir
  sendToPetOwners(pet, 'pet:action', {
    petId: pet.id,
    action,
    actor: publicUser(req.user),
    toast: `${req.user.name} ${a.label}`,
    pet: formattedPet
  });

  res.json({
    ok: true,
    pet: formattedPet,
    pets: myPets(req.user),
    toast: `Harika! ${a.label}`
  });
});

// --- Anlık Canlı Dokunma / Sevme Dürtmesi (Realtime Haptic Tap) ---
router.post('/:id/tap', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });

  tick(pet);
  pet.stats.happy = clamp(pet.stats.happy + 2);
  pet.xp += 1;
  save();

  // Partnere anlık zıplama ve kalp fırlatma olayı yolla
  sendToPetOwners(pet, 'pet:tap', {
    petId: pet.id,
    actor: publicUser(req.user),
    at: new Date().toISOString()
  });

  res.json({ ok: true, happy: pet.stats.happy });
});

// --- Pislik Temizleme ---
router.post('/:id/clean-poop', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });
  if (!pet.poops || pet.poops.length === 0) return res.status(400).json({ error: 'Ortalık tertemiz!' });

  const count = pet.poops.length;
  pet.poops = [];
  pet.stats.clean = clamp(pet.stats.clean + count * 15);
  addLog(pet, req.user, 'clean-poop', `${req.user.name} etrafı tertemiz yaptı 🧹`, count * 5);
  touchRelationshipStreak(pet);
  save();

  sendToPetOwners(pet, 'pet:updated', {
    pet: viewPet(pet, req.user),
    toast: `${req.user.name} etrafı süpürdü ve temizledi! 🧹`
  });

  res.json({
    ok: true,
    pet: viewPet(pet, req.user),
    pets: myPets(req.user),
    toast: 'Etraf tertemiz oldu ✨'
  });
});

// --- Uyku Modu (Aç / Kapat) ---
router.post('/:id/sleep', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });

  pet.sleeping = !pet.sleeping;
  pet.lastTick = Date.now();
  const stateMsg = pet.sleeping ? `${req.user.name} canavarı uyuttu 💤` : `${req.user.name} canavarı uyandırdı ☀️`;
  addLog(pet, req.user, pet.sleeping ? 'sleep' : 'wake', stateMsg, 5);
  save();

  sendToPetOwners(pet, 'pet:updated', {
    pet: viewPet(pet, req.user),
    toast: stateMsg
  });

  res.json({
    ok: true,
    pet: viewPet(pet, req.user),
    pets: myPets(req.user),
    toast: stateMsg
  });
});

// --- Canavar Detayı ve Günlüğü ---
router.get('/:id', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Bu canavara erişiminiz yok' });

  res.json({ pet: viewPet(pet, req.user) });
});

// --- İsim Değiştir ---
router.put('/:id', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (!pet.owners.includes(req.user.username)) return res.status(403).json({ error: 'Senin canavarın değil' });

  const n = String(req.body.name || '').trim().slice(0, 24);
  if (n) {
    pet.name = n;
    addLog(pet, req.user, 'rename', `${req.user.name} canavarın adını "${n}" yaptı 🏷`, 0);
  }
  save();

  sendToPetOwners(pet, 'pet:updated', { pet: viewPet(pet, req.user) });
  res.json({ ok: true, pet: viewPet(pet, req.user) });
});

// --- Sil ---
router.delete('/:id', requireAuth, (req, res) => {
  const db = get();
  const pet = db.pets.find(p => p.id === req.params.id);
  if (!pet) return res.status(404).json({ error: 'Canavar bulunamadı' });
  if (pet.owners[0] !== req.user.username) return res.status(403).json({ error: 'Sadece oluşturan kişi silebilir' });

  db.pets = db.pets.filter(p => p.id !== pet.id);
  save();

  res.json({ ok: true, pets: myPets(req.user) });
});

// --- Canavarlarım Listesi ---
router.get('/', requireAuth, (req, res) => {
  res.json({
    pets: myPets(req.user),
    species: SPECIES,
    stages: STAGES
  });
});

module.exports = router;
