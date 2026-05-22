/**
 * /api/market
 *
 * Data sources:
 *
 *   Google Play (basic charts: TOP_FREE, TOP_PAID, GROSSING)
 *     → google-play-scraper
 *     → Release dates NOT available in list results (null)
 *
 *   Google Play (new + trending: TOP_NEW_FREE, TOP_NEW_PAID, MOVERS_SHAKERS)
 *     → DataForSEO App Data API  ($0.0012 per 100 apps)
 *     → Real released_date from DataForSEO app_info (first 20 apps only)
 *     → Falls back to google-play-scraper TOP_FREE if credentials missing
 *
 *   Apple App Store (all collections)
 *     → app-store-scraper → Apple's official RSS feed
 *     → NEW_FREE_IOS / NEW_PAID_IOS = genuinely newly published apps
 *     → REAL release dates from Apple's feed
 *
 * estDailyInstalls = rank-position estimate (labeled "Est." in UI)
 */

import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';
import { estimateDailyDownloads } from '@/lib/estimates';
import {
  hasDFSCredentials,
  dfsAppList,
  dfsAppInfo,
  DFS_COLLECTION_MAP,
  DFS_ONLY_COLLECTIONS,
} from '@/lib/dataforseo';

function ageText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30)  return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function sortApps(apps: any[], sortBy: string, sortOrder: string) {
  return [...apps].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'release') {
      if (!a.releasedDate && !b.releasedDate) return 0;
      if (!a.releasedDate) return 1;
      if (!b.releasedDate) return -1;
      diff = new Date(a.releasedDate).getTime() - new Date(b.releasedDate).getTime();
    } else if (sortBy === 'installs') diff = (a.minInstalls  || 0) - (b.minInstalls  || 0);
    else if (sortBy === 'daily')      diff = a.estDailyInstalls    - b.estDailyInstalls;
    else if (sortBy === 'rating')     diff = (a.score        || 0) - (b.score        || 0);
    else if (sortBy === 'reviews')    diff = (a.reviews      || 0) - (b.reviews      || 0);
    else if (sortBy === 'name')       diff = a.title.localeCompare(b.title);
    return sortOrder === 'desc' ? -diff : diff;
  });
}

// Google Play (google-play-scraper): only 3 collections supported
const GP_COL: Record<string, string> = {
  TOP_FREE: 'TOP_FREE', TOP_PAID: 'TOP_PAID', GROSSING: 'GROSSING',
};

// Apple: full collection set including new releases
const AS_COL: Record<string, string> = {
  TOP_FREE:  'TOP_FREE_IOS',
  TOP_PAID:  'TOP_PAID_IOS',
  GROSSING:  'TOP_GROSSING_IOS',
  NEW_FREE:  'NEW_FREE_IOS',
  NEW_PAID:  'NEW_PAID_IOS',
};

