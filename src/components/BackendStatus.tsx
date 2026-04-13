'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function BackendStatus() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function checkHealth() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setStatus('ok');
          setMessage(data.message || 'Connected');
        } else {
          setStatus('error');
          setMessage('Server returned error');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Cannot connect to backend');
      }
    }

    checkHealth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-xs font-medium animate-fade-in z-50">
      {status === 'loading' && (
        <>
          <Activity className="h-3 w-3 text-yellow-500 animate-pulse" />
          <span className="text-gray-400">Checking Backend...</span>
        </>
      )}
      {status === 'ok' && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-green-400">{message}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-400">{message}</span>
        </>
      )}
    </div>
  );
}
