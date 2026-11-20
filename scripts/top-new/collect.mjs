#!/usr/bin/env node
/**
 * Top New Games collector.
 *
 *   node scripts/top-new/collect.mjs            full daily run
 *   node scripts/top-new/collect.mjs --build    rebuild latest.json from what is on disk
 *
 * WHAT IT ANSWERS
 * "Which Android games were released in the last 1 / 2 / 3 / 6 / 9 months, and how many installs
 * does each one have?" Free games and paid games are ranked separately, as Play's own charts are. Every number in the answer is read from Google Play itself:
 *
 *   release date   the "Released on" date on the game's Play page
 *   installs       Play's own install counter (the exact figure behind "1,000,000+")
 *   rating         Play's score and number of ratings
 *
 * A game released N days ago has had all of its installs inside those N days, so for a game in the
 * 30-day window "total installs" IS "installs in the last 30 days". No third party estimates it.
 *
 * WHY NOT APPBRAIN (the source the original spec named)
 * Checked 2026-11-18. AppBrain's terms say sustained or automated extraction "requires an API
 * plan", and a plain server request gets a Cloudflare 403. Its figures also disagreed with Play on
 * the same day (a game it listed at 180K installs had 1.5M on Play; one it called 13 days old was
 * released 65 days earlier). So candidates and figures both come from Play.
 *
 * HOW CANDIDATES ARE FOUND
 * Play has no "new games" chart, so the collector reads the charts it does have, Top Free and Top
 * Grossing, for all 18 game categories in every country in COUNTRIES, 200 deep. Any game installed
 * fast enough to matter is in at least one of those. Each game it has not seen before gets one
 * detail request, which gives the release date; that date never changes, so it is asked for once
 * and remembered in known.json. The Play page of every developer on those charts is read too,
 * because some fast-growing games are on no chart at all (see "developer pages" below).
 *
 * THE ONE THING PLAY DOES NOT ALWAYS SAY
 * Some games have no "Released on" date on Play at all (and usually no ratings either). Their age
 * cannot be proved from Play, so they never enter the ranked tables. They are listed separately as
 * "undated", with the day this tracker first saw them, and their installs are recorded every day
 * so their real growth is measured from then on.
 *
 * FILES (data/top-new/)
 *   known.json                pkg -> release date "YYYY-MM-DD", or 0 when Play shows none. Append-only.
 *   developers.json           developer name -> the day their Play page was last read
 *   tracked.json              full record of every game inside the widest window, plus undated ones
 *   snapshots/YYYY-MM-DD.json pkg -> installs that day, for every tracked game
 *   latest.json               what the site reads: the three ranked tables, changes, run health
 *
 * A failed run never overwrites good data: nothing is written unless discovery mostly succeeded.
 */

import gplay from 'google-play-scraper';
import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DIR = join(ROOT, 'data', 'top-new');
const SNAPS = join(DIR, 'snapshots');

const CATEGORIES = [
  'GAME', 'GAME_ACTION', 'GAME_ADVENTURE', 'GAME_ARCADE', 'GAME_BOARD', 'GAME_CARD', 'GAME_CASINO',
  'GAME_CASUAL', 'GAME_EDUCATIONAL', 'GAME_MUSIC', 'GAME_PUZZLE', 'GAME_RACING', 'GAME_ROLE_PLAYING',
  'GAME_SIMULATION', 'GAME_SPORTS', 'GAME_STRATEGY', 'GAME_TRIVIA', 'GAME_WORD',
];
/** Big install markets plus the high-spend ones, so both volume hits and revenue hits are seen. */
const COUNTRIES = [
  'us', 'gb', 'de', 'fr', 'es', 'it', 'pl', 'ca', 'au', 'br', 'mx', 'ar', 'in', 'pk', 'id', 'vn',
  'ph', 'th', 'my', 'jp', 'kr', 'tr', 'sa', 'eg', 'ng', 'ru',
];
const COLLECTIONS = ['TOP_FREE', 'GROSSING'];
/** 1, 2, 3, 6 and 9 months. */
const WINDOWS = [30, 60, 90, 180, 270];
const TOP_N = 100;
/** Games are kept in tracked.json a little past the widest window so "dropped out" can be shown. */
const TRACK_DAYS = 280;

