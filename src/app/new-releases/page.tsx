'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Star, TrendingUp, Calendar, Download, RefreshCw,
  Flame, Sparkles, Clock, ChevronDown, Package,
} from 'lucide-react';
import { formatNumber } from '@/lib/estimates';

type Store = 'google' | 'apple' | 'amazon';

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
  { value: 'COMMUNICATION',    label: '💬 Communication' },
  { value: 'SOCIAL',           label: '👥 Social' },
  { value: 'TOOLS',            label: '🔧 Tools' },
  { value: 'PRODUCTIVITY',     label: '⚡ Productivity' },
  { value: 'ENTERTAINMENT',    label: '🎬 Entertainment' },
  { value: 'EDUCATION',        label: '📚 Education' },
];

// ── Date grouping helper ──────────────────────────────────────────────────────

interface DateGroup {
  label: string;
  dateRange: string;
  apps: any[];
  isExpanded: boolean;
}

function groupByDate(apps: any[]): DateGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups: Record<string, any[]> = {
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  apps.forEach(app => {
    if (!app.releasedDate) {
      groups.older.push(app);
      return;
    }

    const appDate = new Date(app.releasedDate);
    appDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - appDate.getTime()) / 86400000);

    if (daysDiff === 0) {
      groups.today.push(app);
    } else if (daysDiff <= 7) {
      groups.thisWeek.push(app);
    } else if (daysDiff <= 30) {
      groups.thisMonth.push(app);
    } else {
      groups.older.push(app);
    }
  });

  return [
    { label: 'Today', dateRange: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), apps: groups.today, isExpanded: true },
    { label: 'This Week', dateRange: 'Last 7 days', apps: groups.thisWeek, isExpanded: true },
    { label: 'This Month', dateRange: 'Last 30 days', apps: groups.thisMonth, isExpanded: false },
    { label: 'Older', dateRange: 'More than 30 days ago', apps: groups.older, isExpanded: false },
  ].filter(g => g.apps.length > 0);
}

// ── Store icons ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0"><path d="M3.18 23.76c.33.18.7.24 1.06.18l11.51-11.5L12.43 9.1 3.18 23.76zm17.12-10.2c.42-.36.7-.9.7-1.56s-.28-1.2-.71-1.56l-2.33-1.35-3.26 3.26 3.26 3.26 2.34-1.35v-.7zM4.24.06C3.91 0 3.54.06 3.18.24L15.4 12.44 18.72 9.1 4.24.06zM3.18.24z"/></svg>;
}

function AppleIcon() {
  return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;
}

function AmazonIcon() {
  return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0"><path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.748.074-1.052-.872-1.238-1.276-1.814-2.106-1.732 1.767-2.958 2.297-5.207 2.297-2.657 0-4.726-1.64-4.726-4.921 0-2.563 1.391-4.307 3.37-5.161 1.716-.754 4.109-.891 5.942-1.1v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.819-1.775-.819-1.208 0-2.282.619-2.545 1.901-.054.285-.264.567-.548.582l-3.058-.33c-.257-.058-.543-.266-.469-.66C5.924 1.502 9.074.5 11.869.5c1.43 0 3.303.38 4.432 1.461C17.73 3.24 17.627 5.417 17.627 7.77v6.674c0 2.006.832 2.89 1.617 3.97.276.389.338.854-.014 1.143-.875.731-2.432 2.088-3.286 2.85l-.8-.612z"/></svg>;
}

const STORE_TABS: { id: Store; label: string; Icon: React.FC; activeClass: string }[] = [
  { id: 'google', label: 'Android', Icon: GoogleIcon, activeClass: 'bg-[#01875F] text-white' },
  { id: 'apple',  label: 'iOS',     Icon: AppleIcon,  activeClass: 'bg-[#0D96F6] text-white' },
  { id: 'amazon', label: 'Amazon',  Icon: AmazonIcon, activeClass: 'bg-[#FF9900] text-white' },
];

// ── App Row ───────────────────────────────────────────────────────────────────

