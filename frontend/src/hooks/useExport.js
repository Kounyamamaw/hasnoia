// frontend/src/hooks/useExport.js
import { useState, useRef } from 'react';
import { useAuth } from '@clerk/react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const { getToken } = useAuth();

  async function startExport(url, options = {}) {
    setIsExporting(true);
    setProgress({ step: 'starting', progress: 5, message: 'Initializing...' });
    setError(null);
    setResult(null);

    try {
      // Clerk v6 — getToken() sans argument retourne le JWT session
      const token = await getToken();
      if (!token) throw new Error('Not authenticated — please sign in');

      const res = await fetch(`${BACKEND_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url, downloadAssets: options.downloadAssets ?? true }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setError({ message: 'Export limit reached — upgrade to Pro', upgradeUrl: data.upgradeUrl });
        setIsExporting(false);
        return;
      }
      if (res.status === 401) {
        setError({ message: 'Authentication failed — please sign out and sign in again' });
        setIsExporting(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const { exportId } = await res.json();

      // SSE stream — token passé en query string car EventSource ne supporte pas les headers
      const sseUrl = `${BACKEND_URL}/api/export/stream/${exportId}?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setProgress(data);
          if (data.step === 'done') {
            setResult(data);
            setIsExporting(false);
            eventSource.close();
            // Trigger download
            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = url.replace(/^https?:\/\//, '').replace(/\//g, '-') + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          if (data.step === 'error') {
            setError({ message: data.error || 'Export failed' });
            setIsExporting(false);
            eventSource.close();
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setError({ message: 'Connection lost. Please try again.' });
        setIsExporting(false);
        eventSource.close();
      };

    } catch (err) {
      setError({ message: err.message });
      setIsExporting(false);
    }
  }

  return { startExport, isExporting, progress, result, error };
}