const LIST_CONCURRENCY = 6;
const DETAIL_CONCURRENCY = 8;
/** Fewer successful chart reads than this share means Play was blocking us: do not publish. */
const MIN_LIST_OK = 0.9;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}
/** Write through a temp file so a crash mid-write cannot leave half a file behind. */
async function writeJson(path, value) {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(value));
  await rename(tmp, path);
}

async function pool(items, size, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; await fn(items[i], i); }
  }));
}

/** Play's "Nov 5, 2026" -> "2026-11-05". Anything unparseable counts as no date. */
function parseReleased(text) {
  if (!text) return null;
  const t = Date.parse(`${text} UTC`);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

// ── 1. discovery ─────────────────────────────────────────────────────────────

async function discover() {
  const jobs = [];
  for (const country of COUNTRIES) for (const category of CATEGORIES) for (const collection of COLLECTIONS) {
    // Play has no Top Grossing chart in Russia (billing is suspended there); asking only fails.
    if (country === 'ru' && collection === 'GROSSING') continue;
    jobs.push({ country, category, collection });
  }
  /** pkg -> { free: [rank, country] | null, gross: [rank, country] | null, charts: n } */
  const seen = new Map();
  /** developer name -> a country one of their games charted in */
  const devs = new Map();
  let ok = 0; const failedJobs = [];

  await pool(jobs, LIST_CONCURRENCY, async (job) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const rows = await gplay.list({ category: job.category, collection: job.collection, country: job.country, lang: 'en', num: 200 });
        rows.forEach((row, i) => {
          const e = seen.get(row.appId) || { free: null, gross: null, charts: 0 };
          const key = job.collection === 'TOP_FREE' ? 'free' : 'gross';
          if (!e[key] || i + 1 < e[key][0]) e[key] = [i + 1, job.country, job.category];
          e.charts++;
          seen.set(row.appId, e);
          if (row.developer && !devs.has(row.developer)) devs.set(row.developer, job.country);
        });
        ok++;
        return;
      } catch {
        if (attempt < 2) await sleep(2000 * (attempt + 1));
      }
    }
    failedJobs.push(`${job.country}/${job.category}/${job.collection}`);
  });
  return { seen, devs, ok, failed: failedJobs.length, failedJobs, total: jobs.length };
}

// ── 1b. developer pages ──────────────────────────────────────────────────────

/**
 * Some fast-growing games are on no chart at all, in any country, and have no ratings: ad-driven
 * launches that reach a million installs before Play ranks them (checked 2026-11-20: nine games
 * with 1M to 3.4M installs each were absent from Top Free in 96 countries, and from "similar
 * games"). Every one of them was listed on its developer's own Play page. So the page of every
 * developer with a game on today's charts is read as well, and any game on it that is new to us
 * gets the same release-date check as a chart game.
 *
 * A developer's page is re-read every DEV_RECHECK_DAYS. The first read is back-dated by a few
 * days, differently for each developer, so the re-reads spread over the week instead of all
 * landing on the same day.
 */
const DEV_RECHECK_DAYS = 7;
const hashOf = (text) => { let h = 0; for (const c of text) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };
const shiftDate = (date, days) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);

