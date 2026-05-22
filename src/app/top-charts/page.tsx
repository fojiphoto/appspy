'use client';
import { useState, useEffect, useCallback } from 'react';
import AppCard from '@/components/AppCard';
import FilterBar from '@/components/FilterBar';
import { Loader2, TrendingUp } from 'lucide-react';

interface App {
  rank: number; appId: string; title: string; developer: string;
  icon: string; score: number; installs: string; free: boolean;
  genre: string; estimatedDailyDownloads: number; estimatedDailyRevenue: number;
}

export default function TopChartsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: 'GAME', collection: 'TOP_FREE', country: 'us' });

  const fetchCharts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ ...filters, num: '50' });
      const res = await fetch(`/api/top-charts?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setApps(data.apps);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  const labels: Record<string, string> = { TOP_FREE: 'Top Free', TOP_PAID: 'Top Paid', GROSSING: 'Top Grossing' };

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp size={22} className="text-purple-400" />
        <div>
          <h1 className="text-xl font-bold text-white">{labels[filters.collection] || 'Top Charts'}</h1>
          <p className="text-gray-500 text-xs mt-0.5">Live rankings from Google Play Store</p>
        </div>
      </div>

      <FilterBar category={filters.category} collection={filters.collection} country={filters.country}
        onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))} />

      {loading && (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} /> Fetching live data…
        </div>
      )}
      {error && <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">Error: {error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {apps.map(app => <AppCard key={app.appId} {...app} />)}
        </div>
      )}
    </div>
  );
}
