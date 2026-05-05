// frontend/src/pages/Dashboard.jsx — HASNOIA · same premium design as landing
import { useState } from 'react';
import { useUser, UserButton } from '@clerk/react';
import { Link } from 'react-router-dom';
import { useExport } from '../hooks/useExport';

export default function Dashboard() {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const { startExport, isExporting, progress, result, error } = useExport();

  async function handleExport() {
    const clean = url.trim().replace(/^https?:\/\//, '');
    if (!clean) return;
    await startExport('https://' + clean);
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(135deg, #fff8f0 0%, #fffbf5 40%, #f0f4ff 100%)', minHeight: '100vh', color: '#111' }}>

      {/* Blobs déco */}
      <div style={{ position: 'fixed', top: -200, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #ea580c, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            HASNOIA
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px' }}>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 15, color: '#888', margin: 0 }}>Export your Framer sites below</p>
        </div>

        {/* Export card */}
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', padding: 28, marginBottom: 20, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 18px', color: '#111' }}>New export</h2>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExport()}
              placeholder="yoursite.framer.ai"
              style={{ flex: 1, padding: '13px 16px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', color: '#111', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleExport}
              disabled={isExporting || !url.trim()}
              style={{ padding: '13px 24px', background: isExporting ? '#ccc' : 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: isExporting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: isExporting ? 'none' : '0 4px 12px rgba(234,88,12,0.25)', fontFamily: 'inherit' }}
            >
              {isExporting ? 'Exporting...' : 'Export →'}
            </button>
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#555' }}>
                <span>{progress.message || 'Processing...'}</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{progress.progress || 0}%</span>
              </div>
              <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #ea580c, #f97316)', borderRadius: 99, width: `${progress.progress || 0}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* Success */}
          {result && (
            <div style={{ marginTop: 14, padding: '14px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Export complete — downloading!</div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                  {result.stats?.pages} page(s) · {result.stats?.assets} assets · {result.stats?.sizeKb}kb
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 14, padding: '14px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>❌</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>Export failed</div>
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{error.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Plan card */}
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', padding: 28, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111' }}>Your plan</h2>
            <span style={{ fontSize: 12, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '4px 12px', borderRadius: 999, border: '1px solid #fed7aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Free
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Exports this month', value: '0 / 1' },
              { label: 'Plan', value: 'Free' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 18px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <a href={import.meta.env.VITE_LEMON_SQUEEZY_URL || '/#pricing'} style={{ display: 'block', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', borderRadius: 12, padding: '13px 0', textAlign: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(234,88,12,0.25)' }}>
            Upgrade to Pro — €9/month →
          </a>
        </div>
      </div>
    </div>
  );
}
