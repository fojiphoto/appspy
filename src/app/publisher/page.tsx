'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Star, Download, Package, Loader2, ArrowLeft } from 'lucide-react';
import { formatNumber, estimateDailyDownloads, estimateDailyRevenue } from '@/lib/estimates';
import { useRouter } from 'next/navigation';

function PublisherContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const devId = searchParams.get('devId') || '';
  const devName = searchParams.get('name') || devId;
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'installs' | 'title'>('score');

  useEffect(() => {
    if (!devId) return;
    setLoading(true);
    fetch(`/api/publisher?devId=${encodeURIComponent(devId)}`)
      .then(r => r.json())
      .then(d => setApps(d.apps || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [devId]);

  const sorted = [...apps].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    if (sortBy === 'installs') return (b.minInstalls || 0) - (a.minInstalls || 0);
    return a.title.localeCompare(b.title);
  });

  const totalEst = apps.reduce((acc, _, i) => acc + estimateDailyDownloads(i + 1, 'GAME', 'us'), 0);
  const avgScore = apps.length ? (apps.reduce((a, b) => a + (b.score || 0), 0) / apps.length).toFixed(2) : '—';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Publisher header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-700 flex items-center justify-center text-2xl font-bold text-white mb-3">
              {devName[0]?.toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-white">{devName}</h1>
            <p className="text-gray-500 text-sm mt-1">{devId}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{apps.length}</p>
              <p className="text-gray-500 text-xs mt-1">Total Apps</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">{avgScore}</p>
              <p className="text-gray-500 text-xs mt-1">Avg Rating</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-400">~{formatNumber(totalEst)}</p>
              <p className="text-gray-500 text-xs mt-1">Est. Daily DL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{apps.length} apps published</p>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2">
          <option value="score">Sort by Rating</option>
          <option value="installs">Sort by Installs</option>
          <option value="title">Sort by Name</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={18} /> Loading publisher apps…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((app: any, i: number) => {
            const est = estimateDailyDownloads(i + 1, app.genreId || 'default', 'us');
            const rev = estimateDailyRevenue(i + 1, 'us');
            return (
              <Link key={app.appId} href={`/app?id=${app.appId}`}>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-600 transition-colors h-full">
                  <div className="flex gap-3 items-start">
                    <img src={app.icon} alt={app.title} className="w-14 h-14 rounded-xl shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-sm truncate">{app.title}</h3>
                      <p className="text-gray-500 text-xs">{app.genre}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-300 text-xs">{app.score?.toFixed(1)}</span>
                        <span className="text-gray-600 text-xs ml-1">{app.installs}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800 text-xs">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Download size={10} /> ~{formatNumber(est)}/day
                    </span>
                    <span className="flex items-center gap-1 text-green-400">
                      ~${formatNumber(rev)}/day
                    </span>
                    <span className={`ml-auto ${app.free ? 'text-green-400' : 'text-orange-400'}`}>
                      {app.free ? 'Free' : 'Paid'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PublisherPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin mr-2" />Loading…</div>}>
        <PublisherContent />
      </Suspense>
    </div>
  );
}
