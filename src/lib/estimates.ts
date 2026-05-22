// Download & Revenue estimation based on chart rank + category + country

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  GAME: 1.0,
  GAME_ACTION: 1.1,
  GAME_CASUAL: 1.2,
  GAME_PUZZLE: 0.9,
  GAME_STRATEGY: 0.8,
  COMMUNICATION: 0.7,
  SOCIAL: 0.85,
  TOOLS: 0.4,
  PRODUCTIVITY: 0.35,
  EDUCATION: 0.3,
  HEALTH_AND_FITNESS: 0.45,
  SHOPPING: 0.55,
  ENTERTAINMENT: 0.65,
  default: 0.5,
};

const COUNTRY_MULTIPLIERS: Record<string, number> = {
  us: 1.0,
  cn: 0.9,
  in: 0.7,
  br: 0.5,
  ru: 0.45,
  de: 0.5,
  gb: 0.55,
  jp: 0.7,
  kr: 0.5,
  pk: 0.25,
  default: 0.3,
};

// Base daily downloads by rank position (US, Games)
const RANK_DOWNLOADS: [number, number][] = [
  [1,   120000],
  [5,   60000],
  [10,  25000],
  [20,  12000],
  [50,  4000],
  [100, 1200],
  [200, 400],
  [500, 100],
];

function interpolateDownloads(rank: number): number {
  if (rank <= 0) return 0;
  for (let i = 0; i < RANK_DOWNLOADS.length - 1; i++) {
    const [r1, d1] = RANK_DOWNLOADS[i];
    const [r2, d2] = RANK_DOWNLOADS[i + 1];
    if (rank >= r1 && rank <= r2) {
      const t = (rank - r1) / (r2 - r1);
      return Math.round(d1 + t * (d2 - d1));
    }
  }
  return 50;
}

export function estimateDailyDownloads(
  rank: number,
  category: string,
  country: string
): number {
  const base = interpolateDownloads(rank);
  const catMult = CATEGORY_MULTIPLIERS[category] ?? CATEGORY_MULTIPLIERS.default;
  const cntMult = COUNTRY_MULTIPLIERS[country] ?? COUNTRY_MULTIPLIERS.default;
  return Math.round(base * catMult * cntMult);
}

// Revenue estimated from Top Grossing rank
const GROSSING_REVENUE: [number, number][] = [
  [1,   300000],
  [5,   120000],
  [10,  60000],
  [20,  25000],
  [50,  8000],
  [100, 2500],
  [200, 800],
];

function interpolateRevenue(grossingRank: number): number {
  if (grossingRank <= 0) return 0;
  for (let i = 0; i < GROSSING_REVENUE.length - 1; i++) {
    const [r1, v1] = GROSSING_REVENUE[i];
    const [r2, v2] = GROSSING_REVENUE[i + 1];
    if (grossingRank >= r1 && grossingRank <= r2) {
      const t = (grossingRank - r1) / (r2 - r1);
      return Math.round(v1 + t * (v2 - v1));
    }
  }
  return 200;
}

export function estimateDailyRevenue(
  grossingRank: number,
  country: string
): number {
  const base = interpolateRevenue(grossingRank);
  const cntMult = COUNTRY_MULTIPLIERS[country] ?? COUNTRY_MULTIPLIERS.default;
  return Math.round(base * cntMult);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
