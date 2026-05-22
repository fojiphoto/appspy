'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Globe, Package, Bookmark, TrendingUp, Flame,
  GitCompareArrows, Search, MapPin, Megaphone, Wrench,
  Bell, BarChart2, Zap, ChevronRight,
} from 'lucide-react';

// Google Play icon
function GPIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24">
      <path d="M3.18 23.76c.36.2.8.22 1.18.04L16.84 12 4.36.2C3.98.02 3.54.04 3.18.24A1.5 1.5 0 002.4 1.6v20.8c0 .56.3 1.07.78 1.36z" fill="#4285F4"/>
      <path d="M20.82 10.6l-3.06-1.76L14.3 12l3.46 3.16 3.06-1.76a1.5 1.5 0 000-2.8z" fill="#FBBC05"/>
      <path d="M4.36.2l13.4 7.72-3.46 3.16L3.18.24C3.54.04 3.98.02 4.36.2z" fill="#34A853"/>
      <path d="M3.18 23.76l10.12-9.08 3.46 3.16L4.36 23.8c-.38.18-.82.16-1.18-.04z" fill="#EA4335"/>
    </svg>
  );
}

// Apple App Store icon
function ASIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="#60a5fa">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

const MARKET_SUBS = [
  { href: '/market?store=google&view=explorer', Icon: GPIcon,  label: 'App Market Explorer',   store: 'Google Play' },
  { href: '/market?store=apple&view=explorer',  Icon: ASIcon,  label: 'App Market Explorer',   store: 'App Store'   },
  { href: '/market?store=google&view=search',   Icon: GPIcon,  label: 'Real-Time Store Search', store: 'Google Play' },
  { href: '/market?store=apple&view=search',    Icon: ASIcon,  label: 'Real-Time Store Search', store: 'App Store'   },
  { href: '/new-releases',                      Icon: GPIcon,  label: '🆕 Top New Free',        store: 'Google Play' },
];

const NAV = [
  { href: '/',             icon: Home,             label: 'Home' },
  { href: '/market',       icon: Globe,            label: 'Market',      subs: MARKET_SUBS },
  { href: '/sdks',         icon: Package,          label: 'SDKs' },
  { href: '/collections',  icon: Bookmark,         label: 'Collections' },
  { href: '/top-charts',   icon: TrendingUp,       label: 'Top Charts' },
  { href: '/trending',     icon: Flame,            label: 'Trending' },
  { href: '/compare',      icon: GitCompareArrows, label: 'Compare' },
  { href: '/keyword',      icon: Search,           label: 'Keyword' },
  { href: '/availability', icon: MapPin,           label: 'Availability' },
  { href: '/ad-lookup',    icon: Megaphone,        label: 'Ad Lookup' },
  { href: '/aso-tools',    icon: Wrench,           label: 'ASO Tools' },
  { href: '/alerts',       icon: Bell,             label: 'Alerts' },
  { href: '/statistics',   icon: BarChart2,        label: 'Statistics' },
];

interface SubmenuState { href: string; y: number }

export default function Sidebar() {
  const pathname = usePathname();
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSub = useCallback((href: string, el: HTMLElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = el.getBoundingClientRect();
    setSubmenu({ href, y: rect.top });
  }, []);

  const scheduleSub = useCallback(() => {
    closeTimer.current = setTimeout(() => setSubmenu(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const activeSubs = submenu ? NAV.find(n => n.href === submenu.href)?.subs : null;

  return (
    <>
      <aside className="w-[72px] shrink-0 bg-[#111318] border-r border-gray-800/60 flex flex-col h-screen sticky top-0 z-50">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center h-16 border-b border-gray-800/60 shrink-0">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" fill="white" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
          {NAV.map(({ href, icon: Icon, label, subs }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <div
                key={href}
                className="mx-1 my-0.5"
                onMouseEnter={e => subs && openSub(href, e.currentTarget as HTMLElement)}
                onMouseLeave={() => subs && scheduleSub()}
              >
                <Link
                  href={subs ? subs[0].href : href}
                  className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all w-full
                    ${active
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[9px] font-medium text-center leading-tight">{label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Flyout submenu — fixed so it escapes overflow */}
      {activeSubs && submenu && (
        <div
          className="fixed z-[200] bg-[#1a1d26] border border-gray-700/80 rounded-xl shadow-2xl w-64 py-2"
          style={{ left: 76, top: submenu.y }}
          onMouseEnter={cancelClose}
          onMouseLeave={() => setSubmenu(null)}
        >
          {/* Triangle pointer */}
          <div className="absolute -left-[7px] top-4 w-3 h-3 bg-[#1a1d26] border-l border-b border-gray-700/80 rotate-45" />

          <p className="text-gray-500 text-[10px] uppercase tracking-widest px-4 pb-1.5 pt-1 font-semibold">Market</p>

          {activeSubs.map((sub, i) => {
            const isLastOfGroup = i === 1; // divider after first 2 (Apple after first Google)
            return (
              <div key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={() => setSubmenu(null)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 border border-gray-700">
                    <sub.Icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">{sub.label}</p>
                    <p className="text-gray-500 text-xs">{sub.store}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-600 shrink-0" />
                </Link>
                {isLastOfGroup && <div className="mx-4 my-1 border-t border-gray-800" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
