const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const exportRoutes = require('./routes/export');
const healthRoutes = require('./routes/health');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

// FIX 1 : Railway est derrière un proxy — obligatoire pour express-rate-limit
app.set('trust proxy', 1);

// CORS — large pour ne pas bloquer
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Preflight OPTIONS global
app.options('*', cors());

// Rate limiting — désactivé temporairement pour debug, on réactivera en prod
// const limiter = rateLimit({ windowMs: 60*60*1000, max: 20 });

// Webhook Lemon Squeezy en raw body
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRoutes);
app.use('/api/export', exportRoutes);

app.listen(PORT, () => {
  console.log(`[HASNOIA] Backend started on port ${PORT}`);
});

module.exports = app;