async function readDeveloperPages(devs, state, date) {
  const due = [...devs.keys()].filter((name) => !state[name] || daysBetween(state[name], date) >= DEV_RECHECK_DAYS);
  /** pkg -> country to read its page in */
  const found = new Map();
  let failed = 0; let done = 0;
  await pool(due, 8, async (name) => {
    const country = devs.get(name);
    let read = false;
    for (let attempt = 0; attempt < 2 && !read; attempt++) {
      try {
        const apps = await gplay.developer({ devId: name, country, lang: 'en', num: 100 });
        for (const a of apps) if (!found.has(a.appId)) found.set(a.appId, country);
        read = true;
      } catch (e) {
        if (/404|not found/i.test(e.message)) read = true;       // no such page: nothing to retry
        else if (attempt === 0) await sleep(1500);
      }
    }
    if (read) state[name] = state[name] ? date : shiftDate(date, -(hashOf(name) % DEV_RECHECK_DAYS));
    else failed++;
    if (++done % 2000 === 0) console.log(`      developer pages ${done}/${due.length}`);
  });
  return { found, checked: due.length, failed };
}

// ── 2. details ───────────────────────────────────────────────────────────────

/** One Play detail page. Tries the country the game charted in first: an unavailable country
 *  returns the page without its release date. */
async function fetchDetail(pkg, countries) {
  let last = null;
  for (const country of countries) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const a = await gplay.app({ appId: pkg, country, lang: 'en' });
        last = { a, country };
        if (a.released || attempt > 0) break;
        break;
      } catch (e) {
        if (/404|not found/i.test(e.message)) return { gone: true };
        if (attempt < 2) await sleep(1500 * (attempt + 1)); else last = last || { error: e.message };
      }
    }
    if (last?.a?.released) break;
  }
  if (!last?.a) return { error: last?.error || 'no data' };
  const { a, country } = last;
  return {
    pkg,
    title: a.title,
    developer: a.developer,
    developerId: String(a.developerId || ''),
    genreId: a.genreId,
    genre: a.genre,
    icon: a.icon,
    released: parseReleased(a.released),
    updated: a.updated ? new Date(a.updated).toISOString().slice(0, 10) : null,
    installs: a.maxInstalls ?? null,
    installsLabel: a.installs ?? null,
    score: a.score ? Math.round(a.score * 100) / 100 : null,
    ratings: a.ratings ?? null,
    free: !!a.free,
    price: a.price || 0,
    iap: !!a.offersIAP,
    ads: !!a.adSupported,
    country,
  };
}

// ── 3. cross-check the release date against the game's own reviews ───────────

/**
 * Play's "Released on" is the date of the public release. A game that ran as early access first,
 * or was relaunched, can carry installs from before that date, and then "total installs" is no
 * longer "installs inside the window". Public reviews give that away: a review cannot be older
 * than the game. So every game that reaches a ranked table gets its 150 most helpful reviews read
 * once, and the oldest date among them is kept. Older than the release date means the game was
 * public before it, and the table says so instead of ranking it as new.
 */
async function oldestReview(pkg) {
  let oldest = null;
  for (const sort of [gplay.sort.HELPFULNESS, gplay.sort.NEWEST]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await gplay.reviews({ appId: pkg, country: 'us', lang: 'en', sort, num: 150 });
        for (const x of r.data) {
          const d = String(x.date).slice(0, 10);
          if (!oldest || d < oldest) oldest = d;
        }
        break;
      } catch {
        if (attempt === 0) await sleep(1500);
      }
    }
  }
  return oldest;
}

/**
 * Play's "Released on" is per country: a game launched in Turkey in September and worldwide in
 * October shows a different date depending on where the page is read from (seen 2026-11-19, the
 * same game read 2026-09-24 one day and 2026-10-22 the next). The date that matters is the first
 * one anywhere, so each game that reaches a table has its page read in RELEASE_COUNTRIES once and
 * the earliest date is kept.
 */
const RELEASE_COUNTRIES = ['us', 'in', 'br', 'id', 'tr', 'th', 'vn', 'kr'];

async function earliestRelease(pkg, start) {
  let earliest = start || null;
  for (const country of RELEASE_COUNTRIES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const a = await gplay.app({ appId: pkg, country, lang: 'en' });
        const d = parseReleased(a.released);
        if (d && (!earliest || d < earliest)) earliest = d;
        break;
      } catch (e) {
        if (/404|not found/i.test(e.message)) break;
        if (attempt === 0) await sleep(1500);
      }
    }
  }
  return earliest;
}

