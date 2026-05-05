// backend/src/server.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const exportRoutes = require('./routes/export');
const healthRoutes = require('./routes/health');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — autorise le frontend Vercel
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 20,
  message: { error: 'Trop de requêtes, réessaie dans une heure' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook Lemon Squeezy en raw body (avant express.json)
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use('/api', limiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/export', exportRoutes);

app.listen(PORT, () => {
  console.log(`[HASNOIA] Backend démarré sur le port ${PORT}`);
});

module.exports = app;
