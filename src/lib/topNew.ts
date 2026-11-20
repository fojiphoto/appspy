/**
 * Types and the two estimate models for the Top New Games page.
 *
 * Everything in `TopNewGame` is read from Google Play by scripts/top-new/collect.mjs. The two
 * functions below are the only invented numbers on that page, and the page labels them as
 * estimates everywhere they appear.
 */

export interface TopNewGame {
  pkg: string;
  title: string;
  developer: string;
  developerId: string;
  genreId: string;
  genre: string;
  icon: string;
  /** "YYYY-MM-DD": the earliest "Released on" date found on Google Play, or null when Play shows none. */
  released: string | null;
  updated: string | null;
  /** Play's own install counter, the exact number behind the "1,000,000+" label. */
  installs: number;
  installsLabel: string | null;
  score: number | null;
  ratings: number | null;
  free: boolean;
  price: number;
  iap: boolean;
  ads: boolean;
  /** [rank, country, category] of the best chart position seen today. */
  bestFree: [number, string, string] | null;
  bestGross: [number, string, string] | null;
  charts: number;
  /** The day this tracker first recorded the game. */
  firstSeen: string;
  /** Installs on that first day, so growth since then is a measured number. */
  firstInstalls?: number | null;
  /** Oldest date among the game's most helpful and newest public reviews. */
  oldestReview: string | null;
  /** Installs gained since the previous snapshot. Null until there is one. */
  delta: number | null;
}

/**
 * small  shows ads and is not a role-playing, strategy or casino game: what a small studio builds
 * free   every free game, big-budget launches included
 * paid   paid games, ranked on their own as Google Play does
 */
export type ListName = 'small' | 'free' | 'paid';

/** A game placed in one list of one window. */
export interface TopNewRow extends TopNewGame {
  rank: number;
  ageDays: number;
  perDay: number;
  /** Rank in the same list in the previous snapshot. Null when it was not in it. */
  prevRank: number | null;
}

export interface TopNewWindow {
  days: number;
  /** How many games qualified for each list, before the cut to 100. */
  pool: Record<ListName, number>;
  /** Package ids in rank order. */
  lists: Record<ListName, string[]>;
  /** Yesterday's pkg -> rank for each list, or null when there is nothing comparable. */
  before: Record<ListName, Record<string, number> | null>;
  themes: Record<ListName, { term: string; count: number; installs: number }[]>;
  since: string | null;
  /** In the window by release date, but public before it, so not ranked. */
  early: string[];
}

export interface TopNewData {
  date: string;
  generatedAt: string;
  previous: string | null;
  snapshots: number;
  firstSnapshot: string;
  countries: string[];
  run: null | {
    charts_ok: number; charts_failed: number; games_seen: number; new_to_us: number;
    detail_errors: number; removed: number; tracked: number; seconds: number;
    developers_checked?: number; found_on_developer_pages?: number;
  };
  /** Every game any list mentions, once. */
  games: Record<string, TopNewGame>;
  windows: Record<string, TopNewWindow>;
  /** Games with no release date on Google Play, most installed first. */
  undated: string[];
}

const DAY = 86400000;
export const daysBetween = (from: string, to: string): number => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

/** The rows of one list, with rank, age and installs per day filled in. */
export function rowsOf(data: TopNewData, days: string, list: ListName): TopNewRow[] {
  const win = data.windows[days];
  if (!win) return [];
  const before = win.before?.[list] || null;
  return (win.lists[list] || []).flatMap((pkg, i) => {
    const g = data.games[pkg];
    if (!g) return [];
    const ageDays = g.released ? daysBetween(g.released, data.date) : 0;
    return [{ ...g, rank: i + 1, ageDays, perDay: Math.round(g.installs / Math.max(1, ageDays)), prevRank: before ? before[pkg] ?? null : null }];
  });
}

/**
 * UA spend. Real ad spend is not public; this is installs x paid share x cost per install, in
 * three scenarios, because the country mix of a game's installs is unknown and CPI differs by
 * 20x between cheap and expensive countries.
 *
 * Benchmarks (from the tracker spec, 2026-11-18):
 *   Adjust Gaming App Insights 2026: global gaming CPI $0.56, North America $1.68, LATAM $0.14;
 *   median paid-to-organic ratio 3.33, i.e. about 77% of installs paid.
 *   Casual/puzzle Android CPI by region (Playio / Game Growth Advisor 2026): US $1.50-3.50,
 *   Southeast Asia $0.20-0.60, India $0.08-0.30.
 */
export const UA_SCENARIOS = [
  { key: 'low', label: 'Low (cheap-country mix)', paidShare: 0.5, cpi: 0.1 },
  { key: 'mid', label: 'Mid (global blend)', paidShare: 0.77, cpi: 0.4 },
  { key: 'high', label: 'High (US-heavy)', paidShare: 0.77, cpi: 2.0 },
] as const;

export function uaSpend(installs: number) {
  const [low, mid, high] = UA_SCENARIOS.map((s) => Math.round(installs * s.paidShare * s.cpi));
  return { low, mid, high };
}

/**
 * Revenue since launch. Play publishes no revenue, so this is installs x an assumed revenue per
 * install, as a low-high range. The per-install figures are working assumptions for a worldwide
 * install mix, not measured values and not from a published benchmark:
 *
 *   ads only        $0.02 - $0.10   a short-lived ad-funded game, mostly low-CPM countries
 *   ads + purchases $0.05 - $0.30
 *   purchases only  $0.05 - $0.50
 *   paid game       price x installs x 0.70 (Play keeps 30% at most)
 *
 * A game's Top Grossing chart position, shown beside the estimate, is the only real revenue
 * signal Play gives, and it is a rank, not an amount.
 */
export const REVENUE_PER_INSTALL = {
  ads: [0.02, 0.1],
  both: [0.05, 0.3],
  iap: [0.05, 0.5],
} as const;

export function revenueRange(g: Pick<TopNewGame, 'installs' | 'free' | 'price' | 'iap' | 'ads'>): { low: number; high: number } | null {
  if (!g.free && g.price > 0) {
    const v = Math.round(g.installs * g.price * 0.7);
    return { low: v, high: v };
  }
  const band = g.iap && g.ads ? REVENUE_PER_INSTALL.both : g.iap ? REVENUE_PER_INSTALL.iap : g.ads ? REVENUE_PER_INSTALL.ads : null;
  if (!band) return null; // free, no ads, no purchases: nothing to estimate from
  return { low: Math.round(g.installs * band[0]), high: Math.round(g.installs * band[1]) };
}

export function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

export const money = (n: number) => `$${compact(n)}`;