// Apple numeric category IDs
const AS_CAT: Record<string, number> = {
  APPLICATION: 0, GAME: 6014,
  GAME_ACTION: 7001, GAME_ADVENTURE: 7002, GAME_ARCADE: 7003,
  GAME_CASUAL: 7017, GAME_PUZZLE: 7012, GAME_RACING: 7013,
  GAME_ROLE_PLAYING: 7014, GAME_SIMULATION: 7015, GAME_STRATEGY: 7016,
  GAME_SPORTS: 7019, SOCIAL: 6005, PRODUCTIVITY: 6007, EDUCATION: 6017,
  ENTERTAINMENT: 6016, FINANCE: 6015, HEALTH_AND_FITNESS: 6013,
  COMMUNICATION: 6018, SHOPPING: 6024, MUSIC_AND_AUDIO: 6011,
  PHOTOGRAPHY: 6008, TRAVEL_AND_LOCAL: 6003, FOOD_AND_DRINK: 6023,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store      = searchParams.get('store')      || 'google';
  const category   = searchParams.get('category')   || 'APPLICATION';
  const collection = searchParams.get('collection') || 'TOP_FREE';
  const country    = searchParams.get('country')    || 'us';
  const num        = Math.min(parseInt(searchParams.get('num') || '100'), 200);
  const sortBy     = searchParams.get('sortBy')     || 'installs';
  const sortOrder  = searchParams.get('sortOrder')  || 'desc';

  try {
    let enriched: any[] = [];

    /* ── Apple App Store ─────────────────────────────────────────────── */
    if (store === 'apple') {
      const appleCol = AS_COL[collection] || 'TOP_FREE_IOS';
      const appleOpts: any = {
        collection: (storeApp as any).collection[appleCol],
        country,
        num,
      };
      const catId = AS_CAT[category];
      if (catId) appleOpts.category = catId;

      const apps: any[] = await (storeApp as any).list(appleOpts);
      enriched = apps.map((app: any, i: number) => {
        const releasedDate = app.released
          ? new Date(app.released).toISOString().split('T')[0]
          : null;
        return {
          appId:            app.appId,
          numericId:        app.id,
          title:            app.title,
          developer:        app.developer,
          developerId:      app.developerId,
          icon:             app.icon,
          score:            app.score || 0,
          reviews:          app.reviews || 0,
          installs:         null,
          minInstalls:      0,
          genre:            app.genre,
          genreId:          app.genreId,
          free:             app.free,
          rank:             i + 1,
          estDailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
          releasedDate,
          ageText:          releasedDate ? ageText(releasedDate) : null,
          hasRealDate:      !!releasedDate,
          status:           'Live',
          store:            'apple',
        };
      });

    /* ── Google Play via DataForSEO (new & trending collections) ────── */
    } else if (DFS_ONLY_COLLECTIONS.has(collection) && hasDFSCredentials()) {
      const dfsCol = DFS_COLLECTION_MAP[collection];
      const items  = await dfsAppList({
        collection: dfsCol,
        category:   category !== 'APPLICATION' ? category : undefined,
        country,
        num,
      });

      // Fetch release dates for first 20 apps (cost ~$0.012)
      const appIds = items.slice(0, 20).map((item: any) => item.app_id);
      let infoMap: Record<string, any> = {};
      try {
        infoMap = await dfsAppInfo(appIds, country);
      } catch {
        // Non-fatal — show apps without dates
      }

      enriched = items.map((item: any, i: number) => {
        const info         = infoMap[item.app_id];
        const rawDate      = info?.released_date;
        const releasedDate = rawDate
          ? new Date(rawDate).toISOString().split('T')[0]
          : null;

        return {
          appId:            item.app_id,
          title:            item.title,
          developer:        item.developer_name || '',
          developerId:      '',
          icon:             item.icon,
          score:            item.rating?.value       || 0,
          reviews:          item.rating?.votes_count || 0,
          installs:         item.installs            || null,
          minInstalls:      0,
          genre:            item.categories?.[0]     || '',
          genreId:          category,
          free:             item.is_free ?? true,
          rank:             i + 1,
          estDailyInstalls: estimateDailyDownloads(i + 1, category, country),
          releasedDate,
          ageText:          releasedDate ? ageText(releasedDate) : null,
          hasRealDate:      !!releasedDate,
          status:           'Live',
          store:            'google',
          dataSource:       'dataforseo',
        };
      });

    /* ── Google Play via google-play-scraper (TOP_FREE, TOP_PAID, GROSSING) */
    } else {
      // If a DFS-only collection is requested but credentials are missing,
      // fall back gracefully to TOP_FREE
      const gpCol = GP_COL[collection] || 'TOP_FREE';
      const apps: any[] = await (gplay as any).list({
        category:   (gplay as any).category[category] ?? category,
        collection: (gplay as any).collection[gpCol],
        country,
        num,
      });

      enriched = apps.map((app: any, i: number) => ({
        appId:            app.appId,
        title:            app.title,
        developer:        app.developer,
        developerId:      app.developerId,
        icon:             app.icon,
        score:            app.score,
        reviews:          app.reviews || 0,
        installs:         app.installs,
        minInstalls:      app.minInstalls || 0,
        genre:            app.genre,
        genreId:          app.genreId,
        free:             app.free,
        rank:             i + 1,
        estDailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
        releasedDate:     null,
        ageText:          null,
        hasRealDate:      false,
        status:           'Live',
        store:            'google',
        dataSource:       'gplay-scraper',
      }));
    }

    return NextResponse.json({ apps: sortApps(enriched, sortBy, sortOrder) });
  } catch (e: any) {
    console.error('[/api/market]', e.message);
    return NextResponse.json({ error: e.message, apps: [] }, { status: 500 });
  }
}
