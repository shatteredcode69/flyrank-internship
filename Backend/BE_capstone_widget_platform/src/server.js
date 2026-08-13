// src/server.js
require('dotenv').config();
const initDb = require('./db/init');
const createApp = require('./app');

initDb();
const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 FlyRank Widget Platform API listening on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   Debug toggles: http://localhost:${PORT}/debug/status`);
  }
});
