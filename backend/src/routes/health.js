// backend/src/routes/health.js
// GET /health — pingé par UptimeRobot toutes les 5min pour garder Railway éveillé
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

module.exports = router;
