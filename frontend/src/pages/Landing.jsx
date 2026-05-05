// frontend/src/pages/Landing.jsx — HASNOIA · Premium redesign
import { useState } from 'react';
import { SignInButton, useUser, UserButton } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useExport } from '../hooks/useExport';

const S = {
  // Layout
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(135deg, #fff8f0 0%, #fffbf5 40%, #f0f4ff 100%)', minHeight: '100vh', color: '#111', position: 'relative', overflow: 'hidden' },
  blob1: { position: 'fixed', top: -200, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 },
  blob2: { position: 'fixed', bottom: -200, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 },
};

export default function Landing() {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const { startExport, isExporting, progress, result, error: exportError } = useExport();

  async function handleExport() {
    setInputError('');
    const clean = url.trim().replace(/^https?:\/\//, '');
    if (!clean) return setInputError('Enter a Framer URL to export');
    await startExport('https://' + clean);
  }

  const stats = [
    { value: '0€', label: 'Hosting cost', sub: 'vs €18-54/mo on Framer' },
    { value: '10s', label: 'Export time', sub: 'Average for any Framer site' },
    { value: '100%', label: 'SEO cleaned', sub: 'Badge, meta, tracking removed' },
  ];

  const vsRows = [
    ['Framer subscription required', '€18-54/mo', 'Never'],
    ['Custom domain hosting', '€18+/mo', '€0 on Vercel'],
    ['Framer badge on site',  'Always', 'Removed ✓'],
    ['"Built with Framer" in Google', 'Shows', 'Hidden ✓'],
    ['Pixel tracking on your site', 'Active', 'Deleted ✓'],
    ['Own your files', 'No', 'Full ZIP ✓'],
  ];

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #ea580c, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HASNOIA
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.04)', borderRadius: 999, padding: '6px 6px 6px 16px' }}>
            <a href="#compare" style={{ fontSize: 13, color: '#555', textDecoration: 'none', padding: '0 10px' }}>Compare</a>
            <a href="#pricing" style={{ fontSize: 13, color: '#555', textDecoration: 'none', padding: '0 10px' }}>Pricing</a>
            {isSignedIn ? (
              <>
                <button onClick={() => navigate('/dashboard')} style={{ fontSize: 13, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px' }}>Dashboard</button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <button style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Badge ROI */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, rgba(234,88,12,0.1), rgba(249,115,22,0.08))', border: '1px solid rgba(234,88,12,0.2)', color: '#c2410c', fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 999, marginBottom: 32 }}>
          💰 Stop paying €18-54/month to Framer — export once, host free forever
        </div>

        <h1 style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', margin: '0 0 22px' }}>
          Export your Framer site.<br />
          <span style={{ background: 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Host it for free.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: '#666', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.65 }}>
          Paste any Framer URL. Download a clean static ZIP in 10 seconds.
          No Chrome extension. No subscription. Framer badge removed automatically.
        </p>

        {/* ── Export input — big & beautiful ── */}
        <div style={{ maxWidth: 580, margin: '0 auto', background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(234,88,12,0.05)', padding: 8, backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 12px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', opacity: 0.6 }} />
            <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Framer Export</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setInputError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleExport()}
              placeholder="yoursite.framer.ai"
              style={{ flex: 1, padding: '14px 18px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 15, outline: 'none', color: '#111', fontFamily: 'inherit' }}
            />
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button onClick={() => sessionStorage.setItem('pendingUrl', url)} style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(234,88,12,0.3)' }}>
                  Export free →
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || !url.trim()}
                style={{ padding: '14px 24px', background: isExporting ? '#ccc' : 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: isExporting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: isExporting ? 'none' : '0 4px 12px rgba(234,88,12,0.3)' }}
              >
                {isExporting ? 'Exporting...' : 'Export free →'}
              </button>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 4px 4px', flexWrap: 'wrap' }}>
            {['framer.ai', 'framer.app', 'framer.website', 'Multi-page', 'Badge removed', 'SEO clean'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#888', background: '#f3f4f6', padding: '4px 10px', borderRadius: 999, border: '1px solid #e5e7eb' }}>{t}</span>
            ))}
          </div>
        </div>

        {inputError && <p style={{ marginTop: 10, fontSize: 13, color: '#ef4444' }}>{inputError}</p>}
        {exportError && <p style={{ marginTop: 10, fontSize: 13, color: '#ef4444' }}>{exportError.message}</p>}

        {/* Progress */}
        {isExporting && progress && (
          <div style={{ maxWidth: 580, margin: '16px auto 0', background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 18px', textAlign: 'left', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#555' }}>
              <span>{progress.message || 'Processing...'}</span>
              <span style={{ fontWeight: 700, color: '#ea580c' }}>{progress.progress || 0}%</span>
            </div>
            <div style={{ height: 5, background: '#f3f4f6', borderRadius: 99 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #ea580c, #f97316)', borderRadius: 99, width: `${progress.progress || 0}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {result && (
          <div style={{ maxWidth: 580, margin: '16px auto 0', background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Export complete — downloading now!</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>{result.stats?.pages} page(s) · {result.stats?.assets} assets · {result.stats?.sizeKb}kb</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', padding: '28px 24px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-2px', background: 'linear-gradient(135deg, #ea580c, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HASNOIA vs Framer comparison ── */}
      <section id="compare" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 10px' }}>Why not just stay on Framer?</h2>
          <p style={{ fontSize: 15, color: '#666', margin: 0 }}>Because owning your site shouldn't cost €54/month.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', backdropFilter: 'blur(10px)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}></div>
            <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#aaa', borderLeft: '1px solid #f0f0f0' }}>Framer hosting</div>
            <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#ea580c', background: 'linear-gradient(135deg, rgba(234,88,12,0.06), rgba(249,115,22,0.04))' }}>HASNOIA</div>
          </div>
          {vsRows.map(([label, framer, hasnoia], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', borderBottom: i < vsRows.length-1 ? '1px solid #f7f7f7' : 'none' }}>
              <div style={{ padding: '14px 20px', fontSize: 14, color: '#333' }}>{label}</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, color: '#ef4444', fontWeight: 500, borderLeft: '1px solid #f7f7f7' }}>{framer}</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, color: '#16a34a', fontWeight: 700, background: 'linear-gradient(135deg, rgba(234,88,12,0.03), rgba(249,115,22,0.02))' }}>{hasnoia}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '60px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 10 }}>Simple pricing</h2>
          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginBottom: 40 }}>No hidden fees. Cancel anytime.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1.5px solid rgba(0,0,0,0.08)', padding: 28, backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Free</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#111', marginBottom: 4 }}>€0</div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 22 }}>forever</div>
              {['1 export / month', 'Single page export', 'SEO metadata cleaned', 'Framer badge removed'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, fontSize: 13, color: '#444' }}>
                  <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 14 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', borderRadius: 20, padding: 28, position: 'relative', boxShadow: '0 8px 32px rgba(234,88,12,0.25)' }}>
              <div style={{ position: 'absolute', top: -12, right: 16, background: '#fbbf24', color: '#92400e', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999 }}>POPULAR</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Pro</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#fff', marginBottom: 4 }}>€9</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 22 }}>per month</div>
              {['Unlimited exports', 'Multi-page via sitemap', 'Local assets download', 'Export history'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: 14 }}>✓</span>{f}
                </div>
              ))}
              <a href={import.meta.env.VITE_LEMON_SQUEEZY_URL || '#'} style={{ display: 'block', marginTop: 22, background: '#fff', color: '#ea580c', borderRadius: 12, padding: '12px 0', textAlign: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                Get Pro →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 12, color: '#ccc' }}>© 2026 HASNOIA · Made in Paris · By Wilfrid Hasnaoui</span>
      </footer>
    </div>
  );
}
