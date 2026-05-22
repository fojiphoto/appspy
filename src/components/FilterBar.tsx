'use client';

const CATEGORIES = [
  { value: 'GAME', label: 'All Games' },
  { value: 'GAME_ACTION', label: 'Action' },
  { value: 'GAME_CASUAL', label: 'Casual' },
  { value: 'GAME_PUZZLE', label: 'Puzzle' },
  { value: 'GAME_STRATEGY', label: 'Strategy' },
  { value: 'GAME_RACING', label: 'Racing' },
  { value: 'GAME_SPORTS', label: 'Sports' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EDUCATION', label: 'Education' },
];

const COLLECTIONS = [
  { value: 'topselling_free', label: 'Top Free' },
  { value: 'topselling_paid', label: 'Top Paid' },
  { value: 'topgrossing', label: 'Top Grossing' },
  { value: 'movers_shakers', label: 'Trending' },
];

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 US' },
  { value: 'gb', label: '🇬🇧 UK' },
  { value: 'de', label: '🇩🇪 Germany' },
  { value: 'in', label: '🇮🇳 India' },
  { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'jp', label: '🇯🇵 Japan' },
  { value: 'kr', label: '🇰🇷 Korea' },
  { value: 'ru', label: '🇷🇺 Russia' },
];

interface FilterBarProps {
  category: string;
  collection: string;
  country: string;
  onChange: (key: string, value: string) => void;
}

export default function FilterBar({ category, collection, country, onChange }: FilterBarProps) {
  const selectClass = "bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500";

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select value={category} onChange={e => onChange('category', e.target.value)} className={selectClass}>
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <select value={collection} onChange={e => onChange('collection', e.target.value)} className={selectClass}>
        {COLLECTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <select value={country} onChange={e => onChange('country', e.target.value)} className={selectClass}>
        {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </div>
  );
}
