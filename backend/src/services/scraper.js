// scraper.js — fetch simple, pas de Puppeteer
// Framer fait du SSR complet : le HTML est 100% présent côté serveur
// Les scripts JS (.mjs) se chargent depuis framerusercontent.com CDN dans le browser final
// Résultat identique à Puppeteer, 10x plus rapide, zéro RAM

async function scrapePage(url, onProgress) {
  console.log('[Scraper] Fetching:', url);
  onProgress?.({ step: 'loading', message: 'Fetching page...', progress: 15 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'export';

    console.log('[Scraper] OK:', url, '— HTML size:', html.length, 'bytes');
    onProgress?.({ step: 'scraped', message: 'Page fetched', progress: 35 });

    return { html, title, url };

  } catch (err) {
    clearTimeout(timer);
    throw new Error('Fetch failed: ' + err.message);
  }
}

async function scrapeSitemap(siteUrl) {
  try {
    const base = new URL(siteUrl);
    const sitemapUrl = `${base.origin}/sitemap.xml`;
    console.log('[Scraper] Checking sitemap:', sitemapUrl);

    const res = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const xml = await res.text();
    if (!xml.includes('<urlset')) return [];

    const urls = [];
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = m[1].trim();
      if (u !== siteUrl && u.startsWith(base.origin)) urls.push(u);
    }

    console.log('[Scraper] Sitemap found:', urls.length, 'pages');
    return urls.slice(0, 20);
  } catch {
    return [];
  }
}

async function scrapePages(urls, onProgress) {
  const pages = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      onProgress?.({
        step: 'scraping_page',
        message: `Fetching page ${i + 1}/${urls.length}...`,
        progress: Math.round(35 + (i / urls.length) * 20),
      });
      const result = await scrapePage(urls[i]);
      const u = new URL(urls[i]);
      pages.push({ ...result, path: u.pathname });
    } catch (err) {
      console.warn('[Scraper] Skip:', urls[i], err.message);
    }
  }
  return pages;
}

module.exports = { scrapePage, scrapeSitemap, scrapePages };
