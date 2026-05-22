'use client';
import { useState, useEffect, useCallback } from 'react';

import AppCard from '@/components/AppCard';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'APPLICATION', label: 'All Apps' },
  { value: 'GAME', label: 'All Games' },
  { value: 'GAME_ACTION', label: '🎮 Action' },
  { value: 'GAME_ARCADE', label: '🕹️ Arcade' },
  { value: 'GAME_CASUAL', label: '🎯 Casual' },
  { value: 'GAME_PUZZLE', label: '🧩 Puzzle' },
  { value: 'GAME_STRATEGY', label: '♟️ Strategy' },
  { value: 'GAME_RACING', label: '🏎️ Racing' },
  { value: 'GAME_SPORTS', label: '⚽ Sports' },
  { value: 'GAME_ROLE_PLAYING', label: '⚔️ RPG' },
  { value: 'GAME_SIMULATION', label: '🏗️ Simulation' },
  { value: 'GAME_ADVENTURE', label: '🗺️ Adventure' },
  { value: 'COMMUNICATION', label: '💬 Communication' },
  { value: 'SOCIAL', label: '👥 Social' },
  { value: 'TOOLS', label: '🔧 Tools' },
  { value: 'PRODUCTIVITY', label: '📊 Productivity' },
  { value: 'EDUCATION', label: '📚 Education' },
  { value: 'HEALTH_AND_FITNESS', label: '💪 Health' },
  { value: 'SHOPPING', label: '🛒 Shopping' },
  { value: 'ENTERTAINMENT', label: '🎬 Entertainment' },
  { value: 'FINANCE', label: '💰 Finance' },
  { value: 'TRAVEL_AND_LOCAL', label: '✈️ Travel' },
  { value: 'FOOD_AND_DRINK', label: '🍔 Food' },
  { value: 'MUSIC_AND_AUDIO', label: '🎵 Music' },
  { value: 'PHOTOGRAPHY', label: '📷 Photography' },
];

const COLLECTIONS = [
  { value: 'TOP_FREE', label: '🆓 Top Free' },
  { value: 'TOP_PAID', label: '💵 Top Paid' },
  { value: 'GROSSING', label: '💸 Top Grossing' },
];

const COUNTRIES = [
  { value: 'us', flag: '🇺🇸', label: 'United States' },
  { value: 'gb', flag: '🇬🇧', label: 'United Kingdom' },
  { value: 'de', flag: '🇩🇪', label: 'Germany' },
  { value: 'in', flag: '🇮🇳', label: 'India' },
  { value: 'pk', flag: '🇵🇰', label: 'Pakistan' },
  { value: 'br', flag: '🇧🇷', label: 'Brazil' },
  { value: 'jp', flag: '🇯🇵', label: 'Japan' },
  { value: 'kr', flag: '🇰🇷', label: 'South Korea' },
  { value: 'ru', flag: '🇷🇺', label: 'Russia' },
  { value: 'fr', flag: '🇫🇷', label: 'France' },
  { value: 'tr', flag: '🇹🇷', label: 'Turkey' },
  { value: 'id', flag: '🇮🇩', label: 'Indonesia' },
  { value: 'mx', flag: '🇲🇽', label: 'Mexico' },
  { value: 'au', flag: '🇦🇺', label: 'Australia' },
  { value: 'ca', flag: '🇨🇦', label: 'Canada' },
];

export default function ExplorerPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    category: 'GAME',
    collection: 'TOP_FREE',
    country: 'us',
    onlyFree: false,
    minScore: 0,
    num: 100,
  });

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: filters.category,
        collection: filters.collection,
        country: filters.country,
        num: String(filters.num),
      });
      const res = await fetch(`/api/top-charts?${params}`);
      const data = await res.json();
      let apps = data.apps || [];
      if (filters.onlyFree) apps = apps.filter((a: any) => a.free);
      if (filters.minScore > 0) apps = apps.filter((a: any) => (a.score || 0) >= filters.minScore);
      setApps(apps);
    } catch { setApps([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch_(); }, [fetch_]);

  function set(key: string, value: any) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const selClass = "w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">

        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-60 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-purple-400" /> Filters
                </h2>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white">
                  <X size={15} />
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Category</label>
                <select value={filters.category} onChange={e => set('category', e.target.value)} className={selClass}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Collection */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Chart Type</label>
                <div className="space-y-1.5">
                  {COLLECTIONS.map(c => (
                    <button key={c.value} onClick={() => set('collection', c.value)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                        ${filters.collection === c.value ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:text-white'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Country</label>
                <select value={filters.country} onChange={e => set('country', e.target.value)} className={selClass}>
                  {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.flag} {c.label}</option>)}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">
                  Min Rating: {filters.minScore > 0 ? `${filters.minScore}★` : 'Any'}
                </label>
                <input type="range" min={0} max={4.5} step={0.5} value={filters.minScore}
                  onChange={e => set('minScore', parseFloat(e.target.value))}
                  className="w-full accent-purple-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Any</span><span>4.5★</span>
                </div>
              </div>

              {/* Free only */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.onlyFree}
                    onChange={e => set('onlyFree', e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded" />
                  <span className="text-sm text-gray-300">Free apps only</span>
                </label>
              </div>

              {/* Results count */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Results: {filters.num}</label>
                <input type="range" min={20} max={200} step={20} value={filters.num}
                  onChange={e => set('num', parseInt(e.target.value))}
                  className="w-full accent-purple-500" />
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">App Market Explorer</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {CATEGORIES.find(c => c.value === filters.category)?.label} ·
                {COUNTRIES.find(c => c.value === filters.country)?.flag} ·
                {apps.length} apps
              </p>
            </div>
            {!showFilters && (
              <button onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg">
                <SlidersHorizontal size={14} /> Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
              <Loader2 className="animate-spin" size={18} /> Fetching apps…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apps.map(app => <AppCard key={app.appId} {...app} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