async function verifyTop(tracked, known, date) {
  const candidates = () => {
    const set = new Set();
    for (const days of WINDOWS) {
      Object.values(tracked)
        .filter((g) => g.released && g.installs != null && !g.gone && daysBetween(g.released, date) <= days && daysBetween(g.released, date) >= 0)
        .sort((a, b) => b.installs - a.installs)
        .filter((g, i, list) => i < TOP_N + 40
          || (!g.free && list.filter((x) => !x.free).indexOf(g) < TOP_N)
          || (isSmallTeam(g) && list.filter(isSmallTeam).indexOf(g) < TOP_N + 40))
        .forEach((g) => set.add(g.pkg));          // +40: replacements for flagged games are checked too
    }
    return [...set];
  };

  // An earlier release date can move a game out of a window, which brings an unchecked game in.
  // So the two checks repeat until a round finds nothing left to check (four rounds were enough
  // on the first full run; the cap is only a guard).
  let dates = 0; let reviews = 0;
  for (let round = 0; round < 8; round++) {
    const needDate = candidates().filter((p) => !tracked[p].relCheck);
    await pool(needDate, 4, async (pkg) => {
      const g = tracked[pkg];
      const earliest = await earliestRelease(pkg, g.released);
      if (earliest && earliest < g.released) { g.released = earliest; known[pkg] = earliest; }
      g.relCheck = { on: date, countries: RELEASE_COUNTRIES.length };
    });
    const needReview = candidates().filter((p) => !tracked[p].reviewCheck);
    await pool(needReview, 6, async (pkg) => {
      tracked[pkg].reviewCheck = { on: date, oldest: await oldestReview(pkg) };
    });
    dates += needDate.length; reviews += needReview.length;
    if (!needDate.length && !needReview.length) break;
  }
  return { dates, reviews };
}

/** Days by which the oldest public review precedes the release date; 0 when it does not. */
function publicBeforeRelease(g) {
  const oldest = g.reviewCheck?.oldest;
  if (!oldest || !g.released) return 0;
  const gap = daysBetween(oldest, g.released);
  return gap > 2 ? gap : 0;                     // two days of slack for time zones and rollout
}

// ── 4. build the views the site shows ────────────────────────────────────────

const STOP = new Set(('a an and the of for in on to with by from at is it my your our new game games free online offline '
  + 'app play fun best top pro hd 3d 2d 2026 2027 vs & - :').split(' '));

function themes(games) {
  const counts = new Map();
  for (const g of games) {
    const words = g.title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    const terms = new Set(words);
    for (let i = 0; i + 1 < words.length; i++) terms.add(`${words[i]} ${words[i + 1]}`);
    for (const t of terms) {
      const e = counts.get(t) || { term: t, count: 0, installs: 0, games: [] };
      e.count++; e.installs += g.installs || 0; e.games.push(g.pkg);
      counts.set(t, e);
    }
  }
  return [...counts.values()].filter((e) => e.count >= 3).sort((a, b) => b.count - a.count || b.installs - a.installs).slice(0, 40);
}

/**
 * The "small-team" list: the games a small studio could plausibly build and that live on ad
 * revenue. Both tests use only what Play declares about the game:
 *
 *   - it shows ads ("Contains ads" on its Play page), and
 *   - it is not a role-playing, strategy or casino game.
 *
 * A big-budget launch such as a new PUBG or Free Fire build is a new game by release date, and
 * stays in the "all free games" list, but it sells purchases and shows no ads, so it is not here.
 */
const HEAVY_GENRES = new Set(['GAME_ROLE_PLAYING', 'GAME_STRATEGY', 'GAME_CASINO']);
const isSmallTeam = (g) => g.free && g.ads && !HEAVY_GENRES.has(g.genreId);