function AppRow({ app, rank, store }: { app: any; rank: number; store: Store }) {
  const href = `/app?id=${app.appId}${store !== 'google' ? `&store=${store}` : ''}`;

  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800/30 last:border-0 group">
        {/* Rank */}
        <span className={`w-6 text-center text-xs font-bold shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-600'}`}>
          #{rank}
        </span>

        {/* Icon */}
        {app.icon ? (
          <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl shrink-0 border border-gray-800 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-12 h-12 rounded-xl shrink-0 bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-sm font-bold">
            {app.title?.[0] || '?'}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{app.title}</p>
          <p className="text-gray-500 text-xs truncate">{app.developer}</p>
          <div className="flex items-center gap-3 mt-1 text-xs">
            {app.genre && <span className="text-gray-600">{app.genre}</span>}
            {app.score > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-400">
                <Star size={10} fill="currentColor" /> {app.score.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Release date */}
        {app.releasedDate && (
          <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
            <span className="text-gray-300 text-xs font-medium">
              {new Date(app.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-gray-600 text-[10px]">Released</span>
          </div>
        )}

        {/* Est Daily */}
        <div className="hidden md:flex flex-col items-end shrink-0 text-right w-20">
          <span className="text-purple-400 text-xs font-semibold">~{formatNumber(app.estDailyInstalls)}</span>
          <span className="text-gray-600 text-[10px]">Est. Daily</span>
        </div>

        <ChevronDown size={14} className="text-gray-700 group-hover:text-gray-400 shrink-0" />
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

// Default category per store
const DEFAULT_CATEGORY: Record<Store, string> = {
  google: 'GAME',
  apple:  'GAME',
  amazon: 'GAME',
};

export default function NewReleasesPage() {
  const [store, setStore]      = useState<Store>('google');
  const [apps, setApps]        = useState<any[]>([]);
  const [loading, setLoading]  = useState(true);
  const [source, setSource]    = useState('');
  const [error, setError]      = useState('');
  const [country, setCountry]  = useState('us');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY.google);
  const [num, setNum]          = useState(50);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Today: true, 'This Week': true });
  const [selectedDate, setSelectedDate] = useState<string>('');

  const prevStore = useRef<Store>('google');

  // Reset expandedGroups and category when store changes
  useEffect(() => {
    if (prevStore.current !== store) {
      prevStore.current = store;
      setCategory(DEFAULT_CATEGORY[store]);
      setSelectedDate('');
      setExpandedGroups({ Today: true, 'This Week': true });
    }
  }, [store]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      store, country, category, num: String(num), type: 'free',
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
  }, [store, country, category, num]);

  useEffect(() => { load(); }, [load]);

  // Filter apps by selected date
  const filteredApps = selectedDate
    ? apps.filter(app => app.releasedDate === selectedDate)
    : apps;

  const dateGroups = groupByDate(filteredApps);
  const totalApps = filteredApps.length;

  // Get all unique dates from apps for calendar
  const availableDates = [...new Set(apps.filter(a => a.releasedDate).map(a => a.releasedDate))].sort().reverse();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">New Releases</h1>
            <p className="text-gray-500 text-xs">Recently launched apps sorted by release date</p>
          </div>
        </div>

        {/* Store tabs */}
        <div className="flex bg-[#1a1d24] border border-gray-700/60 rounded-xl overflow-hidden w-fit">
          {STORE_TABS.map(({ id, label, Icon, activeClass }) => (
            <button key={id} onClick={() => setStore(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
                ${store === id ? activeClass : 'text-gray-400 hover:text-white'}`}>
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select value={num} onChange={e => setNum(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>

        {/* Date picker */}
        {availableDates.length > 0 && (
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={availableDates[availableDates.length - 1]}
              max={availableDates[0]}
              className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 hover:border-purple-500 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && apps.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Package size={11} /> {totalApps}/{apps.length} apps</span>
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {apps.filter(a => a.hasRealDate).length} with dates
          </span>
          {selectedDate && (
            <span className="flex items-center gap-1 text-purple-400">
              📅 {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading new releases…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm text-center">
          Error: {error}
        </div>
      )}

      {/* Unconfigured */}
      {!loading && source === 'unconfigured' && (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm font-medium mb-1">DataForSEO not configured</p>
          <p className="text-gray-600 text-xs">Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to enable real release dates for Google Play.</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && source !== 'unconfigured' && totalApps === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm">No new releases found for selected filters</div>
      )}

      {/* Date-grouped apps */}
      {!loading && totalApps > 0 && dateGroups.map((group, gi) => (
        <div key={gi} className="mb-4 border border-gray-800/60 rounded-2xl overflow-hidden bg-gray-900/40">
          {/* Group header */}
          <button
            onClick={() => setExpandedGroups(p => ({ ...p, [group.label]: !p[group.label] }))}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition-colors border-b border-gray-800/40"
          >
            <div className="flex items-center gap-2">
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedGroups[group.label] ? '' : '-rotate-90'}`} />
              <span className="font-semibold text-white text-sm">{group.label}</span>
              <span className="text-gray-500 text-xs">({group.apps.length})</span>
              {group.dateRange && <span className="text-gray-600 text-xs ml-2">{group.dateRange}</span>}
            </div>
          </button>

          {/* Apps list */}
          {expandedGroups[group.label] && (
            <div className="divide-y divide-gray-800/30">
              {group.apps.map((app, i) => (
                <AppRow key={app.appId} app={app} rank={i + 1} store={store} />
              ))}
            </div>
          )}
        </div>
      ))}

      {totalApps > 0 && !loading && (
        <p className="text-gray-700 text-xs text-center mt-4">
          {source === 'apple' && '100% real dates from Apple App Store RSS feed'}
          {source === 'dataforseo' && 'Release dates from DataForSEO · Top 20 apps verified'}
          {source === 'amazon' && 'Apps from Amazon Appstore · Dates not available'}
        </p>
      )}
    </div>
  );
}
