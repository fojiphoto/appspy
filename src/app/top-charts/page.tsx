'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppCard from '@/components/AppCard';
import FilterBar from '@/components/FilterBar';
import { Loader2, TrendingUp } from 'lucide-react';

type Store = 'google' | 'apple' | 'amazon';

interface App {
  rank: number; appId: string; title: string; developer: string;
  icon: string; score: number; installs: string; free: boolean;
  genre: string; genreId: string;
  estimatedDailyDownloads: number; estimatedDailyRevenue: number;
  store: string;
}

// Default category per store
const DEFAULT_CATEGORY: Record<Store, string> = {
  google: 'GAME',
  apple:  'GAMES',
  amazon: 'APPLICATION',
};

// Default collection per store
const DEFAULT_COLLECTION: Record<Store, string> = {
  google: 'TOP_FREE',
  apple:  'TOP_FREE',
  amazon: 'TOP_FREE',
};

// Labels for header
const STORE_LABELS: Record<Store, string> = {
  google: 'Google Play',
  apple:  'App Store',
  amazon: 'Amazon Appstore',
};

const COLLECTION_LABELS: Record<string, string> = {
  TOP_FREE:     'Top Free',
  TOP_PAID:     'Top Paid',
  GROSSING:     'Top Grossing',
  TOP_NEW_FREE: 'Top New Free',
};

// ── Store tab icons ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
      <path d="M3.18 23.76c.33.18.7.24 1.06.18l11.51-11.5L12.43 9.1 3.18 23.76zm17.12-10.2c.42-.36.7-.9.7-1.56s-.28-1.2-.71-1.56l-2.33-1.35-3.26 3.26 3.26 3.26 2.34-1.35v-.7zM4.24.06C3.91 0 3.54.06 3.18.24L15.4 12.44 18.72 9.1 4.24.06zM3.18.24z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
      <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.748.074-1.052-.872-1.238-1.276-1.814-2.106-1.732 1.767-2.958 2.297-5.207 2.297-2.657 0-4.726-1.64-4.726-4.921 0-2.563 1.391-4.307 3.37-5.161 1.716-.754 4.109-.891 5.942-1.1v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.819-1.775-.819-1.208 0-2.282.619-2.545 1.901-.054.285-.264.567-.548.582l-3.058-.33c-.257-.058-.543-.266-.469-.66C5.924 1.502 9.074.5 11.869.5c1.43 0 3.303.38 4.432 1.461C17.73 3.24 17.627 5.417 17.627 7.77v6.674c0 2.006.832 2.89 1.617 3.97.276.389.338.854-.014 1.143-.875.731-2.432 2.088-3.286 2.85l-.8-.612z"/>
    </svg>
  );
}

const STORE_TABS: { id: Store; label: string; Icon: () => React.ReactElement; activeClass: string }[] = [
  { id: 'google', label: 'Android',         Icon: GoogleIcon, activeClass: 'bg-[#01875F] text-white' },
  { id: 'apple',  label: 'iOS',             Icon: AppleIcon,  activeClass: 'bg-[#0D96F6] text-white' },
  { id: 'amazon', label: 'Amazon',          Icon: AmazonIcon, activeClass: 'bg-[#FF9900] text-white' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TopChartsPage() {
  const [store, setStore]       = useState<Store>('google');
  const [apps, setApps]         = useState<App[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filters, setFilters]   = useState({
    category:         DEFAULT_CATEGORY.google,
    collection:       DEFAULT_COLLECTION.google,
    country:          'us',
    gameSubCategory:  '',
  });

  const prevStore = useRef<Store>('google');

  // Reset filters when store changes
  useEffect(() => {
    if (prevStore.current !== store) {
      prevStore.current = store;
      setFilters({
        category:         DEFAULT_CATEGORY[store],
        collection:       DEFAULT_COLLECTION[store],
        country:          'us',
        gameSubCategory:  '',
      });
    }
  }, [store]);

  const fetchCharts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { gameSubCategory, ...apiFilters } = filters;
      const params = new URLSearchParams({ ...apiFilters, store, num: '50' });
      const res  = await fetch(`/api/top-charts?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      let apps = data.apps || [];
      // Filter by game sub-category if selected
      if (gameSubCategory) {
        apps = apps.filter((app: any) => app.gameSubCategory === gameSubCategory);
      }
      setApps(apps);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, store]);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  const collectionLabel = COLLECTION_LABELS[filters.collection] || filters.collection;
  const storeLabel      = STORE_LABELS[store];

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp size={22} className="text-purple-400" />
        <div>
          <h1 className="text-xl font-bold text-white">{collectionLabel}</h1>
          <p className="text-gray-500 text-xs mt-0.5">Live rankings from {storeLabel}</p>
        </div>
      </div>

      {/* Store tabs */}
      <div className="flex bg-[#1a1d24] border border-gray-700/60 rounded-xl overflow-hidden w-fit mb-5">
        {STORE_TABS.map(({ id, label, Icon, activeClass }) => (
          <button
            key={id}
            onClick={() => setStore(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors
              ${store === id ? activeClass : 'text-gray-400 hover:text-white'}`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        category={filters.category}
        collection={filters.collection}
        country={filters.country}
        gameSubCategory={filters.gameSubCategory}
        store={store}
        onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} /> Fetching live data…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {/* App grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {apps.map(app => (
            <AppCard key={app.appId} {...app} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
