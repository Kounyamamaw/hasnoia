// frontend/src/hooks/useExport.js
// Gère l'export : POST vers backend + écoute SSE pour le progress

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
    setProgress({ step: 'starting', progress: 0, message: 'Initialisation...' });
    setError(null);
    setResult(null);

    try {
      const token = await getToken();

      // 1. POST pour démarrer l'export
      const res = await fetch(`${BACKEND_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          downloadAssets: options.downloadAssets ?? true,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setError({ type: 'quota', upgradeUrl: data.upgradeUrl });
        setIsExporting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur serveur');
      }

      const { exportId } = await res.json();

      // 2. Ouvre le stream SSE pour les updates
      const sseUrl = `${BACKEND_URL}/api/export/stream/${exportId}`;
      const eventSource = new EventSource(sseUrl + `?token=${token}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setProgress(data);

        if (data.step === 'done') {
          setResult(data);
          setIsExporting(false);
          eventSource.close();

          // Trigger download automatique
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = url.replace(/^https?:\/\//, '').replace(/\//g, '-') + '.zip';
          a.click();
        }

        if (data.step === 'error') {
          setError({ type: 'export', message: data.error });
          setIsExporting(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError({ type: 'connection', message: 'Connexion perdue. Réessaie.' });
        setIsExporting(false);
        eventSource.close();
      };

    } catch (err) {
      setError({ type: 'export', message: err.message });
      setIsExporting(false);
    }
  }

  function cancelExport() {
    eventSourceRef.current?.close();
    setIsExporting(false);
    setProgress(null);
  }

  return { startExport, cancelExport, isExporting, progress, result, error };
}
