// backend/src/services/scraper.js
// Puppeteer headless — charge l'URL Framer, attend l'hydratation React complète
// Retourne le HTML hydraté + liste des pages du sitemap

const puppeteer = require('puppeteer');

// Pool de browser — on réutilise la même instance pour éviter
// de lancer/tuer Chrome à chaque export (coûteux en RAM)
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // Critique sur Railway (shared memory limité)
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-networking',
        '--single-process',         // Réduit la RAM sur Railway
      ],
    });
    console.log('[Scraper] Navigateur Chromium démarré');
  }
  return browserInstance;
}

// Scrape une URL et retourne son HTML hydraté
async function scrapePage(url, onProgress) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Bloque les ressources inutiles pour aller plus vite
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      // On laisse passer HTML, scripts (runtime Framer), fonts, images
      // On bloque les analytics, pixels tracking, etc.
      if (['media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
    );

    onProgress?.({ step: 'loading', message: 'Chargement de la page...' });

    // Charge la page et attend que le réseau soit idle
    // networkidle0 = 0 requêtes réseau pendant 500ms consécutives
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Attend encore 3 secondes pour l'hydratation React de Framer
    // Le runtime Framer charge des modules .mjs async — networkidle0 ne suffit pas
    await new Promise(r => setTimeout(r, 3000));

    onProgress?.({ step: 'hydrated', message: 'Page hydratée' });

    // Récupère le HTML complet après hydratation
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const title = await page.title();
    const finalUrl = page.url();

    return { html, title, url: finalUrl };

  } finally {
    await page.close();
  }
}

// Scrape le sitemap.xml d'un site pour récupérer toutes les pages
async function scrapeSitemap(siteUrl) {
  try {
    const base = new URL(siteUrl);
    const sitemapUrl = `${base.origin}/sitemap.xml`;

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      const response = await page.goto(sitemapUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      if (!response.ok()) return [];

      const content = await page.content();
      if (!content.includes('<urlset')) return [];

      const urls = [];
      const matches = content.matchAll(/<loc>([^<]+)<\/loc>/g);
      for (const m of matches) {
        const u = m[1].trim();
        if (u !== siteUrl && u.startsWith(base.origin)) {
          urls.push(u);
        }
      }

      return urls.slice(0, 20); // Max 20 pages

    } finally {
      await page.close();
    }
  } catch {
    return [];
  }
}

// Scrape plusieurs pages en séquence (pas en parallèle pour économiser la RAM)
async function scrapePages(urls, onProgress) {
  const pages = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      onProgress?.({
        step: 'scraping_page',
        message: `Page ${i + 1}/${urls.length}`,
        progress: Math.round(30 + (i / urls.length) * 20),
      });
      const result = await scrapePage(urls[i]);
      const u = new URL(urls[i]);
      pages.push({ ...result, path: u.pathname });
    } catch (err) {
      console.warn(`[Scraper] Impossible de scraper ${urls[i]}:`, err.message);
    }
  }
  return pages;
}

// Ferme le browser proprement (appelé sur SIGTERM)
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

module.exports = { scrapePage, scrapeSitemap, scrapePages, closeBrowser };
