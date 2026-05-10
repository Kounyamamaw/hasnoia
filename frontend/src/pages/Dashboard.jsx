import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { useExport } from '../hooks/useExport';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState(null);
  const { startExport, isExporting, progress, result, error } = useExport();

  // Fetch les vraies stats depuis le backend
  async function fetchStats() {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/api/export/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  useEffect(() => { fetchStats(); }, []);

  // Re-fetch après un export réussi
  useEffect(() => { if (result) fetchStats(); }, [result]);

  async function handleExport() {
    const clean = url.trim().replace(/^https?:\/\//, '');
    if (!clean) return;
    await startExport('https://' + clean);
  }

  const exportsUsed = stats?.exportsThisMonth ?? 0;
  const quota = stats?.quota ?? 1;
  const plan = stats?.plan ?? 'free';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(135deg, #fff8f0 0%, #fffbf5 40%, #f0f4ff 100%)', minHeight: '100vh', color: '#111' }}>
      <div style={{ position: 'fixed', top: -200, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #ea580c, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            HASNOIA
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#888' }}>{user?.primaryEmailAddress?.emailAddress}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px' }}>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Export your Framer sites below</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Plan', value: plan.toUpperCase(), color: plan === 'pro' || plan === 'admin' ? '#ea580c' : '#6b7280' },
            { label: 'Exports this month', value: plan === 'admin' || plan === 'pro' ? `${exportsUsed}` : `${exportsUsed} / ${quota}` },
            { label: 'Total exports', value: stats?.exports?.length ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '18px 20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', color: s.color || '#111' }}>{stats ? s.value : '—'}</div>
            </div>
          ))}
        </div>

        {/* Export card */}
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', padding: 28, marginBottom: 20, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>New export</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExport()} placeholder="yoursite.framer.ai"
              style={{ flex: 1, padding: '12px 16px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', color: '#111', fontFamily: 'inherit' }} />
            <button onClick={handleExport} disabled={isExporting || !url.trim()}
              style={{ padding: '12px 22px', background: isExporting ? '#ccc' : 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: isExporting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: isExporting ? 'none' : '0 4px 12px rgba(234,88,12,0.25)', fontFamily: 'inherit' }}>
              {isExporting ? 'Exporting...' : 'Export →'}
            </button>
          </div>

          {isExporting && progress && (
            <div style={{ marginTop: 14, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#555' }}>
                <span>{progress.message}</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{progress.progress}%</span>
              </div>
              <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #ea580c, #f97316)', borderRadius: 99, width: `${progress.progress}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>✅</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                Done! {result.stats?.pages} page(s) · {result.stats?.sizeKb}kb — downloading
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
              ❌ {error.message}
            </div>
          )}
        </div>

        {/* Export history */}
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', padding: 28, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>Export history</h2>
          {!stats ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc', fontSize: 14 }}>Loading...</div>
          ) : stats.exports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc', fontSize: 14 }}>No exports yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.exports.map(exp => (
                <div key={exp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{exp.url}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {new Date(exp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {exp.pages_count > 0 && ` · ${exp.pages_count} pages`}
                      {exp.zip_size_kb > 0 && ` · ${exp.zip_size_kb}kb`}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: exp.status === 'done' ? '#f0fdf4' : exp.status === 'error' ? '#fef2f2' : '#f9fafb', color: exp.status === 'done' ? '#16a34a' : exp.status === 'error' ? '#dc2626' : '#888' }}>
                    {exp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA si free */}
        {plan === 'free' && stats && (
          <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #ea580c, #f97316)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Unlock unlimited exports</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Pro — €9/month · Multi-page · Local assets</div>
            </div>
            <a href={import.meta.env.VITE_LEMON_SQUEEZY_URL || '/#pricing'} style={{ background: '#fff', color: '#ea580c', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Upgrade →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
