// backend/src/services/assets.js
// Télécharge les assets framerusercontent.com (images, fonts, CSS)
// NE remplace PAS les URLs dans le HTML (causerait React hydration #418)

async function fetchAsset(url, ms = 10000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HASNOIA/1.0)' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return { data: Buffer.from(buf), ct: res.headers.get('content-type') || '' };
  } catch { return null; }
}

function urlToPath(url) {
  try {
    const u = new URL(url);
    return 'assets/' + u.hostname.replace(/\./g, '_') + u.pathname;
  } catch { return null; }
}

function extractAssetUrls(html) {
  // Retire les scripts avant extraction pour ne capturer que les vrais attributs HTML
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const urls = new Set();
  const add = (u) => {
    if (u && u.startsWith('https://framerusercontent.com') && !u.match(/\.(mjs|js)(\?|$)/))
      urls.add(u.split('?')[0]);
  };
  for (const m of noScript.matchAll(/\bsrc="(https:\/\/framerusercontent\.com[^"]+)"/g)) add(m[1]);
  for (const m of noScript.matchAll(/\bdata-src="(https:\/\/framerusercontent\.com[^"]+)"/g)) add(m[1]);
  for (const m of noScript.matchAll(/\bsrcset="([^"]+)"/g))
    m[1].split(',').forEach(p => add(p.trim().split(' ')[0]));
  for (const m of noScript.matchAll(/url\(["']?(https:\/\/framerusercontent\.com[^"')]+)/g)) add(m[1]);
  for (const m of noScript.matchAll(/<link[^>]+href="(https:\/\/framerusercontent\.com[^"]+)"/g)) add(m[1]);
  return [...urls];
}

function extractFromCss(css) {
  const urls = new Set();
  const add = (u) => {
    if (u && u.startsWith('https://framerusercontent.com') && !u.match(/\.(mjs|js)/))
      urls.add(u.split('?')[0]);
  };
  for (const m of css.matchAll(/url\(["']?(https:\/\/framerusercontent\.com[^"')]+)/g)) add(m[1]);
  return [...urls];
}

async function downloadAssets(urls, onFile) {
  const urlMap = new Map();
  const subCss = new Set();
  let ok = 0, fail = 0;

  for (let i = 0; i < urls.length; i += 8) {
    await Promise.all(urls.slice(i, i + 8).map(async (url) => {
      if (urlMap.has(url)) return;
      const lp = urlToPath(url);
      if (!lp) return;
      const r = await fetchAsset(url);
      if (r) {
        onFile?.(lp, r.data);
        urlMap.set(url, lp);
        ok++;
        if (r.ct.includes('css') || url.endsWith('.css'))
          extractFromCss(r.data.toString('utf-8')).forEach(u => subCss.add(u));
      } else {
        fail++;
      }
    }));
  }

  // Sous-assets CSS
  const sub = [...subCss].filter(u => !urlMap.has(u));
  for (let i = 0; i < sub.length; i += 8) {
    await Promise.all(sub.slice(i, i + 8).map(async (url) => {
      const lp = urlToPath(url);
      if (!lp) return;
      const r = await fetchAsset(url);
      if (r) { onFile?.(lp, r.data); urlMap.set(url, lp); ok++; }
    }));
  }

  return { ok, fail, urlMap };
}

module.exports = { extractAssetUrls, downloadAssets, urlToPath };
