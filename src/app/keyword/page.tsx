'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Star, TrendingUp, Hash } from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 US' }, { value: 'gb', label: '🇬🇧 UK' },
  { value: 'in', label: '🇮🇳 India' }, { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'de', label: '🇩🇪 Germany' }, { value: 'br', label: '🇧🇷 Brazil' },
];

export default function KeywordPage() {
  const [term, setTerm] = useState('');
  const [country, setCountry] = useState('us');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState('');

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true); setSearched(q);
    try {
      const res = await fetch(`/api/keywords?term=${encodeURIComponent(q)}&country=${country}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setResults(data.results || []);
    } catch { setSuggestions([]); setResults([]); }
    finally { setLoading(false); }
  }

  const selectClass = "bg-[#1a1d24] border border-gray-700/60 text-white text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-purple-500";

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Search size={22} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Keyword Research</h1>
          <p className="text-gray-500 text-xs mt-0.5">Discover keyword suggestions and top ranking apps</p>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); doSearch(term); }} className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={term} onChange={e => setTerm(e.target.value)}
            placeholder="Enter keyword (e.g. puzzle game, fitness tracker…)"
            className="w-full bg-[#1a1d24] border border-gray-700/60 text-white pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
        </div>
        <select value={country} onChange={e => setCountry(e.target.value)} className={selectClass}>
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} /> Analyzing keyword…
        </div>
      )}

      {!loading && searched && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Keyword suggestions */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Hash size={14} className="text-purple-400" /> Related Keywords
            </h2>
            <div className="bg-[#13151a] border border-gray-800/60 rounded-xl overflow-hidden">
              {suggestions.length === 0
                ? <p className="text-gray-600 text-sm p-4">No suggestions found</p>
                : suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setTerm(s); doSearch(s); }}
                    className="w-full text-left px-4 py-3 border-b border-gray-800/60 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between group">
                    <span className="text-gray-300 text-sm">{s}</span>
                    <TrendingUp size={12} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </button>
                ))
              }
            </div>
          </div>

          {/* Top ranking apps */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Top Apps ranking for <span className="text-purple-400">"{searched}"</span>
            </h2>
            <div className="space-y-2">
              {results.map((app: any, i: number) => {
                const est = estimateDailyDownloads(i + 1, app.genreId || 'GAME', country);
                return (
                  <Link key={app.appId} href={`/app?id=${app.appId}`}>
                    <div className="bg-[#13151a] border border-gray-800/60 rounded-xl p-3 hover:border-purple-600/50 transition-colors flex gap-3 items-center">
                      <span className="text-gray-600 text-xs font-mono w-5 shrink-0">#{i+1}</span>
                      <img src={app.icon} alt="" referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl shrink-0 object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{app.title}</p>
                        <p className="text-gray-500 text-xs truncate">{app.developer}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-yellow-400 text-xs justify-end">
                          <Star size={10} fill="currentColor" /> {app.score?.toFixed(1)}
                        </div>
                        <p className="text-blue-400 text-xs mt-0.5">~{formatNumber(est)}/day</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-20 text-gray-700">
          <Search size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Enter a keyword to see suggestions and top ranking apps</p>
        </div>
      )}
    </div>
  );
}
