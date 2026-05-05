# HASNOIA — Architecture Complète

## Vision
Site web (pas d'extension) : colle une URL Framer → ZIP propre téléchargé en 10 secondes.
Différenciation vs ToStatic : zéro installation, SEO clean garanti, multi-plateformes, pricing plus bas.

---

## Stack

| Couche | Techno | Pourquoi |
|--------|--------|----------|
| Frontend | React + Vite + TailwindCSS → Vercel | Gratuit, CDN global, CI/CD auto |
| Backend | Node.js + Express + Puppeteer → Railway | Headless Chrome nécessite un vrai serveur |
| Auth | Clerk | Gratuit jusqu'à 10k users, SDK React en 30min |
| DB | Supabase (PostgreSQL) | Gratuit jusqu'à 500MB, SDK simple |
| Paiement | Lemon Squeezy | Gère TVA EU automatiquement, simple API |
| Keepalive | UptimeRobot (free) | Ping /health toutes les 5min → Railway ne dort jamais |

---

## Structure des fichiers

```
hasnoia/
├── frontend/                          # Deploy sur Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExportInput.jsx        # Input URL + bouton export
│   │   │   ├── ExportProgress.jsx     # Progress bar temps réel via SSE
│   │   │   ├── PricingCards.jsx       # Plans Free/Pro
│   │   │   ├── ExportHistory.jsx      # Historique des exports user
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx            # Page principale + hero + input
│   │   │   ├── Dashboard.jsx          # Espace connecté
│   │   │   └── Pricing.jsx
│   │   ├── hooks/
│   │   │   └── useExport.js           # Logic export + SSE listener
│   │   └── lib/
│   │       ├── api.js                 # Calls vers backend Railway
│   │       └── clerk.js              # Config auth Clerk
│   ├── .env.local
│   │   ├── VITE_BACKEND_URL=https://hasnoia-backend.railway.app
│   │   ├── VITE_CLERK_PUBLISHABLE_KEY=pk_...
│   │   └── VITE_LEMON_SQUEEZY_URL=https://...
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                           # Deploy sur Railway
│   ├── src/
│   │   ├── server.js                  # Express app + routes
│   │   ├── routes/
│   │   │   ├── export.js              # POST /export + SSE /export/stream
│   │   │   ├── health.js              # GET /health (UptimeRobot ping)
│   │   │   └── webhook.js             # POST /webhook/lemon (paiements)
│   │   ├── services/
│   │   │   ├── scraper.js             # Puppeteer — charge l'URL, attend hydratation
│   │   │   ├── cleaner.js             # cleanHtml() — supprime metas Framer
│   │   │   ├── assets.js              # Télécharge images/fonts framerusercontent
│   │   │   └── zipper.js              # Génère le ZIP final avec JSZip
│   │   ├── middleware/
│   │   │   ├── auth.js                # Vérifie JWT Clerk
│   │   │   └── quota.js               # Vérifie quota exports restants
│   │   └── lib/
│   │       └── supabase.js            # Client Supabase
│   ├── .env
│   │   ├── CLERK_SECRET_KEY=sk_...
│   │   ├── SUPABASE_URL=https://...
│   │   ├── SUPABASE_SERVICE_KEY=...
│   │   └── LEMON_SQUEEZY_WEBHOOK_SECRET=...
│   └── package.json
│
└── supabase/
    └── schema.sql                     # Tables users + exports

```

---

## Schéma base de données (Supabase)

```sql
-- Table users (sync avec Clerk via webhook)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free',           -- 'free' | 'pro'
  exports_this_month INTEGER DEFAULT 0,
  exports_reset_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  lemon_customer_id TEXT,
  lemon_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table exports (historique)
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',      -- 'pending' | 'processing' | 'done' | 'error'
  pages_count INTEGER,
  assets_count INTEGER,
  zip_size_kb INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Flow complet d'un export

```
User colle "scylis.framer.ai" → clique Export

1. Frontend vérifie auth Clerk
   └─ Si pas connecté → modal signup (gratuit)

2. POST /api/export { url, userId }
   └─ middleware auth.js vérifie JWT Clerk
   └─ middleware quota.js vérifie exports restants
      └─ free: 1 export/mois | pro: illimité
      └─ Si quota dépassé → 402 + redirect pricing

3. Backend crée entry exports table (status: 'pending')
   └─ Retourne { exportId }

4. Frontend ouvre SSE sur GET /api/export/stream/:exportId
   └─ Reçoit les updates de progression en temps réel

5. Backend lance scraper.js
   └─ Puppeteer launch (Chromium headless)
   └─ page.goto(url, { waitUntil: 'networkidle0' })
   └─ Attend 3s supplémentaires (hydratation React Framer)
   └─ SSE event: { step: 'scraped', progress: 20 }

6. Backend lance cleaner.js sur le HTML
   └─ Supprime metas Framer, barre éditeur, pixel ToStatic
   └─ SSE event: { step: 'cleaned', progress: 35 }

7. Backend scrape les autres pages via sitemap.xml
   └─ Puppeteer réutilisé pour chaque page (pool de 1)
   └─ SSE event: { step: 'pages', progress: 50, pagesFound: N }

8. Backend lance assets.js
   └─ Extrait URLs framerusercontent.com (images, fonts, CSS)
   └─ Télécharge en parallèle (lots de 8)
   └─ SSE event: { step: 'assets', progress: 70, assetsDownloaded: N }

9. Backend lance zipper.js
   └─ JSZip → base64
   └─ SSE event: { step: 'zipping', progress: 90 }

10. Backend upload ZIP sur Supabase Storage (bucket 'exports')
    └─ Génère signed URL valide 1h
    └─ Met à jour exports table (status: 'done')
    └─ Décrémente quota user
    └─ SSE event: { step: 'done', progress: 100, downloadUrl: '...' }

11. Frontend reçoit downloadUrl → trigger download auto
    └─ Affiche stats: X pages, Y assets, Zkb

Total: ~10-30 secondes selon la taille du site
```

---

## Pricing

| Plan | Prix | Quota | Features |
|------|------|-------|---------|
| Free | 0€ | 1 export/mois | Page unique, assets CDN |
| Pro | 9€/mois | Illimité | Multi-pages, assets locaux, historique |

---

## Déploiement

### Railway (backend)
```bash
cd backend
npm install
# Variables d'env dans Railway dashboard
railway up
```

### Vercel (frontend)
```bash
cd frontend
npm install
# Variables d'env dans Vercel dashboard
vercel --prod
```

### UptimeRobot (keepalive)
- URL: https://hasnoia-backend.railway.app/health
- Intervalle: 5 minutes
- Type: HTTP(S)
- Gratuit, zéro config

---

## Sécurité vs ToStatic

- Auth JWT Clerk obligatoire sur chaque requête
- Rate limiting: 10 requêtes/heure par IP (express-rate-limit)
- Quota en DB (pas côté client)
- Signed URLs temporaires pour les ZIPs (1h)
- Webhook Lemon Squeezy avec signature HMAC
- Pas de clé API exposée côté frontend
