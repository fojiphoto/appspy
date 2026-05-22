'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Globe, Package, Bookmark, TrendingUp, Flame,
  GitCompareArrows, Search, MapPin, Megaphone, Wrench,
  Bell, BarChart2, Zap,
} from 'lucide-react';

const NAV = [
  { href: '/',            icon: Home,             label: 'Home' },
  { href: '/market',      icon: Globe,            label: 'Market' },
  { href: '/sdks',        icon: Package,          label: 'SDKs' },
  { href: '/collections', icon: Bookmark,         label: 'Collections' },
  { href: '/top-charts',  icon: TrendingUp,       label: 'Top Charts' },
  { href: '/trending',    icon: Flame,            label: 'Trending' },
  { href: '/compare',     icon: GitCompareArrows, label: 'Compare' },
  { href: '/keyword',     icon: Search,           label: 'Keyword' },
  { href: '/availability',icon: MapPin,           label: 'Availability' },
  { href: '/ad-lookup',   icon: Megaphone,        label: 'Ad Lookup' },
  { href: '/aso-tools',   icon: Wrench,           label: 'ASO Tools' },
  { href: '/alerts',      icon: Bell,             label: 'Alerts' },
  { href: '/statistics',  icon: BarChart2,        label: 'Statistics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[72px] shrink-0 bg-[#111318] border-r border-gray-800/60 flex flex-col h-screen sticky top-0 z-50">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center h-16 border-b border-gray-800/60">
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-white" fill="white" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-1 mx-1 my-0.5 rounded-xl transition-all group
                ${active
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[9px] font-medium text-center leading-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
