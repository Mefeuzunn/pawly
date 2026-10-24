const express = require('express');
const { get, save, nid } = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();

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

module.exports = router;
