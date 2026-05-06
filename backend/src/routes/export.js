// routes/export.js — POST /api/export + GET /api/export/stream/:id
const express = require('express');
const JSZip = require('jszip');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { checkQuota, decrementQuota } = require('../middleware/quota');
const { scrapePage, scrapeSitemap, scrapePages } = require('../services/scraper');
const { cleanHtml } = require('../services/cleaner');
const { extractAssetUrls, downloadAssets } = require('../services/assets');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// Map SSE streams actifs
const activeStreams = new Map();

function sendSSE(exportId, data) {
  const res = activeStreams.get(exportId);
  if (res && !res.writableEnded) {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  }
}

// GET /api/export/stream/:exportId — SSE progress
router.get('/stream/:exportId', requireAuth, (req, res) => {
  const { exportId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  activeStreams.set(exportId, res);

  // Keepalive toutes les 10s
  const ka = setInterval(() => {
    if (!res.writableEnded) res.write(':keepalive\n\n');
    else clearInterval(ka);
  }, 10000);

  req.on('close', () => {
    clearInterval(ka);
    activeStreams.delete(exportId);
  });
});

// POST /api/export — lance l'export
router.post('/', requireAuth, checkQuota, async (req, res) => {
  const { url, downloadAssets: shouldDownloadAssets = false } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const supabase = getSupabase();
  const { data: entry } = await supabase
    .from('exports')
    .insert({ user_id: req.userId, url, status: 'processing' })
    .select().maybeSingle();

  const exportId = entry?.id || `tmp_${Date.now()}`;
  res.json({ exportId });

  // Lance en background
  runExport({ exportId, url, userId: req.userId, shouldDownloadAssets, supabase })
    .catch(async (err) => {
      console.error('[Export] Erreur:', err.message);
      sendSSE(exportId, { step: 'error', error: err.message });
      if (entry?.id) {
        await supabase.from('exports').update({ status: 'error', error_message: err.message }).eq('id', exportId);
      }
    });
});

async function runExport({ exportId, url, userId, shouldDownloadAssets, supabase }) {
  sendSSE(exportId, { step: 'starting', progress: 5, message: 'Starting...' });

  // 1. Page principale
  sendSSE(exportId, { step: 'loading', progress: 10, message: 'Fetching main page...' });
  const mainPage = await scrapePage(url, (p) => sendSSE(exportId, p));
  sendSSE(exportId, { step: 'scraped', progress: 30, message: 'Main page fetched ✓' });

  // 2. Sitemap
  sendSSE(exportId, { step: 'sitemap', progress: 35, message: 'Checking sitemap...' });
  const otherUrls = await scrapeSitemap(url);
  let extraPages = [];
  if (otherUrls.length > 0) {
    sendSSE(exportId, { step: 'pages', progress: 40, message: `Found ${otherUrls.length} extra page(s)` });
    extraPages = await scrapePages(otherUrls, (p) => sendSSE(exportId, { ...p, progress: Math.min(p.progress || 40, 55) }));
  }

  // 3. Build ZIP
  sendSSE(exportId, { step: 'building', progress: 60, message: 'Building ZIP...' });
  const zip = new JSZip();

  const allPages = [
    { ...mainPage, filename: 'index.html' },
    ...extraPages.map(p => ({
      ...p,
      filename: p.path.replace(/^\//, '').replace(/\/$/, '') + '/index.html'
    }))
  ];

  let totalAssets = 0;

  for (const page of allPages) {
    const cleaned = cleanHtml(page.html);
    zip.file(page.filename, cleaned);

    if (shouldDownloadAssets) {
      const assetUrls = extractAssetUrls(page.html);
      await downloadAssets(assetUrls, (path, data) => {
        zip.file(path, data);
        totalAssets++;
      });
    }
  }

  // Sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  zip.file('sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
      [url, ...otherUrls].map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('')
    }</urlset>`
  );

  // 4. Génère ZIP
  sendSSE(exportId, { step: 'zipping', progress: 80, message: 'Generating ZIP...' });
  const zipBase64 = await zip.generateAsync({
    type: 'base64', compression: 'DEFLATE', compressionOptions: { level: 6 }
  });

  const zipBuffer = Buffer.from(zipBase64, 'base64');

  // 5. Upload Supabase Storage
  sendSSE(exportId, { step: 'uploading', progress: 90, message: 'Uploading...' });
  const filename = `${userId}/${exportId}.zip`;

  const { error: uploadErr } = await supabase.storage
    .from('exports')
    .upload(filename, zipBuffer, { contentType: 'application/zip', upsert: true });

  if (uploadErr) throw new Error('Upload failed: ' + uploadErr.message);

  const { data: signedData } = await supabase.storage
    .from('exports')
    .createSignedUrl(filename, 3600);

  // 6. Mise à jour DB
  await supabase.from('exports').update({
    status: 'done',
    pages_count: allPages.length,
    assets_count: totalAssets,
    zip_size_kb: Math.round(zipBuffer.length / 1024),
  }).eq('id', exportId);

  await decrementQuota(userId);

  sendSSE(exportId, {
    step: 'done',
    progress: 100,
    message: 'Export complete!',
    downloadUrl: signedData?.signedUrl,
    stats: { pages: allPages.length, assets: totalAssets, sizeKb: Math.round(zipBuffer.length / 1024) },
  });

  console.log('[Export] Done:', url, 'pages:', allPages.length, 'assets:', totalAssets);
}

module.exports = router;