/** What the site needs of one game. Rank, age and installs per day are worked out on the page. */
function slim(g, prev) {
  return {
    pkg: g.pkg, title: g.title, developer: g.developer, developerId: g.developerId,
    genreId: g.genreId, genre: g.genre, icon: g.icon,
    released: g.released, updated: g.updated,
    installs: g.installs, installsLabel: g.installsLabel,
    score: g.score, ratings: g.ratings,
    free: g.free, price: g.price, iap: g.iap, ads: g.ads,
    bestFree: g.bestFree, bestGross: g.bestGross, charts: g.charts,
    firstSeen: g.firstSeen,
    firstInstalls: g.firstInstalls ?? null,
    oldestReview: g.reviewCheck?.oldest || null,
    // Exact growth since the previous snapshot, once there is one.
    delta: prev?.installs?.[g.pkg] != null ? g.installs - prev.installs[g.pkg] : null,
  };
}

async function build(date) {
  const tracked = await readJson(join(DIR, 'tracked.json'), {});
  const snapFiles = (await readdir(SNAPS).catch(() => [])).filter((f) => f.endsWith('.json')).sort();
  const prevFile = snapFiles.filter((f) => f.slice(0, 10) < date).pop();
  const prev = prevFile ? await readJson(join(SNAPS, prevFile), null) : null;
  const run = (await readJson(join(SNAPS, `${date}.json`), {})).run || null;

  const games = {};                             // every game any list mentions, once
  const keep = (g) => { games[g.pkg] ??= slim(g, prev); return g.pkg; };

  const dated = Object.values(tracked).filter((g) => g.released && g.installs != null && !g.gone);
  const windows = {};
  for (const days of WINDOWS) {
    const all = dated
      .filter((g) => { const age = daysBetween(g.released, date); return age >= 0 && age <= days; })
      .sort((a, b) => b.installs - a.installs || a.pkg.localeCompare(b.pkg));
    // Public before its release date: its installs are not all from inside the window.
    const early = all.filter((g) => publicBeforeRelease(g) > 0);
    const inWindow = all.filter((g) => publicBeforeRelease(g) === 0);
    const picked = {
      small: inWindow.filter(isSmallTeam).slice(0, TOP_N),
      free: inWindow.filter((g) => g.free).slice(0, TOP_N),
      paid: inWindow.filter((g) => !g.free).slice(0, TOP_N),
    };
    const lists = {}; const before = {}; const themeWords = {};
    for (const [name, list] of Object.entries(picked)) {
      lists[name] = list.map(keep);
      // Yesterday's rank of each game in the same list, so the page can show movement.
      const was = prev?.ranks?.[days]?.[name];
      before[name] = was && Object.keys(was).length ? was : null;
      themeWords[name] = themes(list).map(({ term, count, installs }) => ({ term, count, installs }));
    }
    windows[days] = {
      days,
      pool: { small: inWindow.filter(isSmallTeam).length, free: inWindow.filter((g) => g.free).length, paid: inWindow.filter((g) => !g.free).length },
      lists, before, themes: themeWords,
      since: prev?.date || null,
      early: early.slice(0, 30).map(keep),
    };
  }

  // Undated: Play shows no release date. Listed apart, never ranked with the dated games.
  const undated = Object.values(tracked)
    .filter((g) => !g.released && g.installs != null && !g.gone)
    // Most installs gained since the tracker first saw the game; total installs break ties.
    .sort((a, b) => (b.installs - (b.firstInstalls ?? b.installs)) - (a.installs - (a.firstInstalls ?? a.installs)) || b.installs - a.installs)
    .slice(0, 200)
    .map(keep);

  await writeJson(join(DIR, 'latest.json'), {
    date, generatedAt: new Date().toISOString(), run, previous: prev?.date || null,
    snapshots: snapFiles.length, firstSnapshot: snapFiles[0]?.slice(0, 10) || date,
    countries: COUNTRIES, games, windows, undated,
  });
  return windows;
}

