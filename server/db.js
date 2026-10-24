const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePairCode(existingUsers = []) {
  const usedCodes = new Set(existingUsers.map(u => u.pairCode).filter(Boolean));
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
    if (!usedCodes.has(code)) return code;
  }
  return `PW${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function fresh() {
  return {
    users: [],          // { username, name, color, passHash, widget, pairCode, isGuest, createdAt }
    friends: [],        // { a, b, since }   (a < b alfabetik)
    relationships: [],  // { id, a, b, type, status, streakDays, lastInteractionAt, createdAt }
    requests: [],       // { id, from, to, createdAt }
    pets: [],           // canavarlar
    messages: [],       // sohbetler
    doodles: [],        // çizimler
    interactions: [],   // { id, relId, sender, type, payload, createdAt }
    seq: 1
  };
}

// Eski bir db dosyası gelse bile tüm alanları garantiye alır
function migrate(d) {
  const base = fresh();
  Object.keys(base).forEach(k => { d[k] = d[k] || base[k]; });
  
  d.users.forEach(u => {
    u.widget = u.widget || { mood: null, todos: [], note: '', countdowns: [], stamps: [] };
    u.widget.todos = u.widget.todos || [];
    u.widget.countdowns = u.widget.countdowns || [];
    u.widget.stamps = u.widget.stamps || [];
    u.widget.missYou = typeof u.widget.missYou === 'number' ? u.widget.missYou : 0;
    u.widget.statusBubble = u.widget.statusBubble || { status: 'Mutlu 🥰', emoji: '🥰', text: 'Seni düşünüyorum!' };
    u.widget.sleep = u.widget.sleep || { hours: 7.5, quality: 'Excellent', weekly: [7, 8, 6.5, 7.5, 8, 7.5, 8] };
    u.widget.location = u.widget.location || { label: 'home', name: 'Evde 🏠' };
    u.widget.jarCandies = u.widget.jarCandies || [
      { id: 'c1', mood: 'love', color: '#FF7B90', emoji: '💖' },
      { id: 'c2', mood: 'happy', color: '#FFD166', emoji: '✨' },
      { id: 'c3', mood: 'calm', color: '#70D6BB', emoji: '🌿' }
    ];
    u.isGuest = !!u.isGuest;
    if (!u.pairCode) {
      u.pairCode = generatePairCode(d.users);
    }
  });

  d.pets.forEach(p => {
    p.stats = p.stats || { food: 60, water: 60, clean: 60, energy: 60, happy: 60 };
    p.poops = p.poops || [];
    p.hatchTaps = p.hatchTaps || [];
    p.cooldowns = p.cooldowns || {};
    p.logs = p.logs || [];
    p.relationshipId = p.relationshipId || null;
  });

  d.relationships = d.relationships || [];
  d.interactions = d.interactions || [];

  return d;
}

let db = null;

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) { db = migrate(fresh()); save(); return db; }
  try { db = migrate(JSON.parse(fs.readFileSync(FILE, 'utf8'))); }
  catch { db = migrate(fresh()); }
  return db;
}

function get() { return db || load(); }
function save() { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }
function nid(p) { return `${p}_${(db.seq++).toString(36)}${Date.now().toString(36)}`; }

module.exports = { load, get, save, nid, generatePairCode };
