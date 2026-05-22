'use client';
import { useState } from 'react';
import { Search, Loader2, Star, Download, DollarSign, GitCompareArrows } from 'lucide-react';
import { formatNumber, estimateDailyDownloads, estimateDailyRevenue } from '@/lib/estimates';

interface AppData { detail: any; }

function AppSearchInput({ label, onSelect }: { label: string; onSelect: (app: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&country=us`);
      const data = await res.json();
      setResults(data.results?.slice(0, 5) || []);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-2">
      <label className="text-gray-400 text-xs uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search app name…"
            className="w-full bg-[#1a1d24] border border-gray-700/60 text-white pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
        </div>
        <button onClick={search} className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl text-sm transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="bg-[#13151a] border border-gray-700/60 rounded-xl overflow-hidden">
          {results.map((app: any) => (
            <button key={app.appId} onClick={() => { onSelect(app); setResults([]); setQ(app.title); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-gray-800/60 last:border-0 text-left">
              <img src={app.icon} referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-white text-sm truncate">{app.title}</p>
                <p className="text-gray-500 text-xs truncate">{app.developer}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AppColumn({ app, rank }: { app: any; rank: number }) {
  const dl = estimateDailyDownloads(rank, app.genreId || 'GAME', 'us');
  const rev = estimateDailyRevenue(rank, 'us');
  const metrics = [
    { label: 'Rating', value: app.score?.toFixed(1) || '—', sub: `${formatNumber(app.ratings || 0)} ratings`, color: 'text-yellow-400' },
    { label: 'Installs', value: app.installs || '—', sub: 'Google Play reported', color: 'text-gray-200' },
    { label: 'Est. Daily Downloads', value: `~${formatNumber(dl)}`, sub: 'Based on rank signals', color: 'text-blue-400' },
    { label: 'Est. Daily Revenue', value: `~$${formatNumber(rev)}`, sub: 'Grossing rank proxy', color: 'text-green-400' },
    { label: 'Price', value: app.free ? 'Free' : `$${app.price}`, sub: app.offersIAP ? 'Has IAP' : 'No IAP', color: app.free ? 'text-green-400' : 'text-orange-400' },
    { label: 'Version', value: app.version || '—', sub: new Date((app.updated || 0) * 1000).toLocaleDateString(), color: 'text-gray-200' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-[#13151a] border border-gray-800/60 rounded-2xl p-4 text-center">
        <img src={app.icon} referrerPolicy="no-referrer" alt={app.title}
          className="w-20 h-20 rounded-2xl mx-auto mb-3 object-cover border border-gray-700" />
        <h3 className="text-white font-bold text-base">{app.title}</h3>
        <p className="text-gray-500 text-sm">{app.developer}</p>
        <p className="text-gray-600 text-xs mt-1">{app.genre}</p>
      </div>
      {metrics.map(({ label, value, sub, color }) => (
        <div key={label} className="bg-[#13151a] border border-gray-800/60 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">{label}</p>
          <p className={`font-bold text-lg ${color}`}>{value}</p>
          <p className="text-gray-600 text-xs">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function ComparePage() {
  const [appA, setAppA] = useState<any>(null);
  const [appB, setAppB] = useState<any>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  async function loadDetail(app: any, setter: (d: any) => void, loader: (b: boolean) => void) {
    loader(true);
    try {
      const res = await fetch(`/api/app-detail?appId=${app.appId}`);
      const data = await res.json();
      setter(data.detail);
    } finally { loader(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <GitCompareArrows size={22} className="text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Compare Apps</h1>
          <p className="text-gray-500 text-xs mt-0.5">Side-by-side comparison of any two apps</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-8">
        <div>
          <AppSearchInput label="App A" onSelect={a => loadDetail(a, setAppA, setLoadingA)} />
        </div>
        <div>
          <AppSearchInput label="App B" onSelect={b => loadDetail(b, setAppB, setLoadingB)} />
        </div>
      </div>

      {(loadingA || loadingB) && (
        <div className="flex justify-center py-10 text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading app data…
        </div>
      )}

      {appA && appB && !loadingA && !loadingB && (
        <div className="grid grid-cols-2 gap-5">
          <AppColumn app={appA} rank={1} />
          <AppColumn app={appB} rank={5} />
        </div>
      )}

      {!appA && !appB && (
        <div className="text-center py-20 text-gray-700">
          <GitCompareArrows size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Search and select two apps to compare them</p>
        </div>
      )}
    </div>
  );
}