/** pkg -> rank for every list of every window: what tomorrow's run compares against. */
function ranksOf(windows) {
  const ranks = {};
  for (const [days, w] of Object.entries(windows)) {
    ranks[days] = {};
    for (const [name, list] of Object.entries(w.lists)) ranks[days][name] = Object.fromEntries(list.map((pkg, i) => [pkg, i + 1]));
  }
  return ranks;
}

// ── main ─────────────────────────────────────────────────────────────────────

const date = today();
await mkdir(SNAPS, { recursive: true });

if (process.argv.includes('--build')) {
  const dates = (await readdir(SNAPS)).filter((f) => f.endsWith('.json')).sort();
  const last = dates.pop().slice(0, 10);
  const t = await readJson(join(DIR, 'tracked.json'), {});
  const k = await readJson(join(DIR, 'known.json'), {});
  console.log('cross-check', await verifyTop(t, k, last));
  await writeJson(join(DIR, 'tracked.json'), t);
  await writeJson(join(DIR, 'known.json'), k);
  const w = await build(last);
  const snap = await readJson(join(SNAPS, `${last}.json`), null);
  if (snap) {
    snap.ranks = ranksOf(w);
    await writeJson(join(SNAPS, `${last}.json`), snap);
  }
  console.log('rebuilt', Object.fromEntries(Object.entries(w).map(([d, v]) => [d, v.pool])));
  process.exit(0);
}

const t0 = Date.now();
const known = await readJson(join(DIR, 'known.json'), {});
const tracked = await readJson(join(DIR, 'tracked.json'), {});

console.log(`[1/3] reading ${COUNTRIES.length} countries x ${CATEGORIES.length} categories x ${COLLECTIONS.length} charts`);
const { seen, devs, ok, failed, failedJobs, total } = await discover();
console.log(`      charts ok ${ok}/${total}, failed ${failed}, games seen ${seen.size}`);
if (ok / total < MIN_LIST_OK) {
  console.error('Too many chart reads failed. Nothing written; the site keeps the last good data.');
  process.exit(1);
}

// Which games need a detail request today:
//   - never seen before (need the release date)
//   - already tracked (need today's installs)
const devState = await readJson(join(DIR, 'developers.json'), {});
const devPages = await readDeveloperPages(devs, devState, date);
await writeJson(join(DIR, 'developers.json'), devState);
const offChart = [...devPages.found.keys()].filter((p) => !(p in known) && !seen.has(p));
console.log(`      developer pages read ${devPages.checked} (failed ${devPages.failed}) of ${devs.size} developers on the charts; ${offChart.length} games not on any chart`);

const fresh = [...seen.keys()].filter((p) => !(p in known));
const refresh = Object.keys(tracked).filter((p) => !tracked[p].gone);
// Known to be young enough to track, but not tracked: the span was widened, or tracked.json was lost.
const backfill = Object.keys(known).filter((p) => known[p] && !(p in tracked) && daysBetween(known[p], date) <= TRACK_DAYS);
const queue = [...new Set([...fresh, ...offChart, ...refresh, ...backfill])];
console.log(`[2/3] details: ${fresh.length} new on charts + ${offChart.length} from developer pages + ${refresh.length} tracked + ${backfill.length} to backfill = ${queue.length}`);

