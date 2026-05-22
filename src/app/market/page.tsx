'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Star, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  LayoutGrid, List, Download, RotateCcw, ChevronDown, X, Filter,
} from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

// --- Store icons ---
function GooglePlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3.18 23.76c.36.2.8.22 1.18.04L16.84 12 4.36.2C3.98.02 3.54.04 3.18.24A1.5 1.5 0 002.4 1.6v20.8c0 .56.3 1.07.78 1.36z" fill="#4285F4"/>
      <path d="M20.82 10.6l-3.06-1.76L14.3 12l3.46 3.16 3.06-1.76a1.5 1.5 0 000-2.8z" fill="#FBBC05"/>
      <path d="M4.36.2l13.4 7.72-3.46 3.16L3.18.24C3.54.04 3.98.02 4.36.2z" fill="#34A853"/>
      <path d="M3.18 23.76l10.12-9.08 3.46 3.16L4.36 23.8c-.38.18-.82.16-1.18-.04z" fill="#EA4335"/>
    </svg>
  );
}

function AppleStoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#60a5fa">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// --- Constants ---
const STORE_STATS = {
  google: { totalApps: '5.62m', removed: '2.9m', developers: '1.81m', totalInstalls: '1.78t', dailyInstalls: '1.38b', from: '22 Oct 2008' },
  apple:  { totalApps: '1.96m', removed: '1.4m',  developers: '0.82m', totalInstalls: '0.84t', dailyInstalls: '0.62b', from: '10 Jul 2008' },
};

const CATEGORIES = [
  { value: 'APPLICATION', label: 'All Apps' }, { value: 'GAME', label: 'All Games' },
  { value: 'GAME_ACTION', label: 'Action' }, { value: 'GAME_ARCADE', label: 'Arcade' },
  { value: 'GAME_CASUAL', label: 'Casual' }, { value: 'GAME_PUZZLE', label: 'Puzzle' },
  { value: 'GAME_STRATEGY', label: 'Strategy' }, { value: 'GAME_RACING', label: 'Racing' },
  { value: 'GAME_SPORTS', label: 'Sports' }, { value: 'GAME_ROLE_PLAYING', label: 'RPG' },
  { value: 'GAME_SIMULATION', label: 'Simulation' }, { value: 'GAME_ADVENTURE', label: 'Adventure' },
  { value: 'COMMUNICATION', label: 'Communication' }, { value: 'SOCIAL', label: 'Social' },
  { value: 'TOOLS', label: 'Tools' }, { value: 'PRODUCTIVITY', label: 'Productivity' },
  { value: 'EDUCATION', label: 'Education' }, { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'FINANCE', label: 'Finance' },
];

const GOOGLE_COLLECTIONS = [
  { value: 'TOP_FREE',       label: 'Top Free' },
  { value: 'TOP_PAID',       label: 'Top Paid' },
  { value: 'GROSSING',       label: 'Top Grossing' },
  { value: 'TOP_NEW_FREE',   label: '🆕 Top New Free' },
  { value: 'TOP_NEW_PAID',   label: '🆕 Top New Paid' },
  { value: 'MOVERS_SHAKERS', label: '📈 Movers & Shakers' },
];

const APPLE_COLLECTIONS = [
  { value: 'TOP_FREE',  label: 'Top Free' },
  { value: 'TOP_PAID',  label: 'Top Paid' },
  { value: 'GROSSING',  label: 'Top Grossing' },
  { value: 'NEW_FREE',  label: '🆕 New Free Apps' },
  { value: 'NEW_PAID',  label: '🆕 New Paid Apps' },
];

const COUNTRIES = [
  { value: 'us', flag: '🇺🇸', label: 'United States' }, { value: 'gb', flag: '🇬🇧', label: 'United Kingdom' },
  { value: 'in', flag: '🇮🇳', label: 'India' }, { value: 'pk', flag: '🇵🇰', label: 'Pakistan' },
  { value: 'de', flag: '🇩🇪', label: 'Germany' }, { value: 'br', flag: '🇧🇷', label: 'Brazil' },
  { value: 'jp', flag: '🇯🇵', label: 'Japan' }, { value: 'kr', flag: '🇰🇷', label: 'Korea' },
  { value: 'ru', flag: '🇷🇺', label: 'Russia' }, { value: 'fr', flag: '🇫🇷', label: 'France' },
  { value: 'tr', flag: '🇹🇷', label: 'Turkey' }, { value: 'id', flag: '🇮🇩', label: 'Indonesia' },
  { value: 'au', flag: '🇦🇺', label: 'Australia' }, { value: 'ca', flag: '🇨🇦', label: 'Canada' },
];

