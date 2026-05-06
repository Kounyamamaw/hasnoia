const puppeteer = require('puppeteer');

let browserInstance = null;

async function getBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.version(); // test si encore vivant
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  console.log('[Scraper] Lancement Chromium...');
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-skip-list',
      // Contourne les restrictions réseau Railway
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
    ignoreHTTPSErrors: true,
  });

  browserInstance.on('disconnected', () => {
    console.log('[Scraper] Browser disconnected');
    browserInstance = null;
  });

  console.log('[Scraper] Chromium OK');
  return browserInstance;
}

async function scrapePage(url, onProgress) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Extra headers pour ressembler à un vrai browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Bloque uniquement les vidéos pour aller plus vite
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (req.resourceType() === 'media') req.abort();
      else req.continue();
    });

    onProgress?.({ step: 'loading', message: 'Loading page...', progress: 15 });
    console.log('[Scraper] Navigating to:', url);

    // domcontentloaded est plus rapide et moins strict que networkidle0
    // Framer hydrate après donc on attend manuellement
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    onProgress?.({ step: 'waiting', message: 'Waiting for Framer hydration...', progress: 30 });

    // Attend que le contenu Framer soit chargé
    // On attend soit networkidle soit 8 secondes max
    try {
      await Promise.race([
        page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }),
        new Promise(r => setTimeout(r, 8000)),
      ]);
    } catch {}

    // 2s de plus pour l'hydratation React
    await new Promise(r => setTimeout(r, 2000));

    onProgress?.({ step: 'scraped', message: 'Page scraped', progress: 40 });

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const title = await page.title();

    console.log('[Scraper] OK:', url, 'HTML size:', html.length);
    return { html, title, url: page.url() };

  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeSitemap(siteUrl) {
  try {
    const base = new URL(siteUrl);
    const sitemapUrl = `${base.origin}/sitemap.xml`;

    console.log('[Scraper] Fetching sitemap:', sitemapUrl);

    // Utilise fetch direct plutôt que Puppeteer pour le sitemap
    const res = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HASNOIA/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const text = await res.text();
    if (!text.includes('<urlset')) return [];

    const urls = [];
    for (const m of text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = m[1].trim();
      if (u !== siteUrl && u.startsWith(base.origin)) urls.push(u);
    }
    console.log('[Scraper] Sitemap found', urls.length, 'pages');
    return urls.slice(0, 15);
  } catch (e) {
    console.log('[Scraper] Sitemap error:', e.message);
    return [];
  }
}

async function scrapePages(urls, onProgress) {
  const pages = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      onProgress?.({ step: 'scraping_page', message: `Page ${i+1}/${urls.length}`, progress: 40 + Math.round((i/urls.length)*20) });
      const result = await scrapePage(urls[i]);
      pages.push({ ...result, path: new URL(urls[i]).pathname });
    } catch (e) {
      console.warn('[Scraper] Page failed:', urls[i], e.message);
    }
  }
  return pages;
}

process.on('SIGTERM', async () => {
  if (browserInstance) await browserInstance.close().catch(() => {});
});

module.exports = { scrapePage, scrapeSitemap, scrapePages };
