const express = require('express');
const { get, save, nid } = require('./db');
const { requireAuth, publicUser } = require('./auth');

const router = express.Router();

function pairKey(a, b) { return [a, b].sort().join('|'); }

// İki kullanıcı arasındaki arkadaşlığı döndürür, yoksa null
function findFriendship(x, y) {
  const key = pairKey(x, y);
  return get().friends.find(f => pairKey(f.a, f.b) === key) || null;
}

// --- Arkadaşlık isteği gönder ---
router.post('/request', requireAuth, (req, res) => {
  const db = get();
  const to = String(req.body.username || '').trim().toLowerCase();
  if (!db.users.some(u => u.username === to)) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  if (to === req.user.username) return res.status(400).json({ error: 'Kendine istek gönderilemez' });
  if (findFriendship(req.user.username, to)) return res.status(400).json({ error: 'Zaten arkadaşsınız' });
  const already = db.requests.find(r =>
    (r.from === req.user.username && r.to === to) || (r.from === to && r.to === req.user.username));
  if (already) return res.status(400).json({ error: 'Bekleyen bir istek var' });

  db.requests.push({ id: nid('r'), from: req.user.username, to, createdAt: new Date().toISOString() });
  save();
  res.json({ ok: true });
});

// --- Gelen istekleri kabul et / reddet ---
router.post('/respond', requireAuth, (req, res) => {
  const db = get();
  const { requestId, accept } = req.body || {};
  const i = db.requests.findIndex(r => r.id === requestId && r.to === req.user.username);
  if (i < 0) return res.status(404).json({ error: 'İstek bulunamadı' });
  const [r] = db.requests.splice(i, 1);
  if (accept) db.friends.push({ a: r.from, b: r.to, since: new Date().toISOString() });
  save();
  res.json({ ok: true, accepted: !!accept });
});

// --- Arkadaşlarım ---
router.get('/', requireAuth, (req, res) => {
  const db = get();
  const list = db.friends
    .filter(f => f.a === req.user.username || f.b === req.user.username)
    .map(f => {
      const other = f.a === req.user.username ? f.b : f.a;
      const u = db.users.find(x => x.username === other);
      // Arkadaşın en canlı canavarı (varsa)
      const pet = db.pets
        .filter(p => p.owners.includes(other))
        .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0] || null;
      return { user: publicUser(u), since: f.since, pet: pet ? { name: pet.name, mood: pet.mood } : null };
    });
  const incoming = db.requests.filter(r => r.to === req.user.username).map(r => ({ ...r, fromInfo: publicUser(db.users.find(u => u.username === r.from)) }));
  res.json({ friends: list, incoming });
});

// --- Kullanıcı ara ---
router.get('/search', requireAuth, (req, res) => {
  const db = get();
  const q = String(req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ users: [] });
  const users = db.users
    .filter(u => u.username !== req.user.username &&
      (u.username.includes(q) || u.name.toLowerCase().includes(q)))
    .slice(0, 8)
    .map(u => {
      const st = findFriendship(req.user.username, u.username) ? 'friends'
        : db.requests.some(r => r.from === req.user.username && r.to === u.username) ? 'sent' : 'none';
      return { ...publicUser(u), status: st };
    });
  res.json({ users });
});

module.exports = router;
