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

module.exports = router;
