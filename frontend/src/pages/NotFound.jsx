import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(135deg, #fff8f0 0%, #fffbf5 40%, #f0f4ff 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-4px', background: 'linear-gradient(135deg, #ea580c, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginTop: 16, marginBottom: 8 }}>Page not found</div>
      <div style={{ fontSize: 15, color: '#888', marginBottom: 32 }}>This page doesn't exist or was moved.</div>
      <Link to="/" style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(234,88,12,0.25)' }}>
        Back to HASNOIA →
      </Link>
    </div>
  );
}