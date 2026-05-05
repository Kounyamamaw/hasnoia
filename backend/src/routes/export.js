// backend/src/routes/export.js
// POST /api/export → lance l'export async
// GET /api/export/stream/:exportId → SSE progress temps réel

const express = require('express');
const JSZip = require('jszip');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { checkQuota, decrementQuota } = require('../middleware/quota');
const { scrapePage, scrapeSitemap, scrapePages } = require('../services/scraper');
const { cleanHtml } = require('../services/cleaner');
const { extractAssetUrls, downloadAssets } = require('../services/assets');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Map pour les SSE streams actifs — exportId → res
const activeStreams = new Map();

function sendSSE(exportId, data) {
  const res = activeStreams.get(exportId);
  if (res) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// ── SSE Stream endpoint ──────────────────────────────────────────────────────
// Le frontend se connecte ici pour recevoir les updates en temps réel
router.get('/stream/:exportId', requireAuth, (req, res) => {
  const { exportId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  activeStreams.set(exportId, res);

  // Keepalive toutes les 15s pour éviter le timeout du proxy
  const keepalive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepalive);
    activeStreams.delete(exportId);
  });
});

// ── Export endpoint ───────────────────────────────────────────────────────────
router.post('/', requireAuth, checkQuota, async (req, res) => {
  const { url, downloadAssets: shouldDownloadAssets = true } = req.body;
  const userId = req.userId;

  if (!url) return res.status(400).json({ error: 'URL requise' });

  // Valide que c'est bien un site Framer (ou autre plateforme supportée)
  const validDomains = ['.framer.app', '.framer.ai', '.framer.website', '.webflow.io', '.lovable.app'];
  const isValid = validDomains.some(d => url.includes(d)) || url.match(/^https?:\/\//);
  if (!isValid) return res.status(400).json({ error: 'URL non supportée' });

  // Crée l'entrée en DB
  const { data: exportEntry } = await supabase
    .from('exports')
    .insert({ user_id: userId, url, status: 'processing' })
    .select()
    .single();

  const exportId = exportEntry.id;

  // Répond immédiatement avec l'exportId — le frontend va ouvrir le SSE stream
  res.json({ exportId });

  // Lance le process en background
  runExport({ exportId, url, userId, shouldDownloadAssets })
    .catch(async (err) => {
      console.error('[Export] Erreur:', err.message);
      sendSSE(exportId, { step: 'error', error: err.message });
      await supabase.from('exports')
        .update({ status: 'error', error_message: err.message })
        .eq('id', exportId);
    });
});

async function runExport({ exportId, url, userId, shouldDownloadAssets }) {
  sendSSE(exportId, { step: 'starting', progress: 5, message: 'Démarrage...' });

  // ── 1. Scrape la page principale ───────────────────────────────────────────
  sendSSE(exportId, { step: 'loading', progress: 10, message: 'Chargement de la page...' });
  const mainPage = await scrapePage(url);
  sendSSE(exportId, { step: 'scraped', progress: 25, message: 'Page chargée' });

  // ── 2. Scrape les autres pages via sitemap ─────────────────────────────────
  sendSSE(exportId, { step: 'sitemap', progress: 30, message: 'Recherche des autres pages...' });
  const otherUrls = await scrapeSitemap(url);

  let extraPages = [];
  if (otherUrls.length > 0) {
    sendSSE(exportId, { step: 'pages', progress: 35, message: `${otherUrls.length} page(s) trouvée(s)` });
    extraPages = await scrapePages(otherUrls, (p) => sendSSE(exportId, p));
  }

  sendSSE(exportId, { step: 'all_scraped', progress: 50, message: 'Pages scrapées' });

  // ── 3. Build du ZIP ────────────────────────────────────────────────────────
  const zip = new JSZip();
  const allPages = [
    { ...mainPage, path: '/', filename: 'index.html' },
    ...extraPages.map(p => ({
      ...p,
      filename: p.path.replace(/^\//, '').replace(/\/$/, '') + '/index.html'
    }))
  ];

  let totalAssets = 0;

  for (const page of allPages) {
    const cleanedHtml = cleanHtml(page.html);
    zip.file(page.filename === 'index.html' ? 'index.html' : page.filename, cleanedHtml);

    if (shouldDownloadAssets) {
      sendSSE(exportId, { step: 'assets', progress: 60, message: 'Téléchargement des assets...' });
      const assetUrls = extractAssetUrls(page.html);

      await downloadAssets(assetUrls, (path, data) => {
        zip.file(path, data);
        totalAssets++;
        if (totalAssets % 5 === 0) {
          sendSSE(exportId, {
            step: 'downloading',
            progress: Math.min(80, 60 + totalAssets * 0.5),
            message: `${totalAssets} assets téléchargés...`
          });
        }
      });
    }
  }

  // ── 4. Sitemap.xml ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const sitemapUrls = [url, ...otherUrls];
  zip.file('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('')}</urlset>`);

  // ── 5. Génère le ZIP ───────────────────────────────────────────────────────
  sendSSE(exportId, { step: 'zipping', progress: 88, message: 'Génération du ZIP...' });

  const zipBase64 = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // ── 6. Upload sur Supabase Storage ─────────────────────────────────────────
  sendSSE(exportId, { step: 'uploading', progress: 94, message: 'Finalisation...' });

  const zipBuffer = Buffer.from(zipBase64, 'base64');
  const filename = `${userId}/${exportId}.zip`;

  await supabase.storage
    .from('exports')
    .upload(filename, zipBuffer, { contentType: 'application/zip', upsert: true });

  const { data: signedData } = await supabase.storage
    .from('exports')
    .createSignedUrl(filename, 3600); // 1h

  // ── 7. Mise à jour DB + décrémente quota ───────────────────────────────────
  await supabase.from('exports').update({
    status: 'done',
    pages_count: allPages.length,
    assets_count: totalAssets,
    zip_size_kb: Math.round(zipBuffer.length / 1024),
  }).eq('id', exportId);

  await decrementQuota(userId);

  // ── 8. Done ! ──────────────────────────────────────────────────────────────
  sendSSE(exportId, {
    step: 'done',
    progress: 100,
    message: 'Export terminé !',
    downloadUrl: signedData.signedUrl,
    stats: {
      pages: allPages.length,
      assets: totalAssets,
      sizeKb: Math.round(zipBuffer.length / 1024),
    },
  });
}

module.exports = router;
