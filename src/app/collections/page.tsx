'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark, Plus, Star, Loader2, ChevronRight, Sparkles,
  Flame, Trophy, Package, Gamepad2, Puzzle, Zap, ShoppingBag,
  Music, Camera, Heart, Briefcase, Globe, TrendingUp, X,
  BookOpen, Utensils, Plane, DollarSign, MessageCircle,
} from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

// --- Google Play + Apple icons ---
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

// --- Curated collection definitions ---
const CURATED = [
  {
    id: 'new-free',
    label: '🆕 New Free Apps',
    desc: 'Recently published free apps across all categories',
    color: 'from-emerald-600/30 to-teal-600/20',
    border: 'border-emerald-600/30',
    iconColor: 'text-emerald-400',
    Icon: Sparkles,
    href: '/market?store=google&view=explorer&sortBy=release&sortOrder=desc',
    params: { category: 'APPLICATION', collection: 'TOP_FREE', sortBy: 'release', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'new-games',
    label: '🎮 New Games',
    desc: 'Freshly launched mobile games on Google Play',
    color: 'from-purple-600/30 to-indigo-600/20',
    border: 'border-purple-600/30',
    iconColor: 'text-purple-400',
    Icon: Gamepad2,
    href: '/market?store=google&view=explorer',
    params: { category: 'GAME', collection: 'TOP_FREE', sortBy: 'release', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'top-free',
    label: '🏆 Top Free Apps',
    desc: 'Most downloaded free apps right now',
    color: 'from-blue-600/30 to-cyan-600/20',
    border: 'border-blue-600/30',
    iconColor: 'text-blue-400',
    Icon: Trophy,
    href: '/market?store=google&view=explorer',
    params: { category: 'APPLICATION', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'top-grossing',
    label: '💸 Top Grossing',
    desc: 'Apps generating the most revenue globally',
    color: 'from-amber-600/30 to-yellow-600/20',
    border: 'border-amber-600/30',
    iconColor: 'text-amber-400',
    Icon: TrendingUp,
    href: '/market?store=google&view=explorer',
    params: { category: 'APPLICATION', collection: 'GROSSING', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'top-paid',
    label: '💵 Top Paid Apps',
    desc: 'Best-selling paid apps worth every penny',
    color: 'from-green-600/30 to-lime-600/20',
    border: 'border-green-600/30',
    iconColor: 'text-green-400',
    Icon: DollarSign,
    href: '/market?store=google&view=explorer',
    params: { category: 'APPLICATION', collection: 'TOP_PAID', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'casual-games',
    label: '🎯 Casual Games',
    desc: 'Easy-to-pick-up games for everyone',
    color: 'from-pink-600/30 to-rose-600/20',
    border: 'border-pink-600/30',
    iconColor: 'text-pink-400',
    Icon: Zap,
    href: '/market?store=google&view=explorer',
    params: { category: 'GAME_CASUAL', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'puzzle-games',
    label: '🧩 Puzzle Games',
    desc: 'Brain-teasing puzzle games trending now',
    color: 'from-violet-600/30 to-purple-600/20',
    border: 'border-violet-600/30',
    iconColor: 'text-violet-400',
    Icon: Puzzle,
    href: '/market?store=google&view=explorer',
    params: { category: 'GAME_PUZZLE', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'social',
    label: '💬 Social Apps',
    desc: 'Top social networking and messaging apps',
    color: 'from-sky-600/30 to-blue-600/20',
    border: 'border-sky-600/30',
    iconColor: 'text-sky-400',
    Icon: MessageCircle,
    href: '/market?store=google&view=explorer',
    params: { category: 'SOCIAL', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'productivity',
    label: '📊 Productivity',
    desc: 'Apps that help you work smarter',
    color: 'from-orange-600/30 to-amber-600/20',
    border: 'border-orange-600/30',
    iconColor: 'text-orange-400',
    Icon: Briefcase,
    href: '/market?store=google&view=explorer',
    params: { category: 'PRODUCTIVITY', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'entertainment',
    label: '🎬 Entertainment',
    desc: 'Streaming, video and entertainment apps',
    color: 'from-red-600/30 to-rose-600/20',
    border: 'border-red-600/30',
    iconColor: 'text-red-400',
    Icon: Package,
    href: '/market?store=google&view=explorer',
    params: { category: 'ENTERTAINMENT', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'health',
    label: '💪 Health & Fitness',
    desc: 'Workout, wellness and health tracking apps',
    color: 'from-teal-600/30 to-emerald-600/20',
    border: 'border-teal-600/30',
    iconColor: 'text-teal-400',
    Icon: Heart,
    href: '/market?store=google&view=explorer',
    params: { category: 'HEALTH_AND_FITNESS', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
  {
    id: 'education',
    label: '📚 Education',
    desc: 'Learn something new every day',
    color: 'from-indigo-600/30 to-blue-600/20',
    border: 'border-indigo-600/30',
    iconColor: 'text-indigo-400',
    Icon: BookOpen,
    href: '/market?store=google&view=explorer',
    params: { category: 'EDUCATION', collection: 'TOP_FREE', sortBy: 'installs', sortOrder: 'desc', num: '20' },
  },
];

// --- New Releases card ---
function NewReleaseCard({ app, rank }: { app: any; rank: number }) {
  return (
    <Link href={`/app?id=${app.appId}`}
      className="flex-shrink-0 w-40 bg-gray-900 border border-gray-800 hover:border-purple-600 rounded-xl p-3 transition-colors">
      <img src={app.icon} alt={app.title} referrerPolicy="no-referrer"
        className="w-full aspect-square rounded-xl object-cover border border-gray-800 mb-2" />
      <p className="text-white text-xs font-semibold truncate">{app.title}</p>
      <p className="text-gray-500 text-[10px] truncate">{app.developer}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-gray-600">{app.releasedDate}</span>
        {app.score ? (
          <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
            <Star size={9} fill="currentColor" /> {app.score.toFixed(1)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

// --- Collection preview card ---
function CollectionCard({
  collection, previews, loadingId,
}: {
  collection: typeof CURATED[0];
  previews: Record<string, any[]>;
  loadingId: string | null;
}) {
  const apps = previews[collection.id] || [];
  const isLoading = loadingId === collection.id;

  return (
    <div className={`bg-gray-900/60 border ${collection.border} rounded-2xl p-5 hover:bg-gray-900 transition-all group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${collection.color} border ${collection.border} flex items-center justify-center`}>
          <collection.Icon size={18} className={collection.iconColor} />
        </div>
        <Link href={collection.href}
          className="flex items-center gap-1 text-gray-500 hover:text-purple-400 text-xs transition-colors">
          View All <ChevronRight size={12} />
        </Link>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1">{collection.label}</h3>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">{collection.desc}</p>

      {/* App icon previews */}
      <div className="flex gap-2 items-center min-h-[44px]">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-gray-600" />
        ) : apps.length > 0 ? (
          <>
            {apps.slice(0, 5).map(app => (
              <img key={app.appId} src={app.icon} alt={app.title} referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover border border-gray-700 shrink-0" />
            ))}
            {apps.length > 5 && (
              <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-[10px] font-medium">+{apps.length - 5}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-9 h-9 rounded-lg bg-gradient-to-br ${collection.color} border ${collection.border}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Custom collection modal ---
function CreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, desc: string) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d26] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Create Collection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 block">Collection Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Hyper Casual Competitors"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1.5 block">Description (optional)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What is this collection for?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) onCreate(name.trim(), desc.trim()); }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main page ---
export default function CollectionsPage() {
  const [store, setStore] = useState<'google' | 'apple'>('google');
  const [newApps, setNewApps] = useState<any[]>([]);
  const [newLoading, setNewLoading] = useState(true);
  const [previews, setPreviews] = useState<Record<string, any[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customCols, setCustomCols] = useState<{ id: string; name: string; desc: string; apps: any[] }[]>([]);

  // Load custom collections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('appspy_collections');
      if (saved) setCustomCols(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Fetch new releases
  useEffect(() => {
    setNewLoading(true);
    const p = new URLSearchParams({ category: 'APPLICATION', collection: 'TOP_FREE', country: 'us', num: '30', sortBy: 'release', sortOrder: 'desc' });
    fetch(`/api/market?${p}`)
      .then(r => r.json())
      .then(d => setNewApps(d.apps || []))
      .catch(() => setNewApps([]))
      .finally(() => setNewLoading(false));
  }, []);

  // Fetch preview icons for curated collections
  useEffect(() => {
    async function loadPreviews() {
      for (const col of CURATED) {
        setLoadingId(col.id);
        try {
          const p = new URLSearchParams({ ...col.params, num: '6' });
          const d = await fetch(`/api/market?${p}`).then(r => r.json());
          setPreviews(prev => ({ ...prev, [col.id]: d.apps || [] }));
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 200));
      }
      setLoadingId(null);
    }
    loadPreviews();
  }, []);

  function createCollection(name: string, desc: string) {
    const col = { id: `custom_${Date.now()}`, name, desc, apps: [] };
    const updated = [...customCols, col];
    setCustomCols(updated);
    localStorage.setItem('appspy_collections', JSON.stringify(updated));
    setShowCreate(false);
  }

  function deleteCollection(id: string) {
    const updated = customCols.filter(c => c.id !== id);
    setCustomCols(updated);
    localStorage.setItem('appspy_collections', JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111318] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bookmark size={20} className="text-pink-400" /> Collections
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Curated app lists and your custom watchlists</p>
          </div>
          {/* Store switcher */}
          <div className="flex items-center gap-1 bg-gray-800/60 rounded-xl p-1">
            <button onClick={() => setStore('google')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${store === 'google' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <GPIcon size={14} /> Google Play
            </button>
            <button onClick={() => setStore('apple')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${store === 'apple' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              🍎 App Store
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-10 max-w-7xl">

        {/* ── New Releases (featured) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Sparkles size={17} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">New Releases</h2>
                <p className="text-gray-500 text-xs">Freshly published apps on Google Play</p>
              </div>
            </div>
            <Link href="/market?store=google&view=explorer"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm transition-colors">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {newLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-6">
              <Loader2 className="animate-spin" size={16} /> Loading new releases…
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
              {newApps.map((app, i) => (
                <NewReleaseCard key={app.appId} app={app} rank={i + 1} />
              ))}
            </div>
          )}
        </section>

        {/* ── Curated Collections ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Trophy size={17} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Curated Collections</h2>
              <p className="text-gray-500 text-xs">Pre-built lists across categories and chart types</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CURATED.map(col => (
              <CollectionCard key={col.id} collection={col} previews={previews} loadingId={loadingId} />
            ))}
          </div>
        </section>

        {/* ── My Collections ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/30 rounded-xl flex items-center justify-center">
                <Bookmark size={17} className="text-pink-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">My Collections</h2>
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
              <Bookmark size={32} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 text-sm font-medium">No collections yet</p>
              <p className="text-gray-600 text-xs mt-1 mb-4">Group apps together to track and compare them</p>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2.5 rounded-xl transition-colors mx-auto">
                <Plus size={14} /> Create Your First Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customCols.map(col => (
                <div key={col.id}
                  className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5 hover:border-purple-600/50 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600/30 to-purple-600/20 border border-pink-600/30 flex items-center justify-center">
                      <Bookmark size={17} className="text-pink-400" />
                    </div>
                    <button onClick={() => deleteCollection(col.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={15} />
                    </button>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{col.name}</h3>
                  {col.desc && <p className="text-gray-500 text-xs mb-3 leading-relaxed">{col.desc}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">{col.apps.length} apps</span>
                    <Link href="/search"
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs transition-colors">
                      Add apps <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
              {/* Add more */}
              <button onClick={() => setShowCreate(true)}
                className="border border-dashed border-gray-700 hover:border-purple-600/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-purple-400 transition-all min-h-[140px]">
                <Plus size={22} />
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
