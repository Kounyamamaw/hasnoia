// frontend/src/pages/Landing.jsx — HASNOIA Export Tool
// Light theme, full English, clean design
import { useState } from 'react';
import { SignInButton, useUser, UserButton } from '@clerk/react';
import { useExport } from '../hooks/useExport';

export default function Landing() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { isSignedIn, user } = useUser();
  const { startExport, isExporting, progress, result, error: exportError } = useExport();

  async function handleExport() {
    setError('');
    const clean = url.trim().replace(/^https?:\/\//, '');
    if (!clean) return setError('Please enter a Framer URL');
    const normalized = 'https://' + clean;
    await startExport(normalized);
  }

  const comparisonRows = [
    ['Requires Chrome extension', true, false],
    ['Removes Framer badge',      false, true],
    ['Cleans SEO meta tags',      false, true],
    ['Removes pixel tracking',    false, true],
    ['Multi-page export',         true, true],
    ['Local asset download',      true, true],
  ];

  const features = [
    { emoji: '⚡', title: 'No extension needed', desc: 'Works directly in your browser. Paste any Framer URL, download a clean ZIP in seconds.' },
    { emoji: '🔍', title: 'Full SEO cleanup', desc: 'Removes framer-search-index, Framer badge, canonical to framer.app, og:url tags, and tracking pixels.' },
    { emoji: '🚀', title: 'Deploy anywhere free', desc: 'Host your exported site on Vercel or Netlify for €0/month. No Framer subscription ever again.' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', background: '#fff', color: '#111', minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 900 }}>H</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>HASNOIA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Pricing</a>
            {isSignedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#666' }}>Hi, {user.firstName || 'there'}</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button style={{ fontSize: 13, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 600, cursor: 'pointer' }}>
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 999, marginBottom: 28, border: '1px solid #e0e7ff' }}>
          <span style={{ width: 6, height: 6, background: '#4f46e5', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          "framer export" — Google Trends 100/100 · May 2026
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
          Export any Framer site<br />
          <span style={{ color: '#4f46e5' }}>without a subscription</span>
        </h1>

        <p style={{ fontSize: 17, color: '#666', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Paste a Framer URL. Get a clean static ZIP in seconds.
          No Chrome extension. No monthly fee. Framer badge removed automatically.
        </p>

        {/* ── Export input ── */}
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'flex', border: `2px solid ${error ? '#f87171' : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', transition: 'border-color 0.2s' }}>
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleExport()}
              placeholder="yoursite.framer.ai"
              style={{ flex: 1, padding: '14px 16px', fontSize: 14, border: 'none', outline: 'none', color: '#111', background: 'transparent' }}
            />
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button onClick={() => sessionStorage.setItem('pendingUrl', url)} style={{ padding: '14px 22px', background: '#4f46e5', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Export free →
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || !url.trim()}
                style={{ padding: '14px 22px', background: '#4f46e5', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.5 : 1, whiteSpace: 'nowrap' }}
              >
                {isExporting ? 'Exporting...' : 'Export free →'}
              </button>
            )}
          </div>
          {error && <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444', textAlign: 'left' }}>{error}</p>}
          {exportError && <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444', textAlign: 'left' }}>{exportError.message || String(exportError)}</p>}
          <p style={{ marginTop: 10, fontSize: 12, color: '#aaa' }}>Supports · framer.ai · framer.app · framer.website</p>
        </div>

        {/* Progress */}
        {isExporting && progress && (
          <div style={{ maxWidth: 500, margin: '20px auto 0', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#555' }}>{progress.message || 'Processing...'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>{progress.progress || 0}%</span>
            </div>
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#4f46e5', borderRadius: 4, width: `${progress.progress || 0}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div style={{ maxWidth: 500, margin: '20px auto 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Export complete! Downloading...</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                {result.stats?.pages} page(s) · {result.stats?.assets} assets · {result.stats?.sizeKb}kb
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Comparison table ── */}
      <section id="features" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.5px' }}>Better than ToStatic</h2>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</div>
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>ToStatic</div>
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'center', background: '#4f46e5' }}>HASNOIA</div>
          </div>
          {comparisonRows.map(([label, them, us], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', borderBottom: i < comparisonRows.length - 1 ? '1px solid #f3f4f6' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <div style={{ padding: '13px 16px', fontSize: 14, color: '#374151' }}>{label}</div>
              <div style={{ padding: '13px 16px', textAlign: 'center', borderLeft: '1px solid #f3f4f6' }}>
                {typeof them === 'boolean'
                  ? (them ? <span style={{ color: '#ef4444', fontSize: 16 }}>✕</span> : <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>)
                  : <span style={{ fontSize: 12, color: '#ef4444' }}>{them}</span>
                }
              </div>
              <div style={{ padding: '13px 16px', textAlign: 'center', background: '#eef2ff' }}>
                {us ? <span style={{ color: '#4f46e5', fontSize: 16, fontWeight: 700 }}>✓</span> : <span style={{ color: '#ef4444', fontSize: 16 }}>✕</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '20px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.emoji}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#111' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: '#f9fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Simple pricing</h2>
          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginBottom: 36 }}>No hidden fees. Cancel anytime.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Free */}
            <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #e5e7eb', padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Free</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111', marginBottom: 4 }}>€0</div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>forever</div>
              {['1 export / month', 'Single page', 'SEO cleaned', 'Badge removed'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#444' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            {/* Pro */}
            <div style={{ background: '#4f46e5', borderRadius: 20, border: '2px solid #4f46e5', padding: 24, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 16, background: '#fbbf24', color: '#92400e', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999 }}>POPULAR</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Pro</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>€9</div>
              <div style={{ fontSize: 13, color: '#a5b4fc', marginBottom: 20 }}>per month</div>
              {['Unlimited exports', 'Multi-page sitemap', 'Local assets', 'Export history'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#e0e7ff' }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
              <a href={import.meta.env.VITE_LEMON_SQUEEZY_URL || '#'} style={{ display: 'block', marginTop: 20, background: '#fff', color: '#4f46e5', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Get Pro →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#ccc' }}>© 2026 HASNOIA · Made in Paris</span>
      </footer>
    </div>
  );
}
