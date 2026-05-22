'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Loader2, Star } from 'lucide-react';

const POPULAR_SDKS = [
  { name: 'Firebase Analytics',        category: 'Analytics',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { name: 'Firebase Crashlytics',      category: 'Crash Report',  color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'Google AdMob',              category: 'Advertising',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'Facebook Audience Network', category: 'Advertising',   color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  { name: 'Unity Ads',                 category: 'Advertising',   color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  { name: 'AppLovin MAX',              category: 'Advertising',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'Adjust',                    category: 'Attribution',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'AppsFlyer',                 category: 'Attribution',   color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { name: 'Google Play Billing',       category: 'Monetization',  color: 'bg-green-600/20 text-green-300 border-green-600/30' },
  { name: 'IronSource',                category: 'Advertising',   color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { name: 'Liftoff',                   category: 'UA',            color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { name: 'Branch.io',                 category: 'Deep Linking',  color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

export default function SDKsPage() {
  const [searchSdk, setSearchSdk] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSdk, setActiveSdk] = useState('');

  async function findAppsWithSdk(sdkName: string) {
    setActiveSdk(sdkName);
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(sdkName)}&country=us`);
      const data = await res.json();
      setResults(data.results?.slice(0, 12) || []);
    } finally { setLoading(false); }
  }

  const filtered = POPULAR_SDKS.filter(s =>
    s.name.toLowerCase().includes(searchSdk.toLowerCase()) ||
    s.category.toLowerCase().includes(searchSdk.toLowerCase())
  );

  const categories = [...new Set(POPULAR_SDKS.map(s => s.category))];

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Package size={22} className="text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">SDK Intelligence</h1>
          <p className="text-gray-500 text-xs mt-0.5">Discover which SDKs top apps are using</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SDK list */}
        <div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={searchSdk} onChange={e => setSearchSdk(e.target.value)}
              placeholder="Filter SDKs…"
              className="w-full bg-[#1a1d24] border border-gray-700/60 text-white pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
          </div>
          {categories.map(cat => {
            const sdks = filtered.filter(s => s.category === cat);
            if (!sdks.length) return null;
            return (
              <div key={cat} className="mb-4">
                <p className="text-gray-600 text-xs uppercase tracking-wide mb-2 px-1">{cat}</p>
                <div className="space-y-1">
                  {sdks.map(sdk => (
                    <button key={sdk.name} onClick={() => findAppsWithSdk(sdk.name)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${sdk.color}
                        ${activeSdk === sdk.name ? 'ring-1 ring-purple-500' : 'opacity-80 hover:opacity-100'}`}>
                      {sdk.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Apps using SDK */}
        <div className="lg:col-span-2">
          {activeSdk ? (
            <>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">
                Apps using <span className="text-cyan-400">{activeSdk}</span>
              </h2>
              {loading ? (
                <div className="flex justify-center py-10 text-gray-500 gap-2">
                  <Loader2 className="animate-spin" size={16} /> Loading…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {results.map((app: any) => (
                    <Link key={app.appId} href={`/app?id=${app.appId}`}>
                      <div className="bg-[#13151a] border border-gray-800/60 rounded-xl p-3 hover:border-cyan-600/50 transition-colors flex gap-3 items-center">
                        <img src={app.icon} referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl shrink-0 object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{app.title}</p>
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
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-40 text-gray-700">
              <div className="text-center">
                <Package size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select an SDK to see apps using it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
