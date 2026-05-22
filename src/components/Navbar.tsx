'use client';
import Link from 'next/link';
import { Search, BarChart2, Zap } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
      <Link href="/" className="flex items-center gap-2 text-purple-400 font-bold text-xl shrink-0">
        <Zap size={22} />
        AppSpy
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any app..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-white flex items-center gap-1">
          <BarChart2 size={15} /> Top Charts
        </Link>
      </div>
    </nav>
  );
}