let done = 0; let errors = 0; let gone = 0;
await pool(queue, DETAIL_CONCURRENCY, async (pkg) => {
  const chart = seen.get(pkg);
  const hint = [chart?.free?.[1], chart?.gross?.[1], tracked[pkg]?.country, devPages.found.get(pkg), 'us'].filter(Boolean);
  const d = await fetchDetail(pkg, [...new Set(hint)]);
  done++;
  if (done % 2000 === 0) {
    console.log(`      ${done}/${queue.length}  (${Math.round((Date.now() - t0) / 1000)}s)`);
    await writeJson(join(DIR, 'known.json'), known);          // checkpoint: a re-run resumes from here
    await writeJson(join(DIR, 'tracked.json'), tracked);
  }
  if (d.gone) { gone++; if (tracked[pkg]) { tracked[pkg].gone = date; } else known[pkg] = known[pkg] ?? 0; return; }
  if (d.error) { errors++; return; }                          // unknown stays unknown: retried tomorrow

  // The earliest release date ever read is the one kept: Play's date differs by country, and a
  // later read can come back with a later date or with none.
  const released = [d.released, tracked[pkg]?.released, known[pkg] || null].filter(Boolean).sort()[0] || null;
  known[pkg] = released || 0;
  const isGame = String(d.genreId || '').startsWith('GAME');
  const age = released ? daysBetween(released, date) : null;
  const keep = isGame && (released ? age <= TRACK_DAYS : true);
  if (!keep) { delete tracked[pkg]; return; }
  tracked[pkg] = {
    ...d, released,
    firstSeen: tracked[pkg]?.firstSeen || date,
    firstInstalls: tracked[pkg]?.firstInstalls ?? d.installs,
    reviewCheck: tracked[pkg]?.reviewCheck || null,
    relCheck: tracked[pkg]?.relCheck || null,
    lastChart: chart ? date : (tracked[pkg]?.lastChart || null),
    bestFree: chart?.free || tracked[pkg]?.bestFree || null,
    bestGross: chart?.gross || tracked[pkg]?.bestGross || null,
    charts: chart?.charts || 0,
  };
});
console.log(`      done. errors ${errors}, removed from Play ${gone}`);

// Undated games are only worth watching while they are on a chart or still growing; an undated
// game that has been off every chart for two weeks is dropped from tracking.
for (const [pkg, g] of Object.entries(tracked)) {
  if (!g.released) {
    const offCharts = !g.lastChart || daysBetween(g.lastChart, date) > 14;
    const notGrowing = daysBetween(g.firstSeen, date) > 14 && g.installs < (g.firstInstalls ?? g.installs) * 1.05;
    if (offCharts && notGrowing) delete tracked[pkg];
  }
  if (g.gone && daysBetween(g.gone, date) > 7) delete tracked[pkg];
}

await writeJson(join(DIR, 'known.json'), known);
await writeJson(join(DIR, 'tracked.json'), tracked);

console.log('[3/3] snapshot + tables');
const installs = {};
for (const [pkg, g] of Object.entries(tracked)) if (g.installs != null && !g.gone) installs[pkg] = g.installs;
const run = {
  charts_ok: ok, charts_failed: failed, charts_failed_list: failedJobs, games_seen: seen.size, new_to_us: fresh.length,
  developers_checked: devPages.checked, found_on_developer_pages: offChart.length,
  detail_errors: errors, removed: gone, tracked: Object.keys(tracked).length,
  seconds: Math.round((Date.now() - t0) / 1000),
};
// Ranks are filled in after the tables are built, so tomorrow's run can show movement.
await writeJson(join(SNAPS, `${date}.json`), { date, run, installs, ranks: {} });
const checked = await verifyTop(tracked, known, date);
await writeJson(join(DIR, 'tracked.json'), tracked);
await writeJson(join(DIR, 'known.json'), known);
console.log(`      cross-check: release date in ${RELEASE_COUNTRIES.length} countries for ${checked.dates} games, reviews for ${checked.reviews}`);
const windows = await build(date);
await writeJson(join(SNAPS, `${date}.json`), { date, run, installs, ranks: ranksOf(windows) });

for (const [days, w] of Object.entries(windows)) {
  const top = tracked[w.lists.small[0]];
  const last = tracked[w.lists.small[w.lists.small.length - 1]];
  console.log(`      ${days}d small-team: ${w.pool.small} games, #1 ${top?.installs?.toLocaleString()} (${top?.title}), #${w.lists.small.length} ${last?.installs?.toLocaleString()}`);
}
console.log(`done in ${run.seconds}s`);
