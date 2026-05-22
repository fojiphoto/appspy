'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Link from 'next/link';
import { Search, Star, Download, Loader2 } from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 US' }, { value: 'gb', label: '🇬🇧 UK' },
  { value: 'in', label: '🇮🇳 India' }, { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'de', label: '🇩🇪 Germany' }, { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'jp', label: '🇯🇵 Japan' }, { value: 'kr', label: '🇰🇷 Korea' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [country, setCountry] = useState('us');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, []);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    router.replace(`/search?q=${encodeURIComponent(q)}`);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&country=${country}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search apps by name or keyword…"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
        </div>
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500">
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={18} /> Searching Google Play…
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-gray-500 py-16">No results found for "{query}"</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-gray-500 text-sm mb-4">{results.length} results for "{query}"</p>
          <div className="space-y-3">
            {results.map((app: any, i: number) => {
              const est = estimateDailyDownloads(i + 1, app.genreId || 'GAME', country);
              return (
                <Link key={app.appId} href={`/app?id=${app.appId}`}>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-600 transition-colors flex gap-4 items-center">
                    <img src={app.icon} alt={app.title} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl shrink-0 border border-gray-800 object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold">{app.title}</h3>
                      <p className="text-gray-400 text-sm">{app.developer}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{app.genre}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-1 text-yellow-400 text-sm justify-end">
                        <Star size={13} fill="currentColor" /> {app.score?.toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1 text-blue-400 text-xs justify-end">
                        <Download size={11} /> ~{formatNumber(est)}/day
                      </div>
                      <p className="text-gray-500 text-xs">{app.installs || '—'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-600">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Search any app across Google Play</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <Suspense fallback={<div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin mr-2" />Loading…</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
