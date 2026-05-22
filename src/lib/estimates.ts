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

// ─── Real-data based estimates (uses actual store fields) ─────────────────────

// DAU retention ratio by category (% of install base active daily)
const DAU_RATIO: Record<string, number> = {
  GAME:               0.08,
  GAME_ACTION:        0.10,
  GAME_CASUAL:        0.12,
  GAME_PUZZLE:        0.08,
  GAME_STRATEGY:      0.07,
  COMMUNICATION:      0.20,
  SOCIAL:             0.18,
  TOOLS:              0.12,
  PRODUCTIVITY:       0.10,
  EDUCATION:          0.08,
  HEALTH_AND_FITNESS: 0.09,
  SHOPPING:           0.06,
  ENTERTAINMENT:      0.10,
  default:            0.08,
};

// ARPDAU (avg revenue per DAU) by category — free/ad + IAP split
const ARPDAU: Record<string, { ad: number; iap: number }> = {
  GAME:               { ad: 0.005, iap: 0.060 },
  GAME_ACTION:        { ad: 0.008, iap: 0.070 },
  GAME_CASUAL:        { ad: 0.006, iap: 0.050 },
  GAME_PUZZLE:        { ad: 0.005, iap: 0.040 },
  GAME_STRATEGY:      { ad: 0.004, iap: 0.100 },
  COMMUNICATION:      { ad: 0.002, iap: 0.005 },
  SOCIAL:             { ad: 0.003, iap: 0.008 },
  TOOLS:              { ad: 0.003, iap: 0.020 },
  PRODUCTIVITY:       { ad: 0.004, iap: 0.030 },
  EDUCATION:          { ad: 0.003, iap: 0.025 },
  ENTERTAINMENT:      { ad: 0.004, iap: 0.030 },
  default:            { ad: 0.003, iap: 0.020 },
};

/**
 * Estimate current daily downloads from total install count + release date.
 * Uses install velocity decay — newer apps have higher daily rate.
 */
export function estimateDailyDownloadsFromInstalls(
  maxInstalls: number,
  released: string,   // e.g. "Jul 9, 2025"
): number {
  const releaseTs = new Date(released).getTime();
  if (!maxInstalls || isNaN(releaseTs)) return 0;
  const ageDays = Math.max(1, (Date.now() - releaseTs) / 86_400_000);
  const avgDaily = maxInstalls / ageDays;

  // Apps lose velocity over time — current rate < historical average
  const ageYears = ageDays / 365;
  const decay = ageYears < 0.5 ? 1.0
              : ageYears < 1   ? 0.65
              : ageYears < 2   ? 0.35
              : ageYears < 3   ? 0.18
              : 0.08;
  return Math.max(1, Math.round(avgDaily * decay));
}

/**
 * Estimate Daily Active Users from install base + category retention.
 */
export function estimateDAU(maxInstalls: number, genreId: string): number {
  const ratio = DAU_RATIO[genreId] ?? DAU_RATIO.default;
  return Math.round(maxInstalls * ratio);
}

/**
 * Estimate daily gross revenue from DAU + monetization model.
 * For paid apps: dailyDownloads × price × 0.7 (store cut).
 * For free apps: ad revenue + IAP revenue (if applicable).
 */
export function estimateDailyRevenueFromDAU(
  dau: number,
  free: boolean,
  offersIAP: boolean,
  price: number,
  genreId: string,
  dailyDownloads: number,
): number {
  if (!free && price > 0) {
    return Math.round(dailyDownloads * price * 0.7);
  }
  const rates = ARPDAU[genreId] ?? ARPDAU.default;
  const adRev  = dau * rates.ad;
  const iapRev = offersIAP ? dau * rates.iap : 0;
  return Math.round((adRev + iapRev) * 0.7);
}
