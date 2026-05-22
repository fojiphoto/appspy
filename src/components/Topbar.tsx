'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery('');
    }
  }

  return (
    <header className="h-14 bg-[#0d0f14] border-b border-gray-800/60 flex items-center justify-between px-5 shrink-0 z-40">
      {/* Left spacer / breadcrumb area */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        {!open ? (
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
            <Search size={14} />
            <span className="text-xs">Search</span>
            <kbd className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded ml-1">Ctrl K</kbd>
          </button>
        ) : (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                onBlur={() => { if (!query) setOpen(false); }}
                placeholder="Search any app…"
                className="bg-gray-800 border border-purple-500 text-white text-sm pl-9 pr-4 py-1.5 rounded-lg w-64 focus:outline-none placeholder-gray-500" />
            </div>
            <button type="button" onClick={() => { setOpen(false); setQuery(''); }}
              className="text-gray-500 hover:text-white text-xs">✕</button>
          </form>
        )}

        {/* Language */}
        <button className="text-lg px-1 hover:bg-gray-800 rounded-lg p-1.5 transition-colors" title="Language">
          🇬🇧
        </button>

        {/* Sign In */}
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium">
          <User size={14} />
          Sign In
        </button>
      </div>
    </header>
  );
}
