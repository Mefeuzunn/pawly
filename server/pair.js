const express = require('express');
const { get, save, nid, generatePairCode } = require('./db');
const { requireAuth, publicUser } = require('./auth');

const router = express.Router();

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function formatRelationship(rel, currentUser) {
  const db = get();
  const partnerUsername = rel.a === currentUser.username ? rel.b : rel.a;
  const partnerUser = db.users.find(u => u.username === partnerUsername);
  
  // Ortak canavar var mı?
  const sharedPet = (db.pets || []).find(p => 
    p.owners && p.owners.includes(currentUser.username) && p.owners.includes(partnerUsername)
  );

  return {
    id: rel.id,
    type: rel.type || 'best_friend',
    status: rel.status || 'active',
    streakDays: rel.streakDays || 1,
    lastInteractionAt: rel.lastInteractionAt,
    createdAt: rel.createdAt,
    partner: publicUser(partnerUser),
    sharedPet: sharedPet ? { id: sharedPet.id, name: sharedPet.name, species: sharedPet.species, stage: sharedPet.stage || 0 } : null
  };
}

// Kendi eşleşme kodunu getir
router.get('/my-code', requireAuth, (req, res) => {
  const user = req.user;
  if (!user.pairCode) {
    user.pairCode = generatePairCode(get().users);
    save();
  }
  res.json({
    pairCode: user.pairCode,
    username: user.username,
    name: user.name,
    color: user.color,
    shareText: `🐾 Pawly'de benimle eşleş ve ortak widget'larımızı büyüt! Eşleşme kodum: ${user.pairCode}`
  });
});

// Yeni eşleşme kodu oluştur (eskiyi geçersiz kıl)
router.post('/regenerate-code', requireAuth, (req, res) => {
  const db = get();
  req.user.pairCode = generatePairCode(db.users);
  save();
  res.json({
    ok: true,
    pairCode: req.user.pairCode
  });
});

// Kod ön izleme (Kullanıcı kiminle eşleşeceğini görsün)
router.get('/preview/:code', requireAuth, (req, res) => {
  const db = get();
  const code = String(req.params.code || '').trim().toUpperCase();
  const target = db.users.find(u => u.pairCode === code);
  if (!target) return res.status(404).json({ error: 'Bu koda ait kullanıcı bulunamadı' });
  if (target.username === req.user.username) {
    return res.status(400).json({ error: 'Kendi kodunuzu girdiniz' });
  }

  res.json({
    ok: true,
    target: {
      name: target.name,
      color: target.color,
      pairCode: target.pairCode
    }
  });
});

// Eşleşme kodunu girerek bağlan (Pairing)
router.post('/connect', requireAuth, (req, res) => {
  const db = get();
  const rawCode = String(req.body.code || '').trim().toUpperCase();
  const requestedType = String(req.body.type || 'best_friend').toLowerCase();
  const allowedTypes = ['couple', 'best_friend', 'friend'];
  const relType = allowedTypes.includes(requestedType) ? requestedType : 'best_friend';

  if (!rawCode) return res.status(400).json({ error: 'Lütfen bir eşleşme kodu girin' });

  const target = db.users.find(u => u.pairCode === rawCode);
  if (!target) return res.status(404).json({ error: 'Geçersiz eşleşme kodu' });
  if (target.username === req.user.username) {
    return res.status(400).json({ error: 'Kendi kodunuzla eşleşemezsiniz' });
  }

  const [u1, u2] = [req.user.username, target.username].sort();

  // Zaten aktif bir ilişki var mı?
  let existing = (db.relationships || []).find(r => r.a === u1 && r.b === u2 && r.status === 'active');
  if (existing) {
    return res.status(400).json({ 
      error: 'Bu kullanıcıyla zaten eşleştiniz',
      relationship: formatRelationship(existing, req.user)
    });
  }

  // Yeni ilişki oluştur
  const now = new Date().toISOString();
  const rel = {
    id: nid('rel'),
    a: u1,
    b: u2,
    type: relType,
    status: 'active',
    streakDays: 1,
    lastInteractionAt: now,
    createdAt: now
  };

  db.relationships = db.relationships || [];
  db.relationships.push(rel);

  // Geriye dönük uyumluluk: db.friends listesine de ekle
  db.friends = db.friends || [];
  const hasFriend = db.friends.some(f => (f.a === u1 && f.b === u2) || (f.a === u2 && f.b === u1));
  if (!hasFriend) {
    db.friends.push({ a: u1, b: u2, since: now });
  }

  // Varsa bekleyen arkadaşlık isteklerini temizle
  db.requests = (db.requests || []).filter(r => 
    !((r.from === u1 && r.to === u2) || (r.from === u2 && r.to === u1))
  );

  save();

  res.json({
    ok: true,
    message: `${target.name} ile başarıyla eşleştiniz! 🎉`,
    relationship: formatRelationship(rel, req.user)
  });
});

// Kullanıcının tüm aktif eşleşmelerini getir
router.get('/relationships', requireAuth, (req, res) => {
  const db = get();
  const myUsername = req.user.username;
  const list = (db.relationships || [])
    .filter(r => (r.a === myUsername || r.b === myUsername) && r.status === 'active')
    .map(r => formatRelationship(r, req.user));

  res.json({ relationships: list });
});

