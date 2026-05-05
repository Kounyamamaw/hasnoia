// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/react';
import { Link } from 'react-router-dom';
import { useExport } from '../hooks/useExport';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Dashboard() {
  const { user, isSignedIn } = useUser();
  const [exports, setExports] = useState([]);
  const [plan, setPlan] = useState('free');
  const [url, setUrl] = useState('');
  const { startExport, isExporting, progress, result, error } = useExport();

  useEffect(() => {
    if (!isSignedIn) return;
    // TODO: fetch export history from backend
  }, [isSignedIn]);

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 900 }}>H</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>HASNOIA</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#666' }}>{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {/* Plan badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Welcome back, {user?.firstName || 'there'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: plan === 'pro' ? '#eef2ff' : '#f3f4f6', color: plan === 'pro' ? '#4f46e5' : '#6b7280', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {plan} plan
            </span>
            {plan === 'free' && (
              <Link to="/#pricing" style={{ fontSize: 12, fontWeight: 700, background: '#4f46e5', color: 'white', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
                Upgrade →
              </Link>
            )}
          </div>
        </div>

        {/* Quick export */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111' }}>New export</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startExport(url.startsWith('http') ? url : 'https://' + url)}
              placeholder="yoursite.framer.ai"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', color: '#111' }}
            />
            <button
              onClick={() => startExport(url.startsWith('http') ? url : 'https://' + url)}
              disabled={isExporting || !url.trim()}
              style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isExporting ? 0.5 : 1 }}
            >
              {isExporting ? 'Exporting...' : 'Export →'}
            </button>
          </div>

          {isExporting && progress && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#555' }}>
                <span>{progress.message}</span>
                <span style={{ fontWeight: 600, color: '#4f46e5' }}>{progress.progress}%</span>
              </div>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#4f46e5', width: `${progress.progress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534' }}>
              ✅ Done — {result.stats?.pages} page(s), {result.stats?.assets} assets, {result.stats?.sizeKb}kb
            </div>
          )}
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              ❌ {error.message}
            </div>
          )}
        </div>

        {/* Export history placeholder */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111' }}>Export history</h2>
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: 14 }}>
            No exports yet — export your first Framer site above
          </div>
        </div>
      </div>
    </div>
  );
}
