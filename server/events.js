const express = require('express');
const jwt = require('jsonwebtoken');
const { get } = require('./db');

const SECRET = process.env.JWT_SECRET || 'pawly-secret-2026';
const router = express.Router();

// Aktif SSE bağlantıları: Map<username, Set<res>>
const activeClients = new Map();

function addClient(username, res) {
  if (!activeClients.has(username)) {
    activeClients.set(username, new Set());
  }
  activeClients.get(username).add(res);
}

function removeClient(username, res) {
  if (activeClients.has(username)) {
    const set = activeClients.get(username);
    set.delete(res);
    if (set.size === 0) activeClients.delete(username);
  }
}

// Belirli bir kullanıcıya SSE olayı gönder
function sendToUser(username, type, payload) {
  const set = activeClients.get(username);
  if (!set || set.size === 0) return 0;
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(message);
    } catch {
      removeClient(username, res);
    }
  }
  return set.size;
}

// Canavarın tüm sahiplerine olay gönder (örn. beslendiğinde)
function sendToPetOwners(pet, type, payload) {
  if (!pet || !pet.owners) return;
  pet.owners.forEach(u => {
    const username = typeof u === 'string' ? u : (u && u.username);
    if (username) sendToUser(username, type, payload);
  });
}

// Bir ilişkinin taraflarına olay gönder
function sendToRelationship(rel, type, payload) {
  if (!rel) return;
  sendToUser(rel.a, type, payload);
  sendToUser(rel.b, type, payload);
}

// SSE Bağlantı Noktası: GET /api/events
router.get('/', (req, res) => {
  // Token'ı query veya header'dan al
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) {
    return res.status(401).json({ error: 'Oturum token gerekli' });
  }

  let username = null;
  try {
    const payload = jwt.verify(token, SECRET);
    username = payload.username;
  } catch {
    return res.status(401).json({ error: 'Geçersiz oturum' });
  }

  // SSE Başlıkları
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  addClient(username, res);

  // İlk bağlantı teyidi
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, username, connectedAt: new Date().toISOString() })}\n\n`);

  // Canlı tutma (Heartbeat) - 25 saniyede bir boş yorum gönder
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      removeClient(username, res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(username, res);
  });
});

module.exports = {
  router,
  sendToUser,
  sendToPetOwners,
  sendToRelationship,
  activeClients
};