// İlişki tipini güncelle (örn. 'friend' -> 'couple')
router.put('/relationship/:id', requireAuth, (req, res) => {
  const db = get();
  const relId = req.params.id;
  const { type } = req.body || {};
  const allowedTypes = ['couple', 'best_friend', 'friend'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Geçersiz ilişki türü' });
  }

  const rel = (db.relationships || []).find(r => r.id === relId);
  if (!rel) return res.status(404).json({ error: 'İlişki bulunamadı' });

  if (rel.a !== req.user.username && rel.b !== req.user.username) {
    return res.status(403).json({ error: 'Bu ilişkiyi düzenleme yetkiniz yok' });
  }

  rel.type = type;
  save();

  res.json({ ok: true, relationship: formatRelationship(rel, req.user) });
});

// İlişkiyi sonlandır / kaldır
router.delete('/relationship/:id', requireAuth, (req, res) => {
  const db = get();
  const relId = req.params.id;
  const rel = (db.relationships || []).find(r => r.id === relId);
  if (!rel) return res.status(404).json({ error: 'İlişki bulunamadı' });

  if (rel.a !== req.user.username && rel.b !== req.user.username) {
    return res.status(403).json({ error: 'Bu ilişkiyi silme yetkiniz yok' });
  }

  rel.status = 'ended';
  save();

  res.json({ ok: true, message: 'İlişki sonlandırıldı' });
});

// Demo partner ile anında eşleş (Hızlı test ve inceleme için)
router.post('/demo', requireAuth, (req, res) => {
  const db = get();
  let alex = db.users.find(u => u.username === 'alex_demo');
  if (!alex) {
    alex = {
      username: 'alex_demo',
      name: 'Alex 💕',
      color: '#FF6584',
      passHash: 'demo_hash',
      pairCode: 'ALEX01',
      isGuest: false,
      widget: {
        mood: '🥰',
        moodDate: new Date().toISOString().slice(0, 10),
        missYou: 999,
        missYouReceived: 420,
        statusBubble: { status: 'Seni Düşünüyor 💭', emoji: '🥰', text: 'Kahve molasındayım, seni özledim!' },
        sleep: { hours: 8.2, quality: 'Good', weekly: [7.5, 8.0, 7.8, 8.2, 8.5, 7.9, 8.2] },
        location: { label: 'cafe', name: 'Kafede ☕' },
        jarCandies: [
          { id: 'c1', mood: 'love', color: '#FF7B90', emoji: '💖' },
          { id: 'c2', mood: 'happy', color: '#FFD166', emoji: '✨' },
          { id: 'c3', mood: 'calm', color: '#70D6BB', emoji: '🌿' }
        ],
        todos: [{ id: 't1', text: 'Pawly canavarını besle 🍓', done: true, createdAt: new Date().toISOString() }],
        note: 'Seni çok seviyorum canım! 💕',
        countdowns: [{ id: 'cd1', title: 'Yıldönümümüz 🎉', date: '2026-12-31' }],
        stamps: [{ id: 'paris', at: new Date().toISOString() }]
      },
      createdAt: new Date().toISOString()
    };
    db.users.push(alex);
  }

  // Kullanıcıya da başlangıç değerleri ver
  req.user.widget.missYou = Math.max(req.user.widget.missYou || 0, 999);
  req.user.widget.sleep = req.user.widget.sleep || { hours: 7.5, quality: 'Excellent', weekly: [7, 7.5, 8, 6.5, 7.5, 8, 7.5] };
  req.user.widget.location = req.user.widget.location || { label: 'home', name: 'Evde 🏠' };

  // Arkadaş yap
  const [u1, u2] = [req.user.username, 'alex_demo'].sort();
  if (!db.friends.some(f => f.a === u1 && f.b === u2)) {
    db.friends.push({ a: u1, b: u2, since: new Date().toISOString() });
  }

  // İlişki kur
  let rel = (db.relationships || []).find(r => r.a === u1 && r.b === u2 && r.status === 'active');
  if (!rel) {
    rel = {
      id: nid('rel'),
      a: u1,
      b: u2,
      type: 'couple',
      status: 'active',
      streakDays: 12,
      lastInteractionAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.relationships = db.relationships || [];
    db.relationships.push(rel);
  } else {
    rel.streakDays = 12;
  }

  // Ortak pet var mı? Yoksa sevimli bir Kedi (Ponçik) oluştur
  let sharedPet = (db.pets || []).find(p => p.owners && p.owners.includes(req.user.username) && p.owners.includes('alex_demo'));
  if (!sharedPet) {
    sharedPet = {
      id: nid('pet'),
      name: 'Ponçik 🐱',
      species: 'cat',
      owners: [req.user.username, 'alex_demo'],
      relationshipId: rel.id,
      stats: { food: 85, water: 80, clean: 90, energy: 85, happy: 95 },
      poops: [],
      sleeping: false,
      xp: 320,
      hatched: true,
      hatchTaps: [req.user.username, 'alex_demo'],
      cooldowns: {},
      logs: [
        { id: nid('log'), actor: { username: 'alex_demo', name: 'Alex 💕', color: '#FF6584' }, action: 'feed', label: 'Alex lezzetli mama verdi 🍓', at: new Date(Date.now() - 3600000).toISOString() },
        { id: nid('log'), actor: { username: req.user.username, name: req.user.name, color: req.user.color }, action: 'pet', label: `${req.user.name} canavarı sevip okşadı 🤗`, at: new Date().toISOString() }
      ],
      lastTick: Date.now(),
      mood: 'mutlu',
      createdAt: new Date().toISOString()
    };
    db.pets = db.pets || [];
    db.pets.push(sharedPet);
    rel.sharedPetId = sharedPet.id;
  }

  save();
  res.json({
    ok: true,
    message: 'Alex 💕 ile başarıyla eşleştiniz!',
    relationship: formatRelationship(rel, req.user),
    pet: sharedPet
  });
});

module.exports = router;
