const express = require('express');
const cors = require('cors');
const path = require('path');
const { load, get } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

load();

app.use('/api/auth', require('./auth').router);
app.use('/api/events', require('./events').router);
app.use('/api/pair', require('./pair'));
app.use('/api/friends', require('./friends'));
app.use('/api/pets', require('./pets'));
app.use('/api/widgets', require('./widgets'));
app.use('/api/messages', require('./messages'));

app.get('/api/health', (req, res) => {
  const db = get();
  res.json({ 
    ok: true, 
    users: db.users.length, 
    pets: db.pets.length,
    relationships: (db.relationships || []).length 
  });
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`🐾 Pawly hazır: http://localhost:${PORT}`));
}

module.exports = app;
