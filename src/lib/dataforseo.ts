/**
 * DataForSEO App Data API client
 *
 * Docs: https://docs.dataforseo.com/v3/app_data/google/
 *
 * Pattern (async task):
 *   POST /{endpoint}/task_post        — submit (returns task IDs)
 *   GET  /{endpoint}/tasks_ready      — poll until tasks appear
 *   GET  task.endpoint_advanced       — fetch results (URL from tasks_ready)
 *
 * Cost:
 *   app_list  → $0.0012 per 100 results
 *   app_info  → $0.0006 per app (one task per app)
 */

const BASE = 'https://api.dataforseo.com/v3';

export function hasDFSCredentials(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const l = process.env.DATAFORSEO_LOGIN    || '';
  const p = process.env.DATAFORSEO_PASSWORD || '';
  return 'Basic ' + Buffer.from(`${l}:${p}`).toString('base64');
}
const H = () => ({ 'Authorization': authHeader(), 'Content-Type': 'application/json' });

// ── Country: ISO → DataForSEO location_code ──────────────────────────────────
export const LOCATION_CODES: Record<string, number> = {
  us: 2840, gb: 2826, in: 2356, pk: 2586, de: 2276,
  jp: 2392, br: 2076, fr: 2250, tr: 2792, au: 2036,
  ca: 2124, kr: 2410, ru: 2643, id: 2360,
};

// ── Collection key → DataForSEO app_collection value ─────────────────────────
export const DFS_COLLECTION_MAP: Record<string, string> = {
  TOP_FREE:        'topselling_free',
  TOP_PAID:        'topselling_paid',
  GROSSING:        'topgrossing',
  TOP_NEW_FREE:    'topselling_new_free',
  TOP_NEW_PAID:    'topselling_new_paid',
  MOVERS_SHAKERS:  'movers_shakers',
};

// Collections only available via DataForSEO (not google-play-scraper)
export const DFS_ONLY_COLLECTIONS = new Set([
  'TOP_NEW_FREE', 'TOP_NEW_PAID', 'MOVERS_SHAKERS',
]);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Core: submit → poll → fetch ───────────────────────────────────────────────
/**
 * Submit tasks, wait for ALL (or at least minReady) to complete, return items.
 * Uses endpoint_advanced from tasks_ready to fetch results.
 */
async function runTasks(
  endpoint:   string,    // e.g. 'app_data/google/app_list'
  payload:    object[],  // array of task bodies
  minReady:   number = 1,
  pollMs:     number = 2500,
  maxWaitMs:  number = 30000,
): Promise<any[]> {

  /* 1 — Submit */
  const postRes = await fetch(`${BASE}/${endpoint}/task_post`, {
    method: 'POST', headers: H(), body: JSON.stringify(payload), cache: 'no-store',
  });
  if (!postRes.ok) throw new Error(`DFS task_post HTTP ${postRes.status}`);
  const postData = await postRes.json();
  if (postData.status_code !== 20000)
    throw new Error(`DFS task_post error ${postData.status_code}: ${postData.status_message}`);

  const submittedIds = new Set<string>(
    (postData.tasks || []).map((t: any) => t.id).filter(Boolean)
  );
  if (!submittedIds.size) throw new Error('DFS: no task IDs returned from task_post');

  /* 2 — Poll tasks_ready */
  const deadline   = Date.now() + maxWaitMs;
  const readyTasks: any[] = [];

  while (Date.now() < deadline) {
    await sleep(pollMs);
    const r = await fetch(`${BASE}/${endpoint}/tasks_ready`, { headers: H(), cache: 'no-store' });
    if (!r.ok) continue;
    const d = await r.json();
    const batch: any[] = d.tasks?.[0]?.result || [];

    for (const t of batch) {
      if (submittedIds.has(t.id) && !readyTasks.find(r => r.id === t.id)) {
        readyTasks.push(t);
      }
    }
    if (readyTasks.length >= minReady) break;
  }

  if (!readyTasks.length) throw new Error(`DFS: timeout waiting for tasks (${maxWaitMs}ms)`);

  /* 3 — Fetch results via endpoint_advanced */
  const allItems: any[] = [];
  for (const task of readyTasks) {
    const url = task.endpoint_advanced
      ? `https://api.dataforseo.com${task.endpoint_advanced}`
      : `${BASE}/${endpoint}/task_get/advanced/${task.id}`;
    const r = await fetch(url, { headers: H(), cache: 'no-store' });
    if (!r.ok) continue;
    const d = await r.json();
    // app_list: result[0].items = all apps
    // app_info: result[0].items[0] = single app
    const items = d.tasks?.[0]?.result?.[0]?.items ?? [];
    allItems.push(...items);
  }
  return allItems;
}

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
  collection: string;
  category?:  string;
  country:    string;
  num:        number;
}): Promise<DFSListItem[]> {
  const depth = Math.min(Math.ceil(opts.num / 100) * 100, 200);
  const payload: Record<string, unknown> = {
    app_collection: opts.collection,
    location_code:  LOCATION_CODES[opts.country] ?? 2840,
    language_code:  'en',
    depth,
  };
  if (opts.category && opts.category !== 'APPLICATION') {
    payload.app_category = opts.category;
  }
  // app_list = single task → wait for 1
  return runTasks('app_data/google/app_list', [payload], 1) as Promise<DFSListItem[]>;
}

// ── app_info ──────────────────────────────────────────────────────────────────
export interface DFSAppInfo {
  app_id:           string;
  title:            string;
  released_date:    string | null;   // "2026-05-07 03:00:00 +00:00"
  last_update_date: string | null;
  installs:         string | null;   // "50,000+"
  rating:           { value: number; votes_count: number } | null;
}

/**
 * Batch fetch release dates for up to 20 apps.
 * Returns { appId: DFSAppInfo } map. Non-fatal on error.
 */
export async function dfsAppInfo(
  appIds:  string[],
  country: string,
): Promise<Record<string, DFSAppInfo>> {
  if (!appIds.length) return {};
  const loc     = LOCATION_CODES[country] ?? 2840;
  const ids     = appIds.slice(0, 20);
  const payload = ids.map(id => ({ app_id: id, location_code: loc, language_code: 'en' }));

  try {
    // app_info = one task per app → wait for at least half to complete
    const minReady = Math.max(1, Math.floor(ids.length / 2));
    const items    = await runTasks('app_data/google/app_info', payload, minReady, 2500, 25000);
    const map: Record<string, DFSAppInfo> = {};
    for (const item of items) {
      if (item?.app_id) map[item.app_id] = item as DFSAppInfo;
    }
    return map;
  } catch {
    return {}; // Non-fatal — caller shows apps without dates
  }
}
