'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bookmark, Plus, Star, Loader2, ChevronRight, Sparkles, Trophy,
  Gamepad2, Puzzle, Zap, Heart, Briefcase, TrendingUp, DollarSign,
  MessageCircle, Package, BookOpen, X,
} from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

// ── Store icons ──────────────────────────────────────────────────────────────
function GPIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3.18 23.76c.36.2.8.22 1.18.04L16.84 12 4.36.2C3.98.02 3.54.04 3.18.24A1.5 1.5 0 002.4 1.6v20.8c0 .56.3 1.07.78 1.36z" fill="#4285F4"/>
      <path d="M20.82 10.6l-3.06-1.76L14.3 12l3.46 3.16 3.06-1.76a1.5 1.5 0 000-2.8z" fill="#FBBC05"/>
      <path d="M4.36.2l13.4 7.72-3.46 3.16L3.18.24C3.54.04 3.98.02 4.36.2z" fill="#34A853"/>
      <path d="M3.18 23.76l10.12-9.08 3.46 3.16L4.36 23.8c-.38.18-.82.16-1.18-.04z" fill="#EA4335"/>
    </svg>
  );
}
function ASIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#60a5fa">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Curated collection definitions ──────────────────────────────────────────
const CURATED = [
  {
    id: 'new-free',
    label: '🆕 New Free Apps',
    desc: 'Recently published free apps across all categories',
    gradient: 'from-emerald-600/25 to-teal-600/15',
    border: 'border-emerald-600/30',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    Icon: Sparkles,
    gpParams:  { category: 'APPLICATION', collection: 'TOP_NEW_FREE', sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'APPLICATION', collection: 'NEW_FREE',     sortBy: 'release',  sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer&collection=${store === 'apple' ? 'NEW_FREE' : 'TOP_NEW_FREE'}`,
  },
  {
    id: 'new-games',
    label: '🎮 New Games',
    desc: 'Freshly launched mobile games',
    gradient: 'from-purple-600/25 to-indigo-600/15',
    border: 'border-purple-600/30',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    Icon: Gamepad2,
    gpParams:  { category: 'GAME',        collection: 'TOP_NEW_FREE', sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'GAME',        collection: 'NEW_FREE',     sortBy: 'release',  sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer&collection=${store === 'apple' ? 'NEW_FREE' : 'TOP_NEW_FREE'}`,
  },
  {
    id: 'top-free',
    label: '🏆 Top Free Apps',
    desc: 'Most downloaded free apps right now',
    gradient: 'from-blue-600/25 to-cyan-600/15',
    border: 'border-blue-600/30',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    Icon: Trophy,
    gpParams:  { category: 'APPLICATION', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'APPLICATION', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'top-grossing',
    label: '💸 Top Grossing',
    desc: 'Apps generating the most revenue globally',
    gradient: 'from-amber-600/25 to-yellow-600/15',
    border: 'border-amber-600/30',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    Icon: TrendingUp,
    gpParams:  { category: 'APPLICATION', collection: 'GROSSING',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'APPLICATION', collection: 'GROSSING',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'top-paid',
    label: '💵 Top Paid Apps',
    desc: 'Best-selling paid apps worth every penny',
    gradient: 'from-green-600/25 to-lime-600/15',
    border: 'border-green-600/30',
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    Icon: DollarSign,
    gpParams:  { category: 'APPLICATION', collection: 'TOP_PAID',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'APPLICATION', collection: 'TOP_PAID',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'casual',
    label: '🎯 Casual Games',
    desc: 'Easy-to-pick-up games for everyone',
    gradient: 'from-pink-600/25 to-rose-600/15',
    border: 'border-pink-600/30',
    iconBg: 'bg-pink-500/15',
    iconColor: 'text-pink-400',
    Icon: Zap,
    gpParams:  { category: 'GAME_CASUAL', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'GAME_CASUAL', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'puzzle',
    label: '🧩 Puzzle Games',
    desc: 'Brain-teasing puzzle games trending now',
    gradient: 'from-violet-600/25 to-purple-600/15',
    border: 'border-violet-600/30',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    Icon: Puzzle,
    gpParams:  { category: 'GAME_PUZZLE', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'GAME_PUZZLE', collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'social',
    label: '💬 Social Apps',
    desc: 'Top social networking and messaging apps',
    gradient: 'from-sky-600/25 to-blue-600/15',
    border: 'border-sky-600/30',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    Icon: MessageCircle,
    gpParams:  { category: 'SOCIAL',      collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'SOCIAL',      collection: 'TOP_FREE',     sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'productivity',
    label: '📊 Productivity',
    desc: 'Apps that help you work smarter',
    gradient: 'from-orange-600/25 to-amber-600/15',
    border: 'border-orange-600/30',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    Icon: Briefcase,
    gpParams:  { category: 'PRODUCTIVITY', collection: 'TOP_FREE',    sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'PRODUCTIVITY', collection: 'TOP_FREE',    sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'entertainment',
    label: '🎬 Entertainment',
    desc: 'Streaming, video and entertainment apps',
    gradient: 'from-red-600/25 to-rose-600/15',
    border: 'border-red-600/30',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    Icon: Package,
    gpParams:  { category: 'ENTERTAINMENT', collection: 'TOP_FREE',   sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'ENTERTAINMENT', collection: 'TOP_FREE',   sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'health',
    label: '💪 Health & Fitness',
    desc: 'Workout, wellness and health tracking apps',
    gradient: 'from-teal-600/25 to-emerald-600/15',
    border: 'border-teal-600/30',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    Icon: Heart,
    gpParams:  { category: 'HEALTH_AND_FITNESS', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'HEALTH_AND_FITNESS', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
  {
    id: 'education',
    label: '📚 Education',
    desc: 'Learn something new every day',
    gradient: 'from-indigo-600/25 to-blue-600/15',
    border: 'border-indigo-600/30',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    Icon: BookOpen,
    gpParams:  { category: 'EDUCATION', collection: 'TOP_FREE',        sortBy: 'installs', sortOrder: 'desc', num: '8' },
    iosParams: { category: 'EDUCATION', collection: 'TOP_FREE',        sortBy: 'installs', sortOrder: 'desc', num: '8', store: 'apple' },
    href: (store: string) => `/market?store=${store}&view=explorer`,
  },
] as const;

// ── Helper: build API URL from params ────────────────────────────────────────
function buildUrl(params: Record<string, string>, store: string) {
  const p = new URLSearchParams({ ...params, store });
  return `/api/market?${p}`;
}

// ── New Releases card ────────────────────────────────────────────────────────
function NewReleaseCard({ app, store }: { app: any; store: string }) {
  const href = store === 'apple'
    ? `https://apps.apple.com/app/id${app.numericId}`
    : `/app?id=${app.appId}`;
  const isExternal = store === 'apple';

  return (
    <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
      className="flex-shrink-0 w-36 bg-gray-900 border border-gray-800 hover:border-purple-600/60 rounded-xl p-3 transition-all group">
      <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
        className="w-full aspect-square rounded-xl object-cover border border-gray-800 mb-2 group-hover:scale-[1.02] transition-transform" />
      <p className="text-white text-xs font-semibold truncate leading-tight">{app.title}</p>
      <p className="text-gray-500 text-[10px] truncate mt-0.5">{app.developer}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-gray-600 truncate">{app.releasedDate}</span>
        {app.score ? (
          <span className="flex items-center gap-0.5 text-yellow-400 text-[10px] shrink-0">
            <Star size={8} fill="currentColor" /> {app.score.toFixed(1)}
          </span>
        ) : null}
      </div>
    </a>
  );
}

// ── Collection card with live icon previews ──────────────────────────────────
function CollectionCard({ col, store }: { col: typeof CURATED[number]; store: string }) {
  const [icons, setIcons] = useState<string[]>([]);

  useEffect(() => {
    setIcons([]); // reset when store changes
    const params = store === 'apple' ? { ...col.iosParams } : { ...col.gpParams };
    const p = new URLSearchParams({ ...params, store, num: '6' });
    fetch(`/api/market?${p}`)
      .then(r => r.json())
      .then(d => setIcons((d.apps || []).slice(0, 6).map((a: any) => a.icon)))
      .catch(() => {});
  }, [store, col.id]);

  return (
    <div className={`bg-gray-900/50 border ${col.border} rounded-2xl p-4 hover:bg-gray-900 transition-all group flex flex-col gap-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${col.iconBg} border ${col.border} flex items-center justify-center`}>
          <col.Icon size={17} className={col.iconColor} />
        </div>
        <Link href={col.href(store)}
          className="flex items-center gap-0.5 text-gray-600 hover:text-purple-400 text-[11px] transition-colors mt-0.5">
          View All <ChevronRight size={11} />
        </Link>
      </div>

      <div>
        <h3 className="text-white font-semibold text-sm leading-tight">{col.label}</h3>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{col.desc}</p>
      </div>

      {/* App icon previews */}
      <div className="flex gap-1.5 items-center flex-wrap min-h-[36px]">
        {icons.length > 0 ? (
          icons.map((icon, i) => (
            <img key={i} src={icon} alt="" referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-gray-700/60 shrink-0" />
          ))
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg bg-gradient-to-br ${col.gradient} border ${col.border} animate-pulse`} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Create collection modal ──────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, desc: string) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d26] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Create Collection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X size={17} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Hyper Casual Competitors"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 block">Description (optional)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What is this collection for?" rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
          <button disabled={!name.trim()} onClick={() => name.trim() && onCreate(name.trim(), desc.trim())}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  const [store, setStore] = useState<'google' | 'apple'>('google');
  const [newApps, setNewApps] = useState<any[]>([]);
  const [newLoading, setNewLoading] = useState(true);
  const [newSource, setNewSource] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [customCols, setCustomCols] = useState<{ id: string; name: string; desc: string }[]>([]);

  // Load custom collections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('appspy_collections');
      if (saved) setCustomCols(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Fetch new releases — uses /api/new-releases (DataForSEO for Google, Apple RSS for Apple)
  const fetchNew = useCallback(() => {
    setNewLoading(true);
    setNewApps([]);
    const params = new URLSearchParams({
      store,
      category: 'APPLICATION',
      country:  'us',
      num:      '30',
      type:     'free',
    });
    fetch(`/api/new-releases?${params}`)
      .then(r => r.json())
      .then(d => { setNewApps(d.apps || []); setNewSource(d.source || ''); })
      .catch(() => { setNewApps([]); setNewSource('error'); })
      .finally(() => setNewLoading(false));
  }, [store]);

  useEffect(() => { fetchNew(); }, [fetchNew]);

  function createCollection(name: string, desc: string) {
    const updated = [...customCols, { id: `col_${Date.now()}`, name, desc }];
    setCustomCols(updated);
    localStorage.setItem('appspy_collections', JSON.stringify(updated));
    setShowCreate(false);
  }

  function deleteCollection(id: string) {
    const updated = customCols.filter(c => c.id !== id);
    setCustomCols(updated);
    localStorage.setItem('appspy_collections', JSON.stringify(updated));
  }

  const storeName = store === 'google' ? 'Google Play' : 'App Store';

  return (
    <div className="bg-[#0d0f14] text-white min-h-full">
      {/* Page heading — no duplicate header bar */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark size={22} className="text-pink-400" /> Collections
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Curated app lists and your custom watchlists</p>
        </div>

        {/* Store switcher */}
        <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700/60 rounded-xl p-1">
          <button onClick={() => setStore('google')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${store === 'google' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            <GPIcon size={14} /> Google Play
          </button>
          <button onClick={() => setStore('apple')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${store === 'apple' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            <ASIcon size={14} /> App Store
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-10">

        {/* ── New Releases ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Sparkles size={17} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">New Releases</h2>
                <p className="text-gray-500 text-xs">Freshly published apps on {storeName}</p>
              </div>
            </div>
            <Link href={`/market?store=${store}&view=explorer`}
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm transition-colors">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {/* Data source badge */}
          {!newLoading && newApps.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              {newSource === 'dataforseo' && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  ✓ DataForSEO — real dates
                </span>
              )}
              {newSource === 'apple-rss' && (
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  ✓ Apple RSS — real dates
                </span>
              )}
            </div>
          )}

          {newLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-6 pl-1">
              <Loader2 className="animate-spin" size={15} />
              <span className="text-sm">Loading new releases from {storeName}…</span>
            </div>
          ) : newSource === 'unconfigured' ? (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-5 text-sm">
              <p className="text-amber-400 font-semibold mb-1">⚙️ DataForSEO not configured</p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Add <code className="bg-gray-800 px-1 rounded">DATAFORSEO_LOGIN</code> and{' '}
                <code className="bg-gray-800 px-1 rounded">DATAFORSEO_PASSWORD</code> to{' '}
                <code className="bg-gray-800 px-1 rounded">.env.local</code> to enable Google Play new releases.
                <br />Get credentials from{' '}
                <a href="https://app.dataforseo.com/api-access" target="_blank" rel="noopener noreferrer"
                  className="text-amber-400 underline">app.dataforseo.com/api-access</a>
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
              {newApps.map(app => (
                <NewReleaseCard key={app.appId} app={app} store={store} />
              ))}
            </div>
          )}
        </section>

        {/* ── Curated Collections ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Trophy size={17} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Curated Collections</h2>
              <p className="text-gray-500 text-xs">Pre-built lists — updates automatically when you switch stores</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CURATED.map(col => (
              <CollectionCard key={`${col.id}-${store}`} col={col} store={store} />
            ))}
          </div>
        </section>

        {/* ── My Collections ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-pink-500/15 border border-pink-500/30 rounded-xl flex items-center justify-center">
                <Bookmark size={17} className="text-pink-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">My Collections</h2>
                <p className="text-gray-500 text-xs">Your custom app watchlists</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-xl transition-colors">
              <Plus size={14} /> Create Collection
            </button>
          </div>

          {customCols.length === 0 ? (
            <div className="border border-dashed border-gray-700 rounded-2xl p-10 text-center">
              <Bookmark size={30} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 text-sm font-medium">No collections yet</p>
              <p className="text-gray-600 text-xs mt-1 mb-4">Group apps together to track and compare them</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2.5 rounded-xl transition-colors">
                <Plus size={14} /> Create Your First Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {customCols.map(col => (
                <div key={col.id}
                  className="bg-gray-900/50 border border-gray-700/60 rounded-2xl p-4 hover:border-purple-600/40 transition-all group flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
                      <Bookmark size={17} className="text-pink-400" />
                    </div>
                    <button onClick={() => deleteCollection(col.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{col.name}</h3>
                    {col.desc && <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{col.desc}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gray-600 text-xs">0 apps</span>
                    <Link href="/search" className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs transition-colors">
                      Add apps <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowCreate(true)}
                className="border border-dashed border-gray-700 hover:border-purple-600/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-purple-400 transition-all min-h-[140px]">
                <Plus size={20} />
                <span className="text-sm">New Collection</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createCollection} />}
    </div>
  );
}
