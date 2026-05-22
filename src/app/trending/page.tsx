'use client';
import { useState, useEffect } from 'react';
import AppCard from '@/components/AppCard';
import { Flame, Loader2 } from 'lucide-react';

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 US' }, { value: 'gb', label: '🇬🇧 UK' },
  { value: 'in', label: '🇮🇳 India' }, { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'de', label: '🇩🇪 Germany' }, { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'jp', label: '🇯🇵 Japan' }, { value: 'tr', label: '🇹🇷 Turkey' },
];
const CATEGORIES = [
  { value: 'GAME', label: 'All Games' }, { value: 'GAME_ACTION', label: 'Action' },
  { value: 'GAME_CASUAL', label: 'Casual' }, { value: 'GAME_PUZZLE', label: 'Puzzle' },
  { value: 'APPLICATION', label: 'All Apps' }, { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'SOCIAL', label: 'Social' }, { value: 'TOOLS', label: 'Tools' },
];

export default function TrendingPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('us');
  const [category, setCategory] = useState('GAME');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ category, country, collection: 'GROSSING', num: '50' });
    fetch(`/api/top-charts?${params}`)
      .then(r => r.json())
      .then(d => setApps(d.apps || []))
      .finally(() => setLoading(false));
  }, [country, category]);

  const selectClass = "bg-[#1a1d24] border border-gray-700/60 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500";

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-5">
        <Flame size={22} className="text-orange-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Trending Apps</h1>
          <p className="text-gray-500 text-xs mt-0.5">Top Grossing apps — highest revenue momentum</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={country} onChange={e => setCountry(e.target.value)} className={selectClass}>
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} /> Loading trending apps…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {apps.map(app => <AppCard key={app.appId} {...app} />)}
        </div>
      )}
    </div>
  );
}
