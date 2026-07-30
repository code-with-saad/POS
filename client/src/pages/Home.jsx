import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">CafePOS</h1>
        <p className="text-slate-600 mb-4">Restaurant point of sale</p>
        {error && (
          <p className="text-red-600 text-sm">API: {error}</p>
        )}
        {health && (
          <p className="text-green-700 text-sm">
            API health: {health.data?.status ?? 'connected'}
          </p>
        )}
        {!health && !error && (
          <p className="text-slate-500 text-sm">Checking API…</p>
        )}
      </div>
    </div>
  );
}
