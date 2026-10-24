const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, save, nid, generatePairCode } = require('./db');

const SECRET = process.env.JWT_SECRET || 'pawly-secret-2026';

function publicUser(u) {
  if (!u) return null;
  const db = get();
  return {
    username: u.username,
    name: u.name,
    color: u.color,
    pairCode: u.pairCode || null,
    isGuest: !!u.isGuest,
    friends: db.friends.filter(f => f.a === u.username || f.b === u.username).length,
    relationships: (db.relationships || []).filter(r => (r.a === u.username || r.b === u.username) && r.status === 'active').length
  };
}

function sign(u) { return jwt.sign({ username: u.username }, SECRET, { expiresIn: '90d' }); }

function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Giriş gerekli' });
  try {
    const payload = jwt.verify(token, SECRET);
    const u = get().users.find(x => x.username === payload.username);
    if (!u) return res.status(401).json({ error: 'Kullanıcı yok' });
    req.user = u;
    next();
  } catch { return res.status(401).json({ error: 'Oturum geçersiz' }); }
}

function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) {
    try {
      const p = jwt.verify(token, SECRET);
      req.user = get().users.find(x => x.username === p.username) || null;
    } catch { req.user = null; }
  }
  next();
}

const router = express.Router();
const COLORS = ['#ff7aa2', '#7c5cff', '#3ddc97', '#ffc93c', '#4cc9f0', '#ff9f1c'];

router.post('/register', (req, res) => {
  const db = get();
  let { username, name, password } = req.body || {};
  username = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  name = String(name || '').trim().slice(0, 30);
  password = String(password || '');
  if (username.length < 3) return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı' });
  if (!name) return res.status(400).json({ error: 'İsim gerekli' });
  if (password.length < 4) return res.status(400).json({ error: 'Şifre en az 4 karakter olmalı' });
  if (db.users.some(u => u.username === username)) return res.status(400).json({ error: 'Bu kullanıcı adı alınmış' });

  const pairCode = generatePairCode(db.users);
  const user = {
    username, name, color: COLORS[username.length % COLORS.length],
    passHash: bcrypt.hashSync(password, 10),
    pairCode,
    isGuest: false,
    widget: { mood: null, todos: [], note: '', countdowns: [], stamps: [] },
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  save();
  res.json({ token: sign(user), user: publicUser(user) });
});

router.post('/guest', (req, res) => {
  const db = get();
  const guestHex = Math.random().toString(36).substring(2, 7);
  const username = `guest_${guestHex}`;
  const pairCode = generatePairCode(db.users);
  const user = {
    username,
    name: `Misafir #${pairCode.slice(0, 4)}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    passHash: bcrypt.hashSync(Math.random().toString(36), 8),
    pairCode,
    isGuest: true,
    widget: { mood: null, todos: [], note: '', countdowns: [], stamps: [] },
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  save();
  res.json({ token: sign(user), user: publicUser(user) });
});

router.post('/convert-guest', requireAuth, (req, res) => {
  const db = get();
  const oldUser = req.user;
  if (!oldUser.isGuest) {
    return res.status(400).json({ error: 'Bu hesap zaten kayıtlı bir hesaptır' });
  }

  let { username, name, password } = req.body || {};
  username = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  name = String(name || '').trim().slice(0, 30);
  password = String(password || '');

  if (username.length < 3) return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı' });
  if (!name) return res.status(400).json({ error: 'İsim gerekli' });
  if (password.length < 4) return res.status(400).json({ error: 'Şifre en az 4 karakter olmalı' });
  if (db.users.some(u => u.username === username && u.username !== oldUser.username)) {
    return res.status(400).json({ error: 'Bu kullanıcı adı alınmış' });
  }

  const oldUsername = oldUser.username;

  // Bilgileri güncelle
  oldUser.username = username;
  oldUser.name = name;
  oldUser.passHash = bcrypt.hashSync(password, 10);
  oldUser.isGuest = false;

  // İlişkili tüm verilerde eski kullanıcı adını güncelle
  (db.friends || []).forEach(f => {
    if (f.a === oldUsername) f.a = username;
    if (f.b === oldUsername) f.b = username;
  });
  (db.relationships || []).forEach(r => {
    if (r.a === oldUsername) r.a = username;
    if (r.b === oldUsername) r.b = username;
  });
  (db.requests || []).forEach(r => {
    if (r.from === oldUsername) r.from = username;
    if (r.to === oldUsername) r.to = username;
  });
  (db.pets || []).forEach(p => {
    p.owners = (p.owners || []).map(o => o === oldUsername ? username : o);
  });
  (db.messages || []).forEach(m => {
    if (m.from === oldUsername) m.from = username;
    if (m.to === oldUsername) m.to = username;
  });
  (db.interactions || []).forEach(it => {
    if (it.sender === oldUsername) it.sender = username;
  });

  save();
  res.json({ token: sign(oldUser), user: publicUser(oldUser) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = get().users.find(x => x.username === String(username || '').trim().toLowerCase());
  if (!u || !bcrypt.compareSync(String(password || ''), u.passHash))
    return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  res.json({ token: sign(u), user: publicUser(u) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/me', requireAuth, (req, res) => {
  const { name, color } = req.body || {};
  if (name && name.trim()) req.user.name = name.trim().slice(0, 30);
  if (color && /^#[0-9a-f]{6}$/i.test(color)) req.user.color = color;
  save();
  res.json({ user: publicUser(req.user) });
});

module.exports = { router, requireAuth, optionalAuth, publicUser };
