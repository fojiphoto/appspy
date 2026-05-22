'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, Star, TrendingUp, ChevronRight,
  Zap, Shield, Target, BarChart2, ArrowRight, Hash,
} from 'lucide-react';
import { formatNumber, estimateDailyDownloads } from '@/lib/estimates';

// ── Constants ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 United States' },
  { value: 'gb', label: '🇬🇧 United Kingdom' },
  { value: 'in', label: '🇮🇳 India' },
  { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'de', label: '🇩🇪 Germany' },
  { value: 'fr', label: '🇫🇷 France' },
  { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'ca', label: '🇨🇦 Canada' },
  { value: 'au', label: '🇦🇺 Australia' },
  { value: 'jp', label: '🇯🇵 Japan' },
  { value: 'kr', label: '🇰🇷 South Korea' },
  { value: 'ru', label: '🇷🇺 Russia' },
];

// ── Score helpers ──────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

function chanceColor(score: number): string {
  if (score >= 60) return 'text-green-400';
  if (score >= 35) return 'text-yellow-400';
  return 'text-red-400';
}

function chanceBarColor(score: number): string {
  if (score >= 60) return 'bg-green-500';
  if (score >= 35) return 'bg-yellow-500';
  return 'bg-red-500';
}

function diffLabel(score: number): string {
  if (score >= 75) return 'Very Hard';
  if (score >= 55) return 'Hard';
  if (score >= 35) return 'Medium';
  if (score >= 15) return 'Easy';
  return 'Very Easy';
}

function volLabel(score: number): string {
  if (score >= 75) return 'Very High';
  if (score >= 55) return 'High';
  if (score >= 35) return 'Medium';
  if (score >= 15) return 'Low';
  return 'Very Low';
}

// ── Circular Score Ring ────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2230" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={7}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold"
        style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ── Mini Score Bar ─────────────────────────────────────────────────────────────

function MiniBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-6 text-right">{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function KeywordPage() {
  const [term, setTerm]           = useState('');
  const [country, setCountry]     = useState('us');
  const [store, setStore]         = useState<'google' | 'apple'>('google');
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState('');
  const [data, setData]           = useState<any>(null);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(q);
    setData(null);
    try {
      const res  = await fetch(`/api/keywords?term=${encodeURIComponent(q)}&country=${country}&store=${store}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const selectCls = "bg-[#1a1d24] border border-gray-700/60 text-white text-sm rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500 cursor-pointer";

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <Search size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Keyword Research</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Analyze search volume, difficulty, and top-ranking apps for any keyword
          </p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <form
        onSubmit={e => { e.preventDefault(); doSearch(term); }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        {/* Store tabs */}
        <div className="flex bg-[#1a1d24] border border-gray-700/60 rounded-xl overflow-hidden shrink-0">
          <button type="button"
            onClick={() => setStore('google')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${store === 'google' ? 'bg-[#01875F] text-white' : 'text-gray-400 hover:text-white'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
              <path d="M3.18 23.76c.33.18.7.24 1.06.18l11.51-11.5L12.43 9.1 3.18 23.76zm17.12-10.2c.42-.36.7-.9.7-1.56s-.28-1.2-.71-1.56l-2.33-1.35-3.26 3.26 3.26 3.26 2.34-1.35v-.7zM4.24.06C3.91 0 3.54.06 3.18.24L15.4 12.44 18.72 9.1 4.24.06zM3.18.24z"/>
            </svg>
            Google Play
          </button>
          <button type="button"
            onClick={() => setStore('apple')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${store === 'apple' ? 'bg-[#0D96F6] text-white' : 'text-gray-400 hover:text-white'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </button>
        </div>

        {/* Keyword input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Enter keyword (e.g. puzzle game, fitness tracker…)"
            className="w-full bg-[#1a1d24] border border-gray-700/60 text-white pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"
          />
        </div>

        <select value={country} onChange={e => setCountry(e.target.value)} className={selectCls}>
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <button type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0">
          <Zap size={14} /> Analyze
        </button>
      </form>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
          <Loader2 className="animate-spin text-purple-400" size={28} />
          <p className="text-sm">Analyzing keyword<span className="text-purple-400"> "{searched}"</span>…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !data && !searched && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center">
            <Search size={36} className="text-blue-500/40" />
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-medium">Keyword Intelligence</p>
            <p className="text-gray-600 text-sm mt-1">Enter a keyword above to see volume, difficulty, and top-ranking apps</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            {['puzzle game', 'fitness tracker', 'vpn', 'photo editor', 'meditation'].map(kw => (
              <button key={kw} onClick={() => { setTerm(kw); doSearch(kw); }}
                className="text-xs bg-gray-800/80 border border-gray-700/60 text-gray-400 hover:text-white hover:border-purple-500/50 rounded-full px-3 py-1.5 transition-colors">
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {!loading && data && (
        <div className="space-y-5">

          {/* Keyword label */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#1a1d24] border border-gray-700/60 rounded-full px-4 py-1.5">
              <Hash size={12} className="text-purple-400" />
              <span className="text-white text-sm font-semibold">{searched}</span>
            </div>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">
              {store === 'google' ? 'Google Play' : 'App Store'} · {COUNTRIES.find(c => c.value === country)?.label}
            </span>
          </div>

          {/* ── 4 Metric cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Volume */}
            <div className="bg-[#13151a] border border-gray-800/60 rounded-2xl p-5 flex items-center gap-4">
              <ScoreRing score={data.volume} color="#3b82f6" />
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Search Volume</p>
                <p className="text-white text-lg font-bold">{data.volume}<span className="text-gray-600 text-sm font-normal">/100</span></p>
                <p className="text-blue-400 text-xs font-medium mt-0.5">{volLabel(data.volume)}</p>
              </div>
            </div>

            {/* Difficulty */}
            <div className="bg-[#13151a] border border-gray-800/60 rounded-2xl p-5 flex items-center gap-4">
              <ScoreRing score={data.difficulty} color={data.difficulty >= 70 ? '#ef4444' : data.difficulty >= 40 ? '#eab308' : '#22c55e'} />
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Difficulty</p>
                <p className="text-white text-lg font-bold">{data.difficulty}<span className="text-gray-600 text-sm font-normal">/100</span></p>
                <p className={`text-xs font-medium mt-0.5 ${scoreColor(data.difficulty)}`}>{diffLabel(data.difficulty)}</p>
              </div>
            </div>

            {/* Chance */}
            <div className="bg-[#13151a] border border-gray-800/60 rounded-2xl p-5 flex items-center gap-4">
              <ScoreRing score={data.chance} color={data.chance >= 60 ? '#22c55e' : data.chance >= 35 ? '#eab308' : '#ef4444'} />
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Chance</p>
                <p className="text-white text-lg font-bold">{data.chance}<span className="text-gray-600 text-sm font-normal">/100</span></p>
                <p className={`text-xs font-medium mt-0.5 ${chanceColor(data.chance)}`}>
                  {data.chance >= 60 ? 'Good Opportunity' : data.chance >= 35 ? 'Competitive' : 'Very Hard'}
                </p>
              </div>
            </div>

            {/* Total Apps */}
            <div className="bg-[#13151a] border border-gray-800/60 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-[80px] h-[80px] shrink-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-purple-600/15 rounded-2xl flex items-center justify-center">
                  <BarChart2 size={26} className="text-purple-400" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Ranking Apps</p>
                <p className="text-white text-lg font-bold">{data.resultsCount}</p>
                <p className="text-purple-400 text-xs font-medium mt-0.5">Top results shown</p>
              </div>
            </div>
          </div>

          {/* ── Main content: Related Keywords + Top Apps ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Related Keywords */}
            <div className="lg:col-span-4 bg-[#13151a] border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-purple-400" />
                  <h2 className="text-sm font-semibold text-white">Related Keywords</h2>
                </div>
                <span className="text-gray-600 text-xs">{data.relatedKeywords?.length || 0} found</span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_90px_90px] px-5 py-2.5 border-b border-gray-800/40">
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider">Keyword</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider text-center">Volume</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider text-center">Difficulty</span>
              </div>

              <div className="divide-y divide-gray-800/40 max-h-[520px] overflow-y-auto">
                {!data.relatedKeywords?.length
                  ? <p className="text-gray-600 text-sm p-5">No related keywords found</p>
                  : data.relatedKeywords.map((kw: any, i: number) => (
                    <button key={i} onClick={() => { setTerm(kw.keyword); doSearch(kw.keyword); }}
                      className="w-full grid grid-cols-[1fr_90px_90px] items-center px-5 py-3 hover:bg-white/5 transition-colors group text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        <ChevronRight size={11} className="text-gray-700 group-hover:text-purple-400 shrink-0 transition-colors" />
                        <span className="text-gray-300 text-sm truncate group-hover:text-white transition-colors">{kw.keyword}</span>
                      </div>
                      <div className="flex justify-center">
                        <MiniBar value={kw.volume} colorClass="bg-blue-500" />
                      </div>
                      <div className="flex justify-center">
                        <MiniBar value={kw.difficulty} colorClass={scoreBarColor(kw.difficulty)} />
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>

            {/* Top Ranking Apps */}
            <div className="lg:col-span-8 bg-[#13151a] border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Top Apps ranking for <span className="text-purple-400">"{searched}"</span>
                  </h2>
                </div>
                <span className="text-gray-600 text-xs">{store === 'google' ? 'Google Play' : 'App Store'}</span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_80px_100px_110px] px-5 py-2.5 border-b border-gray-800/40">
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider">#</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider">App</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider text-center">Rating</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider text-right">Reviews</span>
                <span className="text-gray-600 text-[11px] font-semibold uppercase tracking-wider text-right">Est. Daily DLs</span>
              </div>

              <div className="divide-y divide-gray-800/40 max-h-[520px] overflow-y-auto">
                {!data.results?.length
                  ? <p className="text-gray-600 text-sm p-5">No results found</p>
                  : data.results.map((app: any, i: number) => {
                      const est = estimateDailyDownloads(i + 1, app.genreId || 'GAME', country);
                      return (
                        <Link key={app.appId} href={`/app?id=${app.appId}&store=${store}`}>
                          <div className="grid grid-cols-[40px_1fr_80px_100px_110px] items-center px-5 py-3 hover:bg-white/5 transition-colors group">

                            {/* Rank */}
                            <div className="flex items-center justify-center">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  i === 1 ? 'bg-gray-400/20 text-gray-300' :
                                  i === 2 ? 'bg-orange-600/20 text-orange-400' :
                                  'bg-gray-800 text-gray-500'}`}>
                                {i + 1}
                              </span>
                            </div>

                            {/* App info */}
                            <div className="flex items-center gap-3 min-w-0">
                              {app.icon
                                ? <img src={app.icon} alt="" referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-xl shrink-0 object-cover border border-gray-700/40" />
                                : <div className="w-10 h-10 rounded-xl shrink-0 bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-700/40">
                                    {app.title?.[0] || '?'}
                                  </div>
                              }
                              <div className="min-w-0">
                                <p className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition-colors">{app.title}</p>
                                <p className="text-gray-500 text-xs truncate">{app.developer}</p>
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-center gap-1">
                              <Star size={10} className="text-yellow-400 shrink-0" fill="currentColor" />
                              <span className="text-gray-300 text-xs">{app.score?.toFixed(1) || '—'}</span>
                            </div>

                            {/* Reviews */}
                            <div className="text-right">
                              <span className="text-gray-400 text-xs">{formatNumber(app.reviews || 0)}</span>
                            </div>

                            {/* Est Daily Downloads */}
                            <div className="text-right flex items-center justify-end gap-1">
                              <ArrowRight size={10} className="text-blue-500 shrink-0" />
                              <span className="text-blue-400 text-xs font-medium">~{formatNumber(est)}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                }
              </div>
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <p className="text-gray-700 text-[11px] text-center pb-2">
            Volume, Difficulty and Chance scores are estimates based on search result analysis. Est. daily downloads are approximations.
          </p>

        </div>
      )}
    </div>
  );
}
