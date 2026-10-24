const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.FLUTTER_PORT || 8080;

app.use(cors());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const webDir = path.join(__dirname, '..', 'pawly_app', 'build', 'web');
app.use(express.static(webDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(webDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐾 Pawly Flutter Web running at http://localhost:${PORT}`);
});
