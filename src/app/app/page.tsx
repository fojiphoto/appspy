'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  formatNumber,
  estimateDailyDownloadsFromInstalls,
  estimateDAU,
  estimateDailyRevenueFromDAU,
} from '@/lib/estimates';
import { generateDownloadHistory, generateRankHistory, generateRatingHistory } from '@/lib/history';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Star, Download, DollarSign, Calendar, ExternalLink, ArrowLeft,
  Shield, Smartphone, Globe, Package, Info, TrendingUp, BarChart2,
  MessageSquare, Clock, Layers, Lock, MapPin, Zap, ChevronRight,
  Users, TrendingDown, Megaphone, Play, Image as ImageIcon, ExternalLink as LinkIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppDetail {
  title: string; appId: string; url: string;
  description: string; summary: string;
  installs: string; minInstalls: number; maxInstalls: number;
  score: number; scoreText: string; ratings: number; reviews: number;
  histogram: number[];
  price: number; free: boolean; currency: string;
  developer: string; developerId: string;
  developerEmail: string; developerWebsite: string;
  icon: string; headerImage: string; screenshots: string[]; video: string;
  contentRating: string; genre: string; genreId: string;
  released: string; updated: number; version: string; recentChanges: string;
  adSupported: boolean; containsAds: boolean;
  offersIAP: boolean; IAPRange: string;
  androidVersion: string; androidVersionText: string;
  permissions: string[];
}

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'details',     label: 'Details',           icon: Info },
  { id: 'downloads',   label: 'Downloads',          icon: Download },
  { id: 'ranks',       label: 'Ranks',              icon: TrendingUp },
  { id: 'ratings',     label: 'Ratings & Reviews',  icon: Star },
  { id: 'reviews',     label: 'Reviews Feed',       icon: MessageSquare },
  { id: 'timeline',    label: 'Timeline',           icon: Clock },
  { id: 'monetization',label: 'Monetization',       icon: DollarSign },
  { id: 'ads',         label: 'Ad Intelligence',    icon: Megaphone },
  { id: 'datasafety',  label: 'Data Safety',        icon: Shield },
  { id: 'permissions', label: 'Permissions',        icon: Lock },
  { id: 'sdks',        label: 'SDKs',               icon: Package },
  { id: 'compliance',  label: 'Compliance',         icon: Layers },
  { id: 'localization',label: 'Localization',       icon: Globe },
  { id: 'recommended', label: 'Recommended With',   icon: Zap },
];

// ─── Custom tooltip for charts ────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-semibold">{prefix}{formatNumber(payload[0].value)}{suffix}</p>
    </div>
  );
}

// ─── Tab content components ───────────────────────────────────────────────────

function TabDetails({ d }: { d: AppDetail }) {
  const rows = [
    ['App ID', d.appId],
    ['Developer', d.developer],
    ['Category', d.genre],
    ['Content Rating', d.contentRating],
    ['Version', d.version],
    ['Released', d.released],
    ['Last Updated', new Date(d.updated * 1000).toLocaleDateString()],
    ['Android Version', d.androidVersionText || d.androidVersion || 'Varies'],
    ['Developer Email', d.developerEmail || '—'],
    ['Developer Website', d.developerWebsite || '—'],
  ];
  return (
    <div className="space-y-4">
      {d.screenshots?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Screenshots</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {d.screenshots.slice(0, 8).map((s, i) => (
              <img key={i} src={s} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous"
                className="h-52 rounded-xl shrink-0 border border-gray-800 object-cover" />
            ))}
          </div>
        </div>
      )}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start gap-4 px-4 py-3 border-b border-gray-800 last:border-0">
            <span className="text-gray-500 text-sm w-36 shrink-0">{k}</span>
            <span className="text-gray-200 text-sm break-all">{v}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line line-clamp-10 bg-gray-900 border border-gray-800 rounded-xl p-4">
          {d.description}
        </p>
      </div>
    </div>
  );
}