// Sort options — "Release Date" only for Apple (Google Play list has no real dates)
const SORT_OPTIONS_GOOGLE = [
  { value: 'installs', label: 'Installs' },
  { value: 'daily', label: 'Est. Daily Installs' },
  { value: 'rating', label: 'Rating' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'name', label: 'App Name' },
];
const SORT_OPTIONS_APPLE = [
  { value: 'release', label: 'Release Date' },
  ...SORT_OPTIONS_GOOGLE,
];

// --- Stat card ---
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// --- Sort header button ---
function SortTh({ col, label, sortBy, sortOrder, onSort }: {
  col: string; label: string; sortBy: string; sortOrder: string;
  onSort: (col: string) => void;
}) {
  const active = sortBy === col;
  return (
    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
      <button onClick={() => onSort(col)}
        className={`flex items-center gap-1 hover:text-white transition-colors ${active ? 'text-purple-400' : ''}`}>
        {label}
        {active
          ? sortOrder === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />
          : <ArrowUpDown size={10} className="opacity-40" />}
      </button>
    </th>
  );
}

// --- Main explorer content ---
function ExplorerView({ store, filters, setFilters }: {
  store: string;
  filters: any;
  setFilters: (f: any) => void;
}) {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('installs');
  const [sortOrder, setSortOrder] = useState('desc');
  const isApple = store === 'apple';
  const SORT_OPTIONS  = isApple ? SORT_OPTIONS_APPLE : SORT_OPTIONS_GOOGLE;
  const COLLECTIONS   = isApple ? APPLE_COLLECTIONS  : GOOGLE_COLLECTIONS;
  // Google has real dates for DataForSEO collections (TOP_NEW_FREE etc); Apple always has dates
  const DFS_COLS      = new Set(['TOP_NEW_FREE', 'TOP_NEW_PAID', 'MOVERS_SHAKERS']);
  const hasRealDates  = isApple || DFS_COLS.has(filters.collection);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        store,
        category: filters.category, collection: filters.collection,
        country: filters.country, num: String(filters.num),
        sortBy, sortOrder,
      });
      const data = await fetch(`/api/market?${p}`).then(r => r.json());
      setApps(data.apps || []);
    } catch { setApps([]); }
    finally { setLoading(false); }
  }, [store, filters, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(col: string) {
    if (sortBy === col) setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortOrder('desc'); }
  }

  function exportCSV() {
    const hdrs = hasRealDates
      ? ['#', 'App ID', 'Title', 'Developer', 'Released', 'Age', 'Installs', 'Est. Daily', 'Rating', 'Reviews', 'Category']
      : ['#', 'App ID', 'Title', 'Developer', 'Installs', 'Est. Daily', 'Rating', 'Reviews', 'Category'];
    const rows = apps.map((a, i) => hasRealDates
      ? [i+1, a.appId, `"${a.title}"`, `"${a.developer}"`, a.releasedDate||'', a.ageText||'', a.installs||'', a.estDailyInstalls, a.score||0, a.reviews, a.genre||'']
      : [i+1, a.appId, `"${a.title}"`, `"${a.developer}"`, a.installs||'', a.estDailyInstalls, a.score||0, a.reviews, a.genre||'']
    );
    const csv = [hdrs, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `appspy-market-${store}-${Date.now()}.csv` }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setShowFilterPanel(v => !v)}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
          <Filter size={13} /> Filters
          {showFilterPanel && <X size={12} className="ml-1" />}
        </button>

        {/* Sort By dropdown */}
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="appearance-none bg-gray-800 border border-gray-700 text-white text-sm pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort order toggle */}
        <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-white px-3 py-2 rounded-lg transition-colors">
          {sortOrder === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
          {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        </button>

        <button onClick={() => { setSortBy('installs'); setSortOrder('desc'); setFilters({ category: 'APPLICATION', collection: 'TOP_FREE', country: 'us', num: 100 }); }}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors">
          <RotateCcw size={13} /> Reset
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <Download size={13} /> Export CSV
          </button>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')}
              className={`px-2.5 py-2 transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`px-2.5 py-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide mb-1.5 block">Category</label>
            <select value={filters.category} onChange={e => setFilters((f: any) => ({ ...f, category: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide mb-1.5 block">Chart Type</label>
            <select value={filters.collection} onChange={e => setFilters((f: any) => ({ ...f, collection: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none">
              {COLLECTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide mb-1.5 block">Country</label>
            <select value={filters.country} onChange={e => setFilters((f: any) => ({ ...f, country: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none">
              {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.flag} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide mb-1.5 block">Results: {filters.num}</label>
            <input type="range" min={20} max={200} step={20} value={filters.num}
              onChange={e => setFilters((f: any) => ({ ...f, num: parseInt(e.target.value) }))}
              className="w-full accent-purple-500 mt-3" />
          </div>
        </div>
      )}

      {/* Info notices */}
      {!hasRealDates && !loading && apps.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 text-amber-400/80 text-xs rounded-lg px-4 py-2.5 mb-4">
          <span className="text-amber-500 text-base leading-none mt-0.5">ℹ</span>
          <span>
            <strong className="text-amber-400">Release dates unavailable for this Google Play chart.</strong>{' '}
            Google's public API does not expose release dates in bulk chart results.
            Use <strong>🆕 Top New Free</strong> or <strong>🆕 Top New Paid</strong> from the Chart Type filter to see apps with real release dates (powered by DataForSEO).
          </span>
        </div>
      )}
      {hasRealDates && !isApple && !loading && apps.length > 0 && DFS_COLS.has(filters.collection) && (
        <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400/80 text-xs rounded-lg px-4 py-2 mb-4">
          <span className="text-emerald-400">✓</span>
          <span>Real release dates powered by <strong className="text-emerald-400">DataForSEO</strong> — Google Play {GOOGLE_COLLECTIONS.find(c => c.value === filters.collection)?.label} chart</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={18} /> Fetching apps…
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 border-b border-gray-700">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-10">#</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">App</th>
                  {hasRealDates && <SortTh col="release" label="Released" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />}
                  {hasRealDates && <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Age</th>}
                  <SortTh col="installs" label="Installs" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                  <SortTh col="daily" label="Est. Daily" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                  <SortTh col="rating" label="Rating" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                  <SortTh col="reviews" label="Reviews" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {apps.map((app, i) => (
                  <tr key={app.appId} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-3 py-3 text-gray-500 text-sm">{i + 1}</td>
                    <td className="px-3 py-3">
                      <Link href={`/app?id=${app.appId}`} className="flex items-center gap-3 group">
                        <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl shrink-0 object-cover border border-gray-700" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors truncate max-w-[200px]">{app.title}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[200px]">{app.developer}</p>
                        </div>
                      </Link>
                    </td>
                    {hasRealDates && (
                      <td className="px-3 py-3 text-gray-400 text-sm whitespace-nowrap">
                        {app.hasRealDate ? app.releasedDate : <span className="text-gray-700">—</span>}
                      </td>
                    )}
                    {hasRealDates && (
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {app.hasRealDate ? app.ageText : <span className="text-gray-700">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-3 text-gray-300 text-sm whitespace-nowrap">{app.installs || '—'}</td>
                    <td className="px-3 py-3 text-blue-400 text-sm whitespace-nowrap">
                      ~{formatNumber(app.estDailyInstalls)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {app.score ? (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star size={11} fill="currentColor" /> {app.score.toFixed(1)}
                        </span>
                      ) : <span className="text-gray-600 text-sm">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-sm">{app.reviews ? formatNumber(app.reviews) : '0'}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{app.genre || '—'}</td>
                    <td className="px-3 py-3">
                      <span className="bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">Live</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {apps.map(app => (
            <Link key={app.appId} href={`/app?id=${app.appId}`}
              className="bg-gray-900 border border-gray-800 hover:border-purple-600 rounded-xl p-3 transition-colors">
              <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
                className="w-full aspect-square rounded-xl object-cover mb-2 border border-gray-800" />
              <p className="text-white text-xs font-semibold truncate">{app.title}</p>
              <p className="text-gray-500 text-xs truncate">{app.developer}</p>
              <div className="flex items-center justify-between mt-1.5">
                {app.score ? (
                  <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                    <Star size={9} fill="currentColor" /> {app.score.toFixed(1)}
                  </span>
                ) : <span />}
                <span className="text-blue-400 text-xs">~{formatNumber(app.estDailyInstalls)}/d</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// --- Real-Time Store Search view ---
function SearchView({ store, country }: { store: string; country: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetch(`/api/search?q=${encodeURIComponent(q)}&country=${country}`).then(r => r.json());
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <>
      <form onSubmit={e => { e.preventDefault(); doSearch(query); }} className="flex gap-3 mb-6 max-w-2xl">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search apps by name or keyword…"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm" />
        </div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={16} /> Searching {store === 'google' ? 'Google Play' : 'App Store'}…
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-gray-500 py-16">No results for "{query}"</p>
      )}

      {!loading && results.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <p className="text-gray-400 text-sm">{results.length} results for <span className="text-white">"{query}"</span></p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">App</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Installs</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Daily Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {results.map((app, i) => (
                <tr key={app.appId} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-sm">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/app?id=${app.appId}`} className="flex items-center gap-3 group">
                      <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl shrink-0 object-cover border border-gray-700" />
                      <div>
                        <p className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors">{app.title}</p>
                        <p className="text-gray-500 text-xs">{app.developer}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{app.genre || '—'}</td>
                  <td className="px-4 py-3">
                    {app.score ? (
                      <span className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star size={11} fill="currentColor" /> {app.score.toFixed(1)}
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{app.installs || '—'}</td>
                  <td className="px-4 py-3 text-blue-400 text-sm">
                    ~{formatNumber(estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country))}/day
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searched && (
        <div className="text-center py-20 text-gray-600">
          <Search size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Search any app on {store === 'google' ? 'Google Play' : 'App Store'} in real time</p>
        </div>
      )}
    </>
  );
}

// --- Page content with searchParams ---
function MarketContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = (searchParams.get('store') || 'google') as 'google' | 'apple';
  const view = (searchParams.get('view') || 'explorer') as 'explorer' | 'search';
  const [filters, setFilters] = useState({ category: 'APPLICATION', collection: 'TOP_FREE', country: 'us', num: 100 });

  const stats = STORE_STATS[store];
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  function nav(newStore?: string, newView?: string) {
    const p = new URLSearchParams({ store: newStore || store, view: newView || view });
    router.push(`/market?${p}`);
  }

  const storeBtnBase = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {/* Top nav bar */}
      <div className="border-b border-gray-800 bg-[#111318] px-6">
        <div className="flex items-center gap-0">
          {/* Store switcher */}
          <div className="flex items-center gap-1 mr-6 py-3">
            <button onClick={() => nav('google')} className={`${storeBtnBase} ${store === 'google' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <GooglePlayIcon size={15} /> Google Play
            </button>
            <button onClick={() => nav('apple')} className={`${storeBtnBase} ${store === 'apple' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <AppleStoreIcon size={15} /> App Store
            </button>
          </div>

          <div className="w-px h-7 bg-gray-700/60 mr-4" />

          {/* View tabs */}
          <button onClick={() => nav(undefined, 'explorer')}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${view === 'explorer' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            App Market Explorer
          </button>
          <button onClick={() => nav(undefined, 'search')}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${view === 'search' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Real-Time Store Search
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-800 bg-[#111318]/60 px-6 py-4">
        <div className="flex items-center gap-8 overflow-x-auto">
          <StatCard value={stats.totalApps} label="Apps" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={stats.removed} label="Removed" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={stats.developers} label="Developers" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={stats.totalInstalls} label="Total Installs" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={stats.dailyInstalls} label="Daily Installs" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={stats.from} label="From" />
          <div className="w-px h-8 bg-gray-800 shrink-0" />
          <StatCard value={today} label="To" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {view === 'explorer'
          ? <ExplorerView store={store} filters={filters} setFilters={setFilters} />
          : <SearchView store={store} country={filters.country} />
        }
      </div>
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading…
      </div>
    }>
      <MarketContent />
    </Suspense>
  );
}
