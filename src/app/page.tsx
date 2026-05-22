'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AppCard from '@/components/AppCard';
import FilterBar from '@/components/FilterBar';
import { Loader2, TrendingUp } from 'lucide-react';

interface App {
  rank: number;
  appId: string;
  title: string;
  developer: string;
  icon: string;
  score: number;
  installs: string;
  free: boolean;
  genre: string;
  estimatedDailyDownloads: number;
  estimatedDailyRevenue: number;
}

export default function Home() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'GAME',
    collection: 'TOP_FREE',
    country: 'us',
  });

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ ...filters, num: '50' });
      const res = await fetch(`/api/top-charts?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setApps(data.apps);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const collectionLabels: Record<string, string> = {
    TOP_FREE: 'Top Free Apps',
    TOP_PAID: 'Top Paid Apps',
    GROSSING: 'Top Grossing',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-purple-400" size={24} />
          <div>
            <h1 className="text-2xl font-bold">
              {collectionLabels[filters.collection] || 'Top Charts'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Live data from Google Play Store · Estimates based on ranking signals
            </p>
          </div>
        </div>

        <FilterBar
          category={filters.category}
          collection={filters.collection}
          country={filters.country}
          onChange={handleFilterChange}
        />

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="animate-spin" size={20} />
            Fetching live data from Google Play...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {apps.map(app => (
              <AppCard key={app.appId} {...app} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