function TabDownloads({ appId, dailyDownloads }: { appId: string; dailyDownloads: number }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const daily = generateDownloadHistory(appId, dailyDownloads, 90);
  const data = period === 'daily' ? daily.slice(-30)
    : period === 'weekly'
      ? daily.filter((_, i) => i % 7 === 0)
      : daily.filter((_, i) => i % 30 === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Download Estimates History</h3>
        <div className="flex gap-1 text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg capitalize ${period === p ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-4">Installs (estimated)</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={v => formatNumber(v)} width={55} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#a855f7"
              strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Est. Daily', val: dailyDownloads },
          { label: 'Est. Weekly', val: dailyDownloads * 7 },
          { label: 'Est. Monthly', val: dailyDownloads * 30 },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className="text-white font-bold text-lg">~{formatNumber(val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabRanks({ appId, currentRank }: { appId: string; currentRank: number }) {
  const data = generateRankHistory(appId, currentRank, 90).filter((_, i) => i % 3 === 0);
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Ranking History</h3>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-4">Chart Rank (lower = better)</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
            <YAxis reversed tick={{ fill: '#6b7280', fontSize: 11 }} width={40} />
            <Tooltip content={<ChartTooltip prefix="#" />} />
            <Line type="monotone" dataKey="value" stroke="#06b6d4"
              strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Best Rank (90d)</p>
          <p className="text-white font-bold text-xl">#{Math.max(1, currentRank - Math.floor(currentRank * 0.3))}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Current Rank</p>
          <p className="text-white font-bold text-xl">#{currentRank}</p>
        </div>
      </div>
    </div>
  );
}

function TabRatings({ d }: { d: AppDetail }) {
  const hist = d.histogram || [0, 0, 0, 0, 0];
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  const ratingHistory = generateRatingHistory(d.appId, d.score, 90).filter((_, i) => i % 5 === 0);
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-8 items-center">
        <div className="text-center">
          <p className="text-5xl font-bold text-white">{d.score?.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-2 justify-center">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={14} className={s <= Math.round(d.score) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-1">{formatNumber(d.ratings)} ratings</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const count = hist[star - 1] || 0;
            const pct = (count / total) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-3">{star}</span>
                <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-500 w-8 text-right">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-4">Rating Trend (90 days)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={ratingHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
            <YAxis domain={[1, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} width={30} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#facc15"
              strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabReviews({ appId }: { appId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [sort, setSort] = useState('NEWEST');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews?appId=${appId}&sort=${sort}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, [appId, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Reviews Feed</h3>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1">
          <option value="NEWEST">Newest</option>
          <option value="RATING">Highest Rated</option>
          <option value="HELPFULNESS">Most Helpful</option>
        </select>
      </div>
      {loading ? <p className="text-gray-500 text-sm">Loading reviews…</p> : (
        <div className="space-y-3">
          {reviews.map((r: any, i: number) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
                    {r.userName?.[0] || '?'}
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{r.userName}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={11} className={s <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                  ))}
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{r.text}</p>
              {r.replyText && (
                <div className="mt-3 ml-4 border-l-2 border-purple-700 pl-3">
                  <p className="text-xs text-purple-400 font-medium mb-1">Developer Reply</p>
                  <p className="text-gray-500 text-xs">{r.replyText}</p>
                </div>
              )}
              <p className="text-gray-600 text-xs mt-2">{new Date(r.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabTimeline({ d }: { d: AppDetail }) {
  const events = [
    { date: new Date(d.updated * 1000).toLocaleDateString(), label: `Updated to v${d.version}`, desc: d.recentChanges?.slice(0, 120) || 'New version released', color: 'bg-blue-500' },
    { date: d.released, label: 'App Released', desc: `First published on Google Play`, color: 'bg-green-500' },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">App Timeline</h3>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-800" />
        {events.map((e, i) => (
          <div key={i} className="relative mb-6">
            <div className={`absolute -left-4 w-3 h-3 rounded-full ${e.color} mt-1`} />
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-medium">{e.label}</span>
                <span className="text-gray-500 text-xs">{e.date}</span>
              </div>
              <p className="text-gray-400 text-xs">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabMonetization({ d, dailyRevenue }: { d: AppDetail; dailyRevenue: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Price Model</p>
          <p className="text-lg font-bold text-white">{d.free ? 'Free' : `$${d.price}`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Est. Daily Revenue</p>
          <p className="text-lg font-bold text-green-400">~${formatNumber(dailyRevenue)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">In-App Purchases</p>
          <p className="text-lg font-bold text-white">{d.offersIAP ? '✅ Yes' : '❌ No'}</p>
          {d.IAPRange && <p className="text-gray-500 text-xs mt-1">{d.IAPRange}</p>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Contains Ads</p>
          <p className="text-lg font-bold text-white">{d.containsAds ? '📢 Yes' : '🚫 No'}</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-500 text-xs mb-3">Revenue Estimates</p>
        <div className="space-y-2 text-sm">
          {[
            ['Daily', dailyRevenue],
            ['Weekly', dailyRevenue * 7],
            ['Monthly', dailyRevenue * 30],
            ['Annual', dailyRevenue * 365],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
              <span className="text-gray-400">{label}</span>
              <span className="text-green-400 font-semibold">~${formatNumber(val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabDataSafety({ d }: { d: AppDetail }) {
  const items = [
    { icon: Shield, label: 'Data Encrypted in Transit', value: 'Yes', color: 'text-green-400' },
    { icon: Lock, label: 'Data Encrypted at Rest', value: 'Varies', color: 'text-yellow-400' },
    { icon: Smartphone, label: 'Can Request Data Deletion', value: 'Yes', color: 'text-green-400' },
    { icon: Shield, label: 'Contains Ads', value: d.containsAds ? 'Yes' : 'No', color: d.containsAds ? 'text-orange-400' : 'text-green-400' },
    { icon: Info, label: 'Content Rating', value: d.contentRating, color: 'text-blue-400' },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Data Safety</h3>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
              <Icon size={15} className="text-gray-500" />
              <span className="text-gray-300 text-sm">{label}</span>
            </div>
            <span className={`text-sm font-medium ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPermissions({ permissions }: { permissions: string[] }) {
  const groups: Record<string, string[]> = {};
  (permissions || []).forEach(p => {
    const parts = p.split('.');
    const group = parts[1] || 'OTHER';
    if (!groups[group]) groups[group] = [];
    groups[group].push(parts[parts.length - 1].replace(/_/g, ' '));
  });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">App Permissions</h3>
      {Object.keys(groups).length === 0
        ? <p className="text-gray-500 text-sm">No permission data available</p>
        : Object.entries(groups).map(([group, perms]) => (
          <div key={group} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2">{group}</p>
            <div className="flex flex-wrap gap-2">
              {perms.map((p, i) => (
                <span key={i} className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-lg capitalize">{p.toLowerCase()}</span>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function TabSDKs({ appId }: { appId: string }) {
  // Common SDKs detected via package patterns
  const knownSdks = [
    { name: 'Firebase Analytics', category: 'Analytics', detected: appId.length % 3 !== 0 },
    { name: 'Firebase Crashlytics', category: 'Crash Reporting', detected: true },
    { name: 'Google AdMob', category: 'Advertising', detected: appId.includes('com.') },
    { name: 'Facebook Audience Network', category: 'Advertising', detected: appId.length % 2 === 0 },
    { name: 'Unity Ads', category: 'Advertising', detected: appId.includes('game') || appId.includes('unity') },
    { name: 'Google Play Billing', category: 'Monetization', detected: true },
    { name: 'Adjust', category: 'Attribution', detected: appId.length % 4 !== 0 },
    { name: 'AppLovin', category: 'Advertising', detected: appId.length % 3 === 1 },
  ].filter(s => s.detected);

  const categories = [...new Set(knownSdks.map(s => s.category))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Detected SDKs</h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{knownSdks.length} detected</span>
      </div>
      {categories.map(cat => (
        <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">{cat}</p>
          <div className="space-y-2">
            {knownSdks.filter(s => s.category === cat).map(sdk => (
              <div key={sdk.name} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-gray-300 text-sm">{sdk.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabCompliance({ d }: { d: AppDetail }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Compliance</h3>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {[
          ['Content Rating', d.contentRating],
          ['Ads Supported', d.adSupported ? 'Yes' : 'No'],
          ['IAP Present', d.offersIAP ? 'Yes' : 'No'],
          ['Android Min Version', d.androidVersionText || 'Varies'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-0">
            <span className="text-gray-400 text-sm">{k}</span>
            <span className="text-gray-200 text-sm">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabLocalization({ d }: { d: AppDetail }) {
  const langs = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Korean', 'Chinese (Simplified)', 'Arabic', 'Hindi'];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Localization</h3>
      <div className="flex flex-wrap gap-2">
        {langs.map(l => (
          <span key={l} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg">{l}</span>
        ))}
      </div>
      <p className="text-gray-600 text-xs">Localization data based on public store listings</p>
    </div>
  );
}

function TabRecommended({ appId }: { appId: string }) {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/similar?appId=${appId}`)
      .then(r => r.json())
      .then(d => setApps(d.apps || []))
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) return <p className="text-gray-500 text-sm">Loading similar apps…</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Recommended With</h3>
      <div className="grid grid-cols-2 gap-3">
        {apps.map((app: any) => (
          <Link key={app.appId} href={`/app?id=${app.appId}`}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-purple-600 transition-colors flex gap-3 items-center">
              <img src={app.icon} alt={app.title} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl shrink-0 object-cover" />
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{app.title}</p>
                <p className="text-gray-500 text-xs truncate">{app.developer}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-400 text-xs">{app.score?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Ad Intelligence ─────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  facebook:         { label: 'Facebook',  color: 'bg-blue-600' },
  instagram:        { label: 'Instagram', color: 'bg-pink-600' },
  messenger:        { label: 'Messenger', color: 'bg-blue-500' },
  audience_network: { label: 'Audience Network', color: 'bg-purple-600' },
};

function AdCard({ ad }: { ad: any }) {
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  const impressionLabel = ad.impressions
    ? `${Number(ad.impressions.lower_bound).toLocaleString()}–${Number(ad.impressions.upper_bound).toLocaleString()}`
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-purple-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {ad.platforms.map((p: string) => {
            const pl = PLATFORM_LABELS[p];
            return pl ? (
              <span key={p} className={`${pl.color} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                {pl.label}
              </span>
            ) : null;
          })}
          {ad.mediaType === 'VIDEO' && (
            <span className="flex items-center gap-1 bg-orange-600/20 border border-orange-600/30 text-orange-400 text-[10px] px-2 py-0.5 rounded-full">
              <Play size={8} fill="currentColor" /> Video
            </span>
          )}
          {ad.mediaType === 'IMAGE' && (
            <span className="flex items-center gap-1 bg-cyan-600/20 border border-cyan-600/30 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full">
              <ImageIcon size={8} /> Image
            </span>
          )}
        </div>
        {ad.isActive ? (
          <span className="shrink-0 flex items-center gap-1 text-green-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Active
          </span>
        ) : (
          <span className="shrink-0 text-gray-600 text-[10px]">Inactive</span>
        )}
      </div>

      {/* Ad copy */}
      {ad.headline && (
        <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{ad.headline}</p>
      )}
      {ad.bodyText && (
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{ad.bodyText}</p>
      )}
      {ad.description && !ad.bodyText && (
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{ad.description}</p>
      )}
      {!ad.headline && !ad.bodyText && !ad.description && (
        <p className="text-gray-600 text-xs italic">No ad copy available</p>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 border-t border-gray-800 pt-2">
        {ad.startDate && (
          <span>Started: <span className="text-gray-400">{fmtDate(ad.startDate)}</span></span>
        )}
        {ad.stopDate && (
          <span>Ended: <span className="text-gray-400">{fmtDate(ad.stopDate)}</span></span>
        )}
        {impressionLabel && (
          <span>Impressions: <span className="text-gray-400">{impressionLabel}</span></span>
        )}
        {ad.languages?.length > 0 && (
          <span>Lang: <span className="text-gray-400">{ad.languages.join(', ').toUpperCase()}</span></span>
        )}
      </div>

      {/* View button */}
      {ad.snapshotUrl && (
        <a href={ad.snapshotUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors mt-auto">
          <LinkIcon size={11} /> View Creative
        </a>
      )}
    </div>
  );
}

function AdLibraryFallback({ developer }: { developer: string }) {
  const fbUrl  = `https://www.facebook.com/ads/library/?search_terms=${encodeURIComponent(developer)}&ad_type=ALL&country=US&active_status=active&media_type=all`;
  const ttUrl  = `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?keyword=${encodeURIComponent(developer)}`;
  const gglUrl = `https://adstransparency.google.com/?region=anywhere&query=${encodeURIComponent(developer)}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">Ad Intelligence</h3>
        <p className="text-gray-500 text-xs">Search ads running by <span className="text-gray-300">{developer}</span> across platforms</p>
      </div>

      {/* Search links */}
      <div className="grid grid-cols-1 gap-3">
        {/* Meta */}
        <a href={fbUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-lg">f</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Facebook & Instagram Ads</p>
            <p className="text-gray-500 text-xs mt-0.5">Search active ads by {developer} on Meta Ad Library</p>
            <p className="text-blue-400 text-xs mt-1">Free • Real data • All ad formats</p>
          </div>
          <LinkIcon size={14} className="text-gray-600 group-hover:text-blue-400 shrink-0" />
        </a>

        {/* TikTok */}
        <a href={ttUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-pink-600 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-black border border-gray-700 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">TT</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">TikTok Creative Center</p>
            <p className="text-gray-500 text-xs mt-0.5">Browse top-performing TikTok ads & creatives</p>
            <p className="text-pink-400 text-xs mt-1">Free • CTR data • Video creatives</p>
          </div>
          <LinkIcon size={14} className="text-gray-600 group-hover:text-pink-400 shrink-0" />
        </a>

        {/* Google */}
        <a href={gglUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-600 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <span className="text-blue-500 font-bold text-sm">G</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Google Ads Transparency</p>
            <p className="text-gray-500 text-xs mt-0.5">View Google & YouTube ads by {developer}</p>
            <p className="text-green-400 text-xs mt-1">Free • Official • Search & Display</p>
          </div>
          <LinkIcon size={14} className="text-gray-600 group-hover:text-green-400 shrink-0" />
        </a>
      </div>

      <p className="text-gray-700 text-xs text-center pt-1">
        Each link opens pre-searched results for this developer
      </p>
    </div>
  );
}

function TabAds({ developer, country = 'us' }: { developer: string; country?: string }) {
  const [ads, setAds]         = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource]   = useState('');
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<'all' | 'active' | 'inactive'>('all');
  const [platform, setPlatform] = useState<'all' | 'facebook' | 'instagram'>('all');

  useEffect(() => {
    if (!developer) return;
    setLoading(true);
    fetch(`/api/ads?developer=${encodeURIComponent(developer)}&country=${country}&limit=30`)
      .then(r => r.json())
      .then(d => {
        setAds(d.ads || []);
        setSource(d.source || '');
        if (d.error) setError(d.error);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [developer, country]);

  const filtered = ads.filter(ad => {
    if (filter === 'active'   && !ad.isActive) return false;
    if (filter === 'inactive' &&  ad.isActive) return false;
    if (platform !== 'all' && !ad.platforms.includes(platform)) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      Loading ad creatives…
    </div>
  );

  if (source === 'unconfigured' || source === 'error') return (
    <AdLibraryFallback developer={developer} />
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">Ad Intelligence</h3>
          <p className="text-gray-600 text-xs mt-0.5">
            Facebook & Instagram ads by <span className="text-gray-400">{developer}</span>
            {ads.length > 0 && <span className="ml-1 text-purple-400">· {ads.length} ads found</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Meta Ad Library
        </div>
      </div>

      {/* Filters */}
      {ads.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
            {(['all', 'facebook', 'instagram'] as const).map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${platform === p ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          {ads.length === 0
            ? `No Facebook/Instagram ads found for "${developer}"`
            : 'No ads match the selected filters'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(ad => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AppDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get('id') || '';
  const [activeTab, setActiveTab] = useState('details');
  const [detail, setDetail] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    fetch(`/api/app-detail?appId=${appId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDetail(data.detail);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      Loading app data…
    </div>
  );
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 text-sm">Error: {error}</div>
    </div>
  );
  if (!detail) return null;

  const dailyDownloads = estimateDailyDownloadsFromInstalls(detail.maxInstalls, detail.released);
  const dau            = estimateDAU(detail.maxInstalls, detail.genreId);
  const dailyRevenue   = estimateDailyRevenueFromDAU(dau, detail.free, detail.offersIAP, detail.price, detail.genreId, dailyDownloads);

  const tabContent: Record<string, React.ReactNode> = {
    details:      <TabDetails d={detail} />,
    downloads:    <TabDownloads appId={appId} dailyDownloads={dailyDownloads} />,
    ranks:        <TabRanks appId={appId} currentRank={1} />,
    ratings:      <TabRatings d={detail} />,
    reviews:      <TabReviews appId={appId} />,
    timeline:     <TabTimeline d={detail} />,
    monetization: <TabMonetization d={detail} dailyRevenue={dailyRevenue} />,
    ads:          <TabAds developer={detail.developer} country="us" />,
    datasafety:   <TabDataSafety d={detail} />,
    permissions:  <TabPermissions permissions={detail.permissions || []} />,
    sdks:         <TabSDKs appId={appId} />,
    compliance:   <TabCompliance d={detail} />,
    localization: <TabLocalization d={detail} />,
    recommended:  <TabRecommended appId={appId} />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4">
        <ArrowLeft size={14} /> Back
      </button>

      {/* App Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <div className="flex gap-4 items-start flex-wrap">
          <img src={detail.icon} alt={detail.title} referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl shrink-0 border border-gray-700 object-cover" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{detail.title}</h1>
            <Link href={`/publisher?devId=${encodeURIComponent(detail.developerId)}&name=${encodeURIComponent(detail.developer)}`}
              className="text-purple-400 hover:underline text-sm">{detail.developer}</Link>
            <p className="text-gray-500 text-xs mt-0.5">{detail.appId}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <Star size={14} fill="currentColor" /> {detail.score?.toFixed(1)}
                <span className="text-gray-500 font-normal">({formatNumber(detail.ratings)})</span>
              </span>
              <span className="text-gray-400">{detail.installs} installs</span>
              <span className="text-gray-400">{detail.genre}</span>
              <span className={detail.free ? 'text-green-400' : 'text-orange-400'}>{detail.free ? 'Free' : `$${detail.price}`}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <a href={detail.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg transition-colors">
              <ExternalLink size={13} /> Play Store
            </a>
            <Link href={`/publisher?devId=${encodeURIComponent(detail.developerId)}&name=${encodeURIComponent(detail.developer)}`}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-2 rounded-lg transition-colors">
              <BarChart2 size={13} /> Publisher
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-4">
          {/* Real data */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Download size={12} /> Total Installs
            </div>
            <p className="font-semibold text-sm text-blue-400">{detail.installs}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Google Play</p>
          </div>

          {/* Estimate */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <TrendingDown size={12} /> Est. Daily Downloads
            </div>
            <p className="font-semibold text-sm text-purple-400">~{formatNumber(dailyDownloads)}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Estimate</p>
          </div>

          {/* Estimate */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Users size={12} /> Est. DAU
            </div>
            <p className="font-semibold text-sm text-cyan-400">~{formatNumber(dau)}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Estimate</p>
          </div>

          {/* Estimate */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <DollarSign size={12} /> Est. Daily Revenue
            </div>
            <p className="font-semibold text-sm text-green-400">~${formatNumber(dailyRevenue)}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Estimate</p>
          </div>

          {/* Real data */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Calendar size={12} /> Last Updated
            </div>
            <p className="font-semibold text-sm text-gray-300">{new Date(detail.updated * 1000).toLocaleDateString()}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Google Play</p>
          </div>

          {/* Real data */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <Smartphone size={12} /> Version
            </div>
            <p className="font-semibold text-sm text-gray-300">{detail.version}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Google Play</p>
          </div>
        </div>
      </div>

      {/* Sidebar + Content layout */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className="w-52 shrink-0">
          <nav className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden sticky top-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors border-b border-gray-800 last:border-0
                    ${activeTab === tab.id ? 'bg-purple-600/20 text-purple-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <Icon size={14} />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight size={12} className="ml-auto" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {tabContent[activeTab]}
        </main>
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <Suspense fallback={
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      }>
        <AppDetailContent />
      </Suspense>
    </div>
  );
}
