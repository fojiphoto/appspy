'use client';
import { getAllSubCategories } from '@/lib/gameCategories';

const CATEGORIES_GOOGLE = [
  { value: 'APPLICATION', label: 'All Apps' },
  { value: 'GAME',        label: 'All Games' },
  { value: 'GAME_ACTION',   label: 'Action' },
  { value: 'GAME_CASUAL',   label: 'Casual' },
  { value: 'GAME_PUZZLE',   label: 'Puzzle' },
  { value: 'GAME_STRATEGY', label: 'Strategy' },
  { value: 'GAME_RACING',   label: 'Racing' },
  { value: 'GAME_SPORTS',   label: 'Sports' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'SOCIAL',        label: 'Social' },
  { value: 'TOOLS',         label: 'Tools' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EDUCATION',     label: 'Education' },
];

const CATEGORIES_APPLE = [
  { value: 'GAMES',              label: 'All Games' },
  { value: 'GAMES_ACTION',       label: 'Action' },
  { value: 'GAMES_CASUAL',       label: 'Casual' },
  { value: 'GAMES_PUZZLE',       label: 'Puzzle' },
  { value: 'GAMES_STRATEGY',     label: 'Strategy' },
  { value: 'GAMES_RACING',       label: 'Racing' },
  { value: 'GAMES_SPORTS',       label: 'Sports' },
  { value: 'SOCIAL_NETWORKING',  label: 'Social' },
  { value: 'UTILITIES',          label: 'Utilities' },
  { value: 'ENTERTAINMENT',      label: 'Entertainment' },
  { value: 'EDUCATION',          label: 'Education' },
  { value: 'HEALTH_AND_FITNESS', label: 'Health & Fitness' },
  { value: 'PRODUCTIVITY',       label: 'Productivity' },
];

const CATEGORIES_AMAZON = [
  { value: 'APPLICATION',   label: 'All Apps & Games' },
  { value: 'GAME',          label: 'All Games' },
  { value: 'GAME_ACTION',   label: 'Action' },
  { value: 'GAME_ARCADE',   label: 'Arcade' },
  { value: 'GAME_CASUAL',   label: 'Casual' },
  { value: 'GAME_PUZZLE',   label: 'Puzzle' },
  { value: 'GAME_STRATEGY', label: 'Strategy' },
  { value: 'EDUCATION',     label: 'Education' },
  { value: 'KIDS',          label: 'Kids' },
];

const COLLECTIONS_GOOGLE = [
  { value: 'TOP_FREE',     label: 'Top Free' },
  { value: 'TOP_PAID',     label: 'Top Paid' },
  { value: 'GROSSING',     label: 'Top Grossing' },
  { value: 'TOP_NEW_FREE', label: '🆕 Top New Free' },
];

const COLLECTIONS_APPLE = [
  { value: 'TOP_FREE',     label: 'Top Free' },
  { value: 'TOP_PAID',     label: 'Top Paid' },
  { value: 'GROSSING',     label: 'Top Grossing' },
  { value: 'TOP_NEW_FREE', label: '🆕 Top New Free' },
];

const COLLECTIONS_AMAZON = [
  { value: 'TOP_FREE',     label: 'Best Sellers' },
  { value: 'TOP_PAID',     label: 'Top Paid' },
  { value: 'TOP_NEW_FREE', label: '🆕 New Releases' },
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
  { value: 'fr', label: '🇫🇷 France' },
  { value: 'ca', label: '🇨🇦 Canada' },
  { value: 'au', label: '🇦🇺 Australia' },
];

interface FilterBarProps {
  category:       string;
  collection:     string;
  country:        string;
  gameSubCategory?: string;
  store?:         string;
  onChange:       (key: string, value: string) => void;
}

export default function FilterBar({ category, collection, country, gameSubCategory = '', store = 'google', onChange }: FilterBarProps) {
  const selectClass = "bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer";

  const categories  = store === 'apple' ? CATEGORIES_APPLE  : store === 'amazon' ? CATEGORIES_AMAZON  : CATEGORIES_GOOGLE;
  const collections = store === 'apple' ? COLLECTIONS_APPLE : store === 'amazon' ? COLLECTIONS_AMAZON : COLLECTIONS_GOOGLE;
  const isGameCategory = category.startsWith('GAME');
  const gameSubCategories = getAllSubCategories();

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select value={category} onChange={e => onChange('category', e.target.value)} className={selectClass}>
        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <select value={collection} onChange={e => onChange('collection', e.target.value)} className={selectClass}>
        {collections.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {isGameCategory && (
        <select value={gameSubCategory} onChange={e => onChange('gameSubCategory', e.target.value)} className={selectClass}>
          <option value="">All Game Types</option>
          {gameSubCategories.map(g => <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>)}
        </select>
      )}

      {store !== 'amazon' && (
        <select value={country} onChange={e => onChange('country', e.target.value)} className={selectClass}>
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      )}
    </div>
  );
}
