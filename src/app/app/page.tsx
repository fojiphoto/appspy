'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Star, Download, DollarSign, Calendar, RefreshCw, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatNumber, estimateDailyDownloads, estimateDailyRevenue } from '@/lib/estimates';

interface AppDetail {
  title: string;
  appId: string;
  url: string;
  description: string;
  summary: string;
  installs: string;
  minInstalls: number;
  maxInstalls: number;
  score: number;
  scoreText: string;
  ratings: number;
  reviews: number;
  histogram: number[];
  price: number;
  free: boolean;
  currency: string;
  developer: string;
  developerId: string;
  developerEmail: string;
  developerWebsite: string;
  icon: string;
  headerImage: string;
  screenshots: string[];
  video: string;
  contentRating: string;
  genre: string;
  genreId: string;
  released: string;
  updated: number;
  version: string;
  recentChanges: string;
}

function AppDetailContent() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('id') || '';
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
    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
      <Loader2 className="animate-spin" size={20} />
      Loading app data...
    </div>
  );

  if (error) return (
    <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
      Error: {error}
    </div>
  );

  if (!detail) return null;

  const estDownloads = estimateDailyDownloads(1, detail.genreId || 'default', 'us');
  const estRevenue = estimateDailyRevenue(1, 'us');
  const updatedDate = new Date(detail.updated * 1000).toLocaleDateString();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
        <ArrowLeft size={15} /> Back to Charts
      </Link>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex gap-5 items-start">
          <img src={detail.icon} alt={detail.title} className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{detail.title}</h1>
            <p className="text-gray-400 mt-1">{detail.developer}</p>
            <p className="text-gray-600 text-sm">{detail.genre} · {detail.contentRating}</p>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Star size={16} fill="currentColor" />
                <span className="font-semibold">{detail.score?.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({formatNumber(detail.ratings)} ratings)</span>
              </div>
              <span className="text-gray-400 text-sm">{detail.installs} installs</span>
              <span className={`text-sm font-medium ${detail.free ? 'text-green-400' : 'text-orange-400'}`}>
                {detail.free ? 'Free' : `$${detail.price}`}
              </span>
            </div>
          </div>

          <a href={detail.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
            <ExternalLink size={14} /> View on Play Store
          </a>
        </div>
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Download size={16} />
            <span className="text-xs text-gray-500">Est. Daily Downloads</span>
          </div>
          <p className="text-xl font-bold text-white">~{formatNumber(estDownloads)}</p>
          <p className="text-xs text-gray-600 mt-1">Based on rank signals</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <DollarSign size={16} />
            <span className="text-xs text-gray-500">Est. Daily Revenue</span>
          </div>
          <p className="text-xl font-bold text-white">~${formatNumber(estRevenue)}</p>
          <p className="text-xs text-gray-600 mt-1">Top Grossing proxy</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Calendar size={16} />
            <span className="text-xs text-gray-500">Last Updated</span>
          </div>
          <p className="text-xl font-bold text-white">{updatedDate}</p>
          <p className="text-xs text-gray-600 mt-1">v{detail.version}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <RefreshCw size={16} />
            <span className="text-xs text-gray-500">Total Installs</span>
          </div>
          <p className="text-xl font-bold text-white">{detail.installs}</p>
          <p className="text-xs text-gray-600 mt-1">Google Play reported</p>
        </div>
      </div>

      {/* Screenshots */}
      {detail.screenshots?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Screenshots</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {detail.screenshots.slice(0, 6).map((s, i) => (
              <img key={i} src={s} alt="" className="h-48 rounded-xl shrink-0 border border-gray-800" />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line line-clamp-6">
          {detail.description}
        </p>
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mr-2" />Loading...</div>}>
        <AppDetailContent />
      </Suspense>
    </div>
  );
}
