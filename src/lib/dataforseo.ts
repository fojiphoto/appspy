/**
 * DataForSEO App Data API client
 *
 * Docs: https://docs.dataforseo.com/v3/app_data/google/
 *
 * Endpoints used:
 *   POST /v3/app_data/google/app_list/live   — chart listings
 *   POST /v3/app_data/google/app_info/live   — per-app details (released_date)
 *
 * Auth: HTTP Basic — base64(login:password)
 * Cost:
 *   app_list  → $0.0012 per 100 results (~$0.0000120 per app)
 *   app_info  → $0.0006 per result      (~$0.0006 per app)
 */

const BASE = 'https://api.dataforseo.com/v3';

/** Returns true if credentials are configured */
export function hasDFSCredentials(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const login    = process.env.DATAFORSEO_LOGIN    || '';
  const password = process.env.DATAFORSEO_PASSWORD || '';
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

// ── Country: ISO → DataForSEO location_code ──────────────────────────────────
export const LOCATION_CODES: Record<string, number> = {
  us: 2840, gb: 2826, in: 2356, pk: 2586, de: 2276,
  jp: 2392, br: 2076, fr: 2250, tr: 2792, au: 2036,
  ca: 2124, kr: 2410, ru: 2643, id: 2360,
};

// ── Our collection key → DataForSEO app_collection value ─────────────────────
export const DFS_COLLECTION_MAP: Record<string, string> = {
  TOP_FREE:        'topselling_free',
  TOP_PAID:        'topselling_paid',
  GROSSING:        'topgrossing',
  TOP_NEW_FREE:    'topselling_new_free',
  TOP_NEW_PAID:    'topselling_new_paid',
  MOVERS_SHAKERS:  'movers_shakers',
};

// Collections that DataForSEO handles (not google-play-scraper)
export const DFS_ONLY_COLLECTIONS = new Set([
  'TOP_NEW_FREE', 'TOP_NEW_PAID', 'MOVERS_SHAKERS',
]);

// ── app_list ──────────────────────────────────────────────────────────────────
export interface DFSListItem {
  rank_group:     number;
  rank_absolute:  number;
  app_id:         string;
  title:          string;
  icon:           string;
  rating:         { value: number; votes_count: number } | null;
  price:          { current: number; currency: string } | null;
  is_free:        boolean;
  categories:     string[];
  developer_name: string;
  developer_url:  string;
  installs:       string | null;
}

export async function dfsAppList(opts: {
  collection: string;   // DFS app_collection value e.g. 'topselling_new_free'
  category?: string;    // e.g. 'GAME', 'SOCIAL' — omit for all categories
  country: string;      // ISO 2-letter
  num: number;
}): Promise<DFSListItem[]> {
  const locationCode = LOCATION_CODES[opts.country] ?? 2840;
  const depth = Math.min(Math.ceil(opts.num / 100) * 100, 200); // round up to 100 or 200

  const body: Record<string, unknown> = {
    app_collection: opts.collection,
    location_code:  locationCode,
    language_code:  'en',
    depth,
  };
  if (opts.category && opts.category !== 'APPLICATION') {
    body.app_category = opts.category;
  }

  const res = await fetch(`${BASE}/app_data/google/app_list/live`, {
    method:  'POST',
    headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' },
    body:    JSON.stringify([body]),
    cache:   'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DFS app_list ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const statusCode = data?.tasks?.[0]?.status_code;
  if (statusCode && statusCode !== 20000) {
    throw new Error(`DFS app_list task error ${statusCode}: ${data?.tasks?.[0]?.status_message}`);
  }

  return (data?.tasks?.[0]?.result?.[0]?.items ?? []) as DFSListItem[];
}

// ── app_info ──────────────────────────────────────────────────────────────────
export interface DFSAppInfo {
  app_id:           string;
  title:            string;
  released_date:    string | null;   // e.g. "2024-03-15 00:00:00 +00:00"
  last_update_date: string | null;
  installs:         string | null;
  rating:           { value: number; votes_count: number } | null;
  developer:        { name: string; id: string } | null;
}

/**
 * Batch fetch app details for up to 50 apps.
 * Returns a map of appId → DFSAppInfo.
 * Apps that fail to load are silently omitted from the map.
 */
export async function dfsAppInfo(
  appIds: string[],
  country: string
): Promise<Record<string, DFSAppInfo>> {
  if (appIds.length === 0) return {};
  const locationCode = LOCATION_CODES[country] ?? 2840;

  // DataForSEO live endpoint accepts up to 100 items per POST
  const body = appIds.slice(0, 50).map(id => ({
    app_id:        id,
    location_code: locationCode,
    language_code: 'en',
  }));

  const res = await fetch(`${BASE}/app_data/google/app_info/live`, {
    method:  'POST',
    headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    cache:   'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DFS app_info ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  // One task per app — collect successful results
  const map: Record<string, DFSAppInfo> = {};
  for (const task of data?.tasks ?? []) {
    if (task?.status_code !== 20000) continue;
    const item = task?.result?.[0]?.items?.[0];
    if (item?.app_id) map[item.app_id] = item as DFSAppInfo;
  }
  return map;
}
