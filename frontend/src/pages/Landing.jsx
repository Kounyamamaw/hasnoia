// frontend/src/pages/Landing.jsx
// Landing page hasnoia — design dark, minimaliste, premium
// Inspired par la DA de The Game (1997) et les outils dev modernes

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useUser } from '@clerk/react';
import { useExport } from '../hooks/useExport';

const SUPPORTED = ['framer.app', 'framer.ai', 'framer.website', 'webflow.io', 'lovable.app'];

export default function Landing() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { startExport, progress, isExporting } = useExport();

  function validateUrl(val) {
    try {
      const u = new URL(val.startsWith('http') ? val : 'https://' + val);
      return u.hostname;
    } catch { return null; }
  }

  async function handleExport() {
    setError('');
    const hostname = validateUrl(url);
    if (!hostname) return setError('URL invalide');

    const normalized = url.startsWith('http') ? url : 'https://' + url;

    if (!isSignedIn) {
      // Sauvegarde l'URL et redirige vers signup
      sessionStorage.setItem('pendingUrl', normalized);
      return;
    }

    await startExport(normalized);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono overflow-x-hidden">
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 tracking-[0.3em] uppercase">Frame</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-xs text-white/60 tracking-[0.3em] uppercase font-bold">Out</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#pricing" className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider">Pricing</a>
          {isSignedIn ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider"
            >
              Dashboard →
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider">
                Connexion
              </button>
            </SignInButton>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-20">

        {/* Badge tendance */}
        <div className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/50 tracking-widest uppercase">Framer Export · Google Trends 100/100</span>
        </div>

        {/* Titre */}
        <h1 className="text-center mb-4 leading-[0.95] tracking-tight">
          <span className="block text-5xl md:text-7xl font-bold text-white">
            Export your
          </span>
          <span className="block text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/20 bg-clip-text text-transparent">
            Framer site.
          </span>
          <span className="block text-5xl md:text-7xl font-bold text-white/20">
            Free forever.
          </span>
        </h1>

        <p className="mt-6 text-center text-sm text-white/30 max-w-md leading-relaxed tracking-wide">
          Colle une URL Framer. Reçois un ZIP propre en 10 secondes.
          <br />Zéro extension. Zéro abonnement Framer. SEO clean garanti.
        </p>

        {/* Input principal */}
        <div className="mt-12 w-full max-w-xl">
          <div className={`flex gap-0 bg-white/5 border rounded-xl overflow-hidden transition-all duration-200 ${
            error ? 'border-red-500/50' : 'border-white/10 focus-within:border-white/30'
          }`}>
            <div className="flex items-center px-4 border-r border-white/10">
              <span className="text-white/20 text-xs font-mono">https://</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleExport()}
              placeholder="votre-site.framer.ai"
              className="flex-1 bg-transparent px-4 py-4 text-sm text-white/80 placeholder-white/20 outline-none font-mono tracking-wide"
            />
            {!isSignedIn ? (
              <SignInButton mode="modal" afterSignInUrl="/?exported=1">
                <button
                  onClick={() => sessionStorage.setItem('pendingUrl', url)}
                  className="px-6 py-4 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-white/90 transition-colors"
                >
                  Export →
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || !url}
                className="px-6 py-4 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isExporting ? '...' : 'Export →'}
              </button>
            )}
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400/80 pl-4">{error}</p>
          )}

          <p className="mt-3 text-center text-xs text-white/20 tracking-wider">
            Supporte · {SUPPORTED.map(s => s.split('.')[0]).join(' · ')}
          </p>
        </div>

        {/* Progress */}
        {isExporting && progress && (
          <div className="mt-8 w-full max-w-xl">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-white/40 tracking-wider">{progress.message}</span>
              <span className="text-xs text-white/30">{progress.progress}%</span>
            </div>
            <div className="h-px bg-white/10 rounded overflow-hidden">
              <div
                className="h-full bg-white/60 transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Comparaison ToStatic */}
        <div className="mt-20 grid grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden max-w-xl w-full">
          {[
            ['Installation', '❌ Extension Chrome', '✓ Aucune'],
            ['SEO Framer', '❌ Pas nettoyé', '✓ Supprimé'],
            ['Pixel tracking', '❌ Conservé', '✓ Retiré'],
          ].map(([label, them, us]) => (
            <div key={label} className="bg-[#0c0c0c] p-4">
              <div className="text-xs text-white/20 tracking-wider uppercase mb-3">{label}</div>
              <div className="text-xs text-red-400/60 mb-1">{them}</div>
              <div className="text-xs text-green-400/80">{us}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-white/5">
        <h2 className="text-center text-xs text-white/20 tracking-[0.4em] uppercase mb-12">Pricing</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center max-w-lg mx-auto">
          {/* Free */}
          <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-6">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-4">Free</div>
            <div className="text-4xl font-bold text-white mb-1">0€</div>
            <div className="text-xs text-white/20 mb-6">pour toujours</div>
            <ul className="space-y-2 text-xs text-white/40">
              <li>→ 1 export / mois</li>
              <li>→ Page unique</li>
              <li>→ SEO clean</li>
            </ul>
          </div>
          {/* Pro */}
          <div className="flex-1 bg-white border border-white rounded-xl p-6 relative">
            <div className="absolute -top-2.5 right-4 bg-black text-white text-xs px-3 py-0.5 rounded-full tracking-widest">POPULAIRE</div>
            <div className="text-xs text-black/40 tracking-widest uppercase mb-4">Pro</div>
            <div className="text-4xl font-bold text-black mb-1">9€</div>
            <div className="text-xs text-black/30 mb-6">par mois</div>
            <ul className="space-y-2 text-xs text-black/60">
              <li>→ Exports illimités</li>
              <li>→ Multi-pages (sitemap)</li>
              <li>→ Assets locaux</li>
              <li>→ Historique exports</li>
            </ul>
            <a
              href={import.meta.env.VITE_LEMON_SQUEEZY_URL}
              className="mt-6 block text-center bg-black text-white text-xs py-3 rounded-lg tracking-widest uppercase hover:bg-black/80 transition-colors"
            >
              Commencer →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/15 tracking-widest">hasnoia © 2026</span>
        <span className="text-xs text-white/15 tracking-widest">Made in Paris</span>
      </footer>
    </div>
  );
}
