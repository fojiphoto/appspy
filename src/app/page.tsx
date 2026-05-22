import Link from 'next/link';
import { TrendingUp, Flame, Search, BarChart2, ArrowRight } from 'lucide-react';

const QUICK_LINKS = [
  { href: '/top-charts', icon: TrendingUp, label: 'Top Charts',     desc: 'Live rankings from Google Play',      color: 'from-purple-600/20 to-purple-600/5',  border: 'border-purple-600/30' },
  { href: '/trending',   icon: Flame,      label: 'Trending Now',   desc: 'Fastest growing apps today',          color: 'from-orange-500/20 to-orange-500/5',  border: 'border-orange-500/30' },
  { href: '/market',     icon: BarChart2,  label: 'Market Explorer',desc: 'Browse 14M+ apps with filters',       color: 'from-blue-500/20 to-blue-500/5',      border: 'border-blue-500/30' },
  { href: '/search',     icon: Search,     label: 'Search Apps',    desc: 'Find any app instantly',              color: 'from-green-500/20 to-green-500/5',    border: 'border-green-500/30' },
];

export default function HomePage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center relative overflow-hidden px-6 py-16">

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Hero text */}
      <div className="relative text-center max-w-2xl mx-auto">
        <p className="text-gray-500 text-base mb-3 tracking-wider uppercase font-medium">
          Discover powerful
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-2">
          App Intelligence &amp; ASO Tools with
        </h1>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            AppSpy
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          All-in-one platform for market insights, keyword strategies, and competitor tracking.
        </p>
        <p className="text-gray-500 text-base mb-10">
          Grow faster with AppSpy — your trusted app intelligence toolkit.
        </p>

        {/* Available for */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <span className="text-gray-600 text-xs uppercase tracking-widest font-semibold">Available for</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5">
              <div className="w-6 h-6 bg-[#0D96F6] rounded-md flex items-center justify-center text-white text-xs font-bold">A</div>
              <span className="text-gray-300 text-sm font-medium">App Store</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5">
              <div className="w-6 h-6 bg-[#01875F] rounded-md flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M3.18 23.76c.33.18.7.24 1.06.18l11.51-11.5L12.43 9.1 3.18 23.76zm17.12-10.2c.42-.36.7-.9.7-1.56s-.28-1.2-.71-1.56l-2.33-1.35-3.26 3.26 3.26 3.26 2.34-1.35v-.7zM4.24.06C3.91 0 3.54.06 3.18.24L15.4 12.44 18.72 9.1 4.24.06zM3.18.24z"/></svg>
              </div>
              <span className="text-gray-300 text-sm font-medium">Google Play</span>
            </div>
          </div>
        </div>

        {/* Quick action links */}
        <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color, border }) => (
            <Link key={href} href={href}
              className={`group relative bg-gradient-to-br ${color} border ${border} rounded-2xl p-4 text-left hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} className="text-white/70" />
                <ArrowRight size={14} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
