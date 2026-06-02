/**
 * Game Sub-Category Classification
 * Detects game sub-categories from app title, description, and genre
 */

export interface GameSubCategory {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
  description: string;
}

export const GAME_SUBCATEGORIES: Record<string, GameSubCategory> = {
  // Puzzle & Brain Games
  puzzle: {
    id: 'puzzle',
    label: 'Puzzle',
    emoji: '🧩',
    keywords: ['puzzle', 'sudoku', 'crossword', 'match-3', 'swap', 'block', 'brain', 'logic', 'word search', 'jigsaw'],
    description: 'Brain teasers and puzzle games',
  },

  // Action Games
  action: {
    id: 'action',
    label: 'Action',
    emoji: '⚔️',
    keywords: ['action', 'fight', 'combat', 'battle', 'shoot', 'shoot-em-up', 'shmup', 'hack and slash'],
    description: 'Fast-paced action games',
  },

  // Shooter Games
  shooter: {
    id: 'shooter',
    label: 'Shooter',
    emoji: '🔫',
    keywords: ['shooter', 'fps', 'gun', 'blaster', 'bullet hell', 'third-person shooter', 'tps'],
    description: 'Shooting and gun games',
  },

  // RPG Games
  rpg: {
    id: 'rpg',
    label: 'RPG',
    emoji: '⚔️',
    keywords: ['rpg', 'role-playing', 'fantasy', 'quest', 'dungeons', 'monsters', 'leveling', 'loot', 'inventory', 'character'],
    description: 'Role-playing games with character progression',
  },

  // Strategy Games
  strategy: {
    id: 'strategy',
    label: 'Strategy',
    emoji: '♟️',
    keywords: ['strategy', 'tower defense', 'td', 'rts', 'real-time strategy', 'turn-based', 'tactics', 'chess', 'board game'],
    description: 'Strategic and tactical games',
  },

  // Platformer
  platformer: {
    id: 'platformer',
    label: 'Platformer',
    emoji: '🏃',
    keywords: ['platformer', 'platform', 'jump', 'side-scroller', 'runner', 'endless runner', 'parkour', 'hop'],
    description: 'Jumping and platforming games',
  },

  // Racing
  racing: {
    id: 'racing',
    label: 'Racing',
    emoji: '🏎️',
    keywords: ['racing', 'race', 'car', 'driving', 'bike', 'motorcycle', 'drift', 'asphalt', 'car racing'],
    description: 'Racing and driving games',
  },

  // Sports
  sports: {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    keywords: ['sports', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'golf', 'baseball', 'hockey'],
    description: 'Sports simulation games',
  },

  // Simulation
  simulation: {
    id: 'simulation',
    label: 'Simulation',
    emoji: '🎮',
    keywords: ['simulation', 'sim', 'simulator', 'tycoon', 'management', 'business', 'farm', 'city builder'],
    description: 'Simulation and management games',
  },

  // Adventure
  adventure: {
    id: 'adventure',
    label: 'Adventure',
    emoji: '🗺️',
    keywords: ['adventure', 'explore', 'adventure game', 'narrative', 'story', 'quest', 'treasure', 'exploration'],
    description: 'Adventure and exploration games',
  },

  // Casual
  casual: {
    id: 'casual',
    label: 'Casual',
    emoji: '😄',
    keywords: ['casual', 'simple', 'easy', 'relaxing', 'chill', 'fun', 'playful', 'lighthearted'],
    description: 'Casual and easy-to-play games',
  },

  // Idle/Clicker
  idle: {
    id: 'idle',
    label: 'Idle',
    emoji: '🔄',
    keywords: ['idle', 'clicker', 'clicking', 'incremental', 'tapping', 'tap', 'passive income', 'auto', 'automation'],
    description: 'Idle, clicker, and incremental games',
  },

  // Roguelike
  roguelike: {
    id: 'roguelike',
    label: 'Roguelike',
    emoji: '🎲',
    keywords: ['roguelike', 'rogue-like', 'dungeon', 'procedural', 'permadeath', 'random generation'],
    description: 'Roguelike and procedurally generated games',
  },

  // Battle Royale
  battleRoyale: {
    id: 'battleRoyale',
    label: 'Battle Royale',
    emoji: '👥',
    keywords: ['battle royale', 'br', 'royale', 'survival', 'last man standing', 'multiplayer battle'],
    description: 'Battle royale games',
  },

  // MOBA
  moba: {
    id: 'moba',
    label: 'MOBA',
    emoji: '⚡',
    keywords: ['moba', 'moba game', 'team fight', 'lane', 'minions', 'towers', 'hero'],
    description: 'Multiplayer Online Battle Arena',
  },

  // Card Games
  cardGame: {
    id: 'cardGame',
    label: 'Card Game',
    emoji: '🃏',
    keywords: ['card', 'card game', 'collectible card game', 'ccg', 'trading card', 'poker', 'solitaire', 'bridge'],
    description: 'Card and collectible card games',
  },

  // Merge Games
  merge: {
    id: 'merge',
    label: 'Merge',
    emoji: '🔀',
    keywords: ['merge', 'match', 'collect', 'combine', 'merge game', 'blast', 'match-3'],
    description: 'Merge and matching games',
  },

  // Multiplayer
  multiplayer: {
    id: 'multiplayer',
    label: 'Multiplayer',
    emoji: '👥',
    keywords: ['multiplayer', 'online', 'pvp', 'co-op', 'cooperative', 'competitive', 'mmo', 'online multiplayer'],
    description: 'Multiplayer and online games',
  },

  // Hypercasual
  hypercasual: {
    id: 'hypercasual',
    label: 'Hyper-casual',
    emoji: '⚡',
    keywords: ['hypercasual', 'hyper casual', 'hyper-casual', 'one-tap', 'one tap', 'quick play', 'mini game'],
    description: 'Hyper-casual one-tap games',
  },
};

/**
 * Detect game sub-category from app data
 */
export function detectGameSubCategory(
  title: string = '',
  description: string = '',
  genre: string = '',
  originalCategory?: string,
): string {
  const text = `${title} ${description} ${genre}`.toLowerCase();

  // Score each category by keyword matches
  const scores: Record<string, number> = {};

  Object.entries(GAME_SUBCATEGORIES).forEach(([id, category]) => {
    let score = 0;
    category.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      score += matches ? matches.length : 0;
    });
    if (score > 0) {
      scores[id] = score;
    }
  });

  // Return highest scoring category
  if (Object.keys(scores).length > 0) {
    return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
  }

  // Fallback to casual
  return 'casual';
}

/**
 * Get category label with emoji
 */
export function getCategoryLabel(categoryId: string): string {
  const cat = GAME_SUBCATEGORIES[categoryId];
  return cat ? `${cat.emoji} ${cat.label}` : 'Unknown';
}

/**
 * Get all sub-categories for filter dropdowns
 */
export function getAllSubCategories() {
  return Object.entries(GAME_SUBCATEGORIES).map(([id, cat]) => ({
    value: id,
    label: cat.label,
    emoji: cat.emoji,
  }));
}
