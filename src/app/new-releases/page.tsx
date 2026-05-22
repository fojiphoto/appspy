'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Star, TrendingUp, Calendar, Download, RefreshCw,
  Flame, Sparkles, Clock, ChevronRight,
} from 'lucide-react';
import { formatNumber } from '@/lib/estimates';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 US' },
  { value: 'gb', label: '🇬🇧 UK' },
  { value: 'in', label: '🇮🇳 India' },
  { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'de', label: '🇩🇪 Germany' },
  { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'jp', label: '🇯🇵 Japan' },
  { value: 'au', label: '🇦🇺 Australia' },
  { value: 'ca', label: '🇨🇦 Canada' },
  { value: 'fr', label: '🇫🇷 France' },
];

const CATEGORIES = [
  { value: 'APPLICATION', label: 'All Apps' },
  { value: 'GAME',             label: '🎮 Games' },
  { value: 'GAME_ACTION',      label: '⚔️ Action' },
  { value: 'GAME_CASUAL',      label: '🎯 Casual' },
  { value: 'GAME_PUZZLE',      label: '🧩 Puzzle' },
  { value: 'GAME_STRATEGY',    label: '♟️ Strategy' },
  { value: 'GAME_ARCADE',      label: '🕹️ Arcade' },
  { value: 'GAME_SIMULATION',  label: '🏗️ Simulation' },
  { value: 'COMMUNICATION',    label: '💬 Communication' },
  { value: 'SOCIAL',           label: '👥 Social' },
  { value: 'TOOLS',            label: '🔧 Tools' },
  { value: 'PRODUCTIVITY',     label: '⚡ Productivity' },
  { value: 'ENTERTAINMENT',    label: '🎬 Entertainment' },
  { value: 'EDUCATION',        label: '📚 Education' },
  { value: 'HEALTH_AND_FITNESS', label: '💪 Health' },
];

// Age badge color by days
function ageBadgeStyle(ageText: string): string {
  if (!ageText) return 'bg-gray-800 text-gray-500';
  const lower = ageText.toLowerCase();
  if (lower === 'today')                          return 'bg-red-500/20 border border-red-500/40 text-red-400';
  if (lower.includes('day') && parseInt(lower) <= 7) return 'bg-orange-500/20 border border-orange-500/40 text-orange-400';
  if (lower.includes('day'))                      return 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400';
  return 'bg-gray-800 border border-gray-700 text-gray-400';
}

function AgeIcon({ ageText }: { ageText: string }) {
  const lower = (ageText || '').toLowerCase();
  if (lower === 'today') return <Flame size={10} className="inline mr-1" />;
  if (lower.includes('day') && parseInt(lower) <= 7) return <Sparkles size={10} className="inline mr-1" />;
  return <Clock size={10} className="inline mr-1" />;
}

// ─── App Row ──────────────────────────────────────────────────────────────────

function AppRow({ app, rank }: { app: any; rank: number }) {
  const badgeStyle = ageBadgeStyle(app.ageText);

  return (
    <Link href={`/app?id=${app.appId}`}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800/50 last:border-0 group">
        {/* Rank */}
        <span className={`w-7 text-center text-xs font-bold shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-600'}`}>
          {rank}
        </span>

        {/* Icon */}
        <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl shrink-0 border border-gray-800 object-cover" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-medium truncate">{app.title}</p>
            {app.ageText && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeStyle}`}>
                <AgeIcon ageText={app.ageText} />{app.ageText}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs truncate mt-0.5">{app.developer}</p>
          <div className="flex items-center gap-3 mt-1">
            {app.genre && (
              <span className="text-gray-600 text-xs">{app.genre}</span>
            )}
            {app.score > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                <Star size={10} fill="currentColor" />{app.score.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Released date */}
        <div className="hidden sm:flex flex-col items-end shrink-0 w-28 text-right">
          {app.releasedDate ? (
            <>
              <span className="text-gray-300 text-xs font-medium">
                {new Date(app.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-gray-600 text-[10px]">Released</span>
            </>
          ) : (
            <span className="text-gray-700 text-xs">No date</span>
          )}
        </div>

        {/* Est. daily */}
        <div className="hidden md:flex flex-col items-end shrink-0 w-20 text-right">
          <span className="text-purple-400 text-xs font-semibold">
            ~{formatNumber(app.estDailyInstalls)}
          </span>
          <span className="text-gray-600 text-[10px]">Est. Daily</span>
        </div>

        {/* Installs */}
        {app.installs && (
          <div className="hidden lg:flex flex-col items-end shrink-0 w-24 text-right">
            <span className="text-blue-400 text-xs font-semibold">{app.installs}</span>
            <span className="text-gray-600 text-[10px]">Installs</span>
          </div>
        )}

        <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 shrink-0" />
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewReleasesPage() {
  const [apps,     setApps]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [source,   setSource]   = useState('');
  const [error,    setError]    = useState('');
  const [country,  setCountry]  = useState('us');
  const [category, setCategory] = useState('APPLICATION');
  const [num,      setNum]      = useState(50);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      store: 'google', country, category, num: String(num), type: 'free',
    });
    fetch(`/api/new-releases?${params}`)
      .then(r => r.json())
      .then(d => {
        setApps(d.apps || []);
        setSource(d.source || '');
        if (d.error) setError(d.error);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [country, category, num]);

  useEffect(() => { load(); }, [load]);

  const realDateCount = apps.filter(a => a.hasRealDate).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Top New Free Apps</h1>
            <p className="text-gray-500 text-xs">Google Play — newly launched apps gaining traction</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            DataForSEO
          </div>
        </div>

        {/* Stats bar */}
        {apps.length > 0 && !loading && (
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><TrendingUp size={11} /> {apps.length} apps</span>
            <span className="flex items-center gap-1"><Calendar size={11} />
              {realDateCount} with release dates
            </span>
            <span className="flex items-center gap-1"><Flame size={11} />
              {apps.filter(a => {
                if (!a.ageText) return false;
                const d = parseInt(a.ageText);
                return a.ageText === 'Today' || (d <= 7);
              }).length} released this week
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Country */}
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Category */}
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Count */}
        <select value={num} onChange={e => setNum(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>

        {/* Refresh */}
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 hover:border-purple-500 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400"><Flame size={8} className="inline" /> Today</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400"><Sparkles size={8} className="inline" /> This week</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400"><Clock size={8} className="inline" /> This month</span>
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-800/50 text-[11px] text-gray-500 font-medium">
          <span className="w-7 shrink-0">#</span>
          <span className="w-12 shrink-0" />
          <span className="flex-1">App</span>
          <span className="hidden sm:block w-28 text-right">Released</span>
          <span className="hidden md:block w-20 text-right">Est. Daily</span>
          <span className="hidden lg:block w-24 text-right">Installs</span>
          <span className="w-4 shrink-0" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Loading new releases…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 text-red-400 text-sm text-center">Error: {error}</div>
        )}

        {/* Unconfigured */}
        {!loading && source === 'unconfigured' && (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm font-medium mb-1">DataForSEO not configured</p>
            <p className="text-gray-600 text-xs">Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to enable real new release data.</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && source !== 'unconfigured' && apps.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">No apps found for selected filters</div>
        )}

        {/* Apps */}
        {!loading && apps.map((app, i) => (
          <AppRow key={app.appId} app={app} rank={i + 1} />
        ))}
      </div>

      {apps.length > 0 && !loading && (
        <p className="text-gray-700 text-xs text-center mt-3">
          Release dates from DataForSEO · Est. Daily Downloads are estimates based on rank position
        </p>
      )}
    </div>
  );
}
