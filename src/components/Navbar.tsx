'use client';
import Link from 'next/link';
import { Search, BarChart2, Zap, Compass, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',          label: 'Top Charts',     icon: BarChart2 },
  { href: '/explorer',  label: 'Market Explorer', icon: Compass },
];

export default function Navbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-4 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-purple-400 font-bold text-xl shrink-0">
        <Zap size={22} />
        AppSpy
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any app…"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname === href ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Icon size={14} /> {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
