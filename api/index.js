const app = require('../server');

module.exports = (req, res) => {
  // Ensure req.url has /api prefix if stripped by Vercel rewrite
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
