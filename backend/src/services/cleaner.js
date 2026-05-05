// backend/src/services/cleaner.js
// Nettoie le HTML exporté : supprime toutes les traces Framer + éditeur

function cleanHtml(html) {
  let h = html;

  // Pixel ToStatic
  h = h.replace(/<script>fetch\("https:\/\/tostatic\.app\/fns\/pixel\/[^"]*"[^<]*<\/script>/g, '');

  // Script éditeur Framer (framerSiteId) — cause les erreurs edit.framer.com
  h = h.replace(/<script[^>]*framerSiteId[^>]*>[\s\S]*?<\/script>/gi, '');
  h = h.replace(/<script[^>]*src="[^"]*framer\.com\/[^"]*"[^>]*><\/script>/gi, '');
  h = h.replace(/<script[^>]*>[\s\S]*?edit\.framer\.com[\s\S]*?<\/script>/gi, '');
  h = h.replace(/<iframe[^>]*(framer\.com\/edit|framerSiteId)[^>]*>[\s\S]*?<\/iframe>/gi, '');

  // Meta framer-search-index (affiche "Framer" dans Google)
  h = h.replace(/<meta\s+name="framer-search-index[^"]*"[^>]*>/gi, '');

  // Meta generator
  h = h.replace(/<meta\s+name="generator"\s+content="Framer[^"]*"[^>]*>/gi, '');

  // Canonical framer.app → supprimé (sera remplacé par le vrai domaine)
  h = h.replace(/<link\s+rel="canonical"\s+href="https:\/\/[^"]*\.framer\.(app|ai|website)[^"]*"[^>]*>/gi, '');

  // og:url et twitter:url
  h = h.replace(/<meta\s+property="og:url"\s+content="https:\/\/[^"]*\.framer\.(app|ai|website)[^"]*"[^>]*>/gi, '');
  h = h.replace(/<meta\s+name="twitter:url"\s+content="https:\/\/[^"]*\.framer\.(app|ai|website)[^"]*"[^>]*>/gi, '');

  // Badge Framer via script post-hydratation (pas de <style> dans <head> → React #418)
  const badgeKiller = `<script>
(function(){
  function kill(){
    var s=document.getElementById('fo-badge');
    if(!s){s=document.createElement('style');s.id='fo-badge';
    s.textContent='#__framer-badge-container,.__framer-badge,[class*="framer-badge"]{display:none!important}';
    document.head.appendChild(s);}
  }
  document.readyState==='complete'?kill():window.addEventListener('load',kill);
})();
</script>`;
  h = h.replace('</body>', badgeKiller + '\n</body>');

  // Commentaire export
  h = h.replace(
    /(<html[^>]*>)/i,
    `$1\n<!-- Exported with hasnoia — ${new Date().toISOString()} -->`
  );

  return h;
}

module.exports = { cleanHtml };
