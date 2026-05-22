import Link from 'next/link';
import { Star, Download, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/estimates';

function amzImg(url: string): string {
  return `/api/amazon-image?url=${encodeURIComponent(url)}`;
}

interface AppCardProps {
  rank: number;
  appId: string;
  title: string;
  developer: string;
  icon: string;
  score: number;
  installs: string;
  free: boolean;
  genre: string;
  estimatedDailyDownloads: number;
  estimatedDailyRevenue: number;
  store?: string;
}

export default function AppCard({
  rank, appId, title, developer, icon, score,
  installs, free, genre, estimatedDailyDownloads, estimatedDailyRevenue,
  store = 'google',
}: AppCardProps) {
  const href    = `/app?id=${appId}${store !== 'google' ? `&store=${store}` : ''}`;
  const iconSrc = store === 'amazon' && icon ? amzImg(icon) : icon;

  return (
    <Link href={href}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-600 hover:bg-gray-850 transition-all cursor-pointer flex gap-3 items-start">
        <span className="text-gray-600 text-sm font-mono w-6 shrink-0 mt-1">#{rank}</span>

        {iconSrc
          ? <img src={iconSrc} alt={title} referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl shrink-0 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-14 h-14 rounded-xl shrink-0 bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 font-bold text-xl">
              {title?.[0] || '?'}
            </div>
        }

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
          <p className="text-gray-500 text-xs truncate">{developer}</p>
          <p className="text-gray-600 text-xs mt-0.5">{genre}</p>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-yellow-400">
              <Star size={11} fill="currentColor" />
              {score?.toFixed(1) || 'N/A'}
            </span>
            <span className="text-gray-500">{installs || '—'}</span>
            <span className={free ? 'text-green-400' : 'text-orange-400'}>
              {free ? 'Free' : 'Paid'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs border-t border-gray-800 pt-2">
            <span className="flex items-center gap-1 text-blue-400">
              <Download size={11} />
              ~{formatNumber(estimatedDailyDownloads)}/day
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <DollarSign size={11} />
              ~${formatNumber(estimatedDailyRevenue)}/day
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
