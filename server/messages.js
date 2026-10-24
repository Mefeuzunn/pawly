const express = require('express');
const { get, save, nid } = require('./db');
const { requireAuth, publicUser } = require('./auth');

const router = express.Router();

const STICKERS = ['🐶', '🐱', '💖', '🌸', '⭐', '😂', '🥺', '🎉', '💤', '🍕', '🌈', '🦋'];

function convoKey(a, b) { return [a, b].sort().join('|'); }

// --- Konuşma listesi ---
router.get('/conversations', requireAuth, (req, res) => {
  const db = get();
  const me = req.user.username;
  const map = {};
  db.messages
    .filter(m => m.from === me || m.to === me)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(m => {
      const other = m.from === me ? m.to : m.from;
      if (!map[other]) map[other] = m;
    });
  const conversations = Object.entries(map).map(([u, last]) => ({
    user: publicUser(db.users.find(x => x.username === u)),
    lastMessage: { text: last.text, kind: last.kind, from: last.from, createdAt: last.createdAt },
    unread: db.messages.filter(m => m.from === u && m.to === me && !m.read).length
  }));
  res.json({ conversations, stickers: STICKERS });
});

// --- Mesajları getir ---
router.get('/:username', requireAuth, (req, res) => {
  const db = get();
  const me = req.user.username;
  const other = req.params.username.toLowerCase();
  const msgs = db.messages
    .filter(m => (m.from === me && m.to === other) || (m.from === other && m.to === me))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-80);
  // okundu işaretle
  db.messages.forEach(m => { if (m.from === other && m.to === me) m.read = true; });
  save();
  res.json({ messages: msgs.map(m => ({ ...m, mine: m.from === me })), stickers: STICKERS });
});

// --- Mesaj gönder (metin, sticker veya çizim) ---
router.post('/:username', requireAuth, (req, res) => {
  const db = get();
  const me = req.user.username;
  const other = req.params.username.toLowerCase();
  if (!db.users.some(u => u.username === other)) return res.status(404).json({ error: 'Kullanıcı yok' });

  const kind = ['text', 'sticker', 'doodle'].includes(req.body.kind) ? req.body.kind : 'text';
  let text = String(req.body.text || '').trim();
  if (kind === 'sticker') {
    if (!STICKERS.includes(text)) return res.status(400).json({ error: 'Geçersiz sticker' });
  } else if (kind === 'doodle') {
    // doodle kaydı: base64 dataURL (sınır: 300KB)
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(text)) return res.status(400).json({ error: 'Geçersiz çizim' });
    if (text.length > 400000) return res.status(400).json({ error: 'Çizim çok büyük' });
    const d = { id: nid('d'), from: me, to: other, data: text, createdAt: new Date().toISOString() };
    db.doodles.push(d);
    text = d.id;
  } else {
    if (!text) return res.status(400).json({ error: 'Boş mesaj' });
    text = text.slice(0, 500);
  }

  const m = { id: nid('m'), from: me, to: other, kind, text, read: false, createdAt: new Date().toISOString() };
  db.messages.push(m);
  save();
  res.json({ message: { ...m, mine: true } });
});

// --- Çizimi getir ---
router.get('/doodle/:id', requireAuth, (req, res) => {
  const d = get().doodles.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Yok' });
  if (d.from !== req.user.username && d.to !== req.user.username) return res.status(403).json({ error: 'Yetkin yok' });
  res.json({ doodle: d });
});

module.exports = router;
