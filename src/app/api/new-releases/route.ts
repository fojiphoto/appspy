/**
 * /api/new-releases
 *
 * Returns newly published apps with REAL release dates.
 *
 * Google Play  → DataForSEO app_list (topselling_new_free / topselling_new_paid)
 *               + DataForSEO app_info for per-app released_date
 *               Falls back to empty list if credentials not configured.
 *
 * Apple Store  → app-store-scraper (NEW_FREE_IOS / NEW_PAID_IOS)
 *               100% free, real dates from Apple's official RSS feed.
 *
 * Query params:
 *   store      google | apple          (default: google)
 *   category   APPLICATION | GAME | …  (default: APPLICATION)
 *   country    us | gb | pk | …        (default: us)
 *   num        1–100                   (default: 20)
 *   type       free | paid             (default: free)
 */

import { NextRequest, NextResponse } from 'next/server';
import storeApp from 'app-store-scraper';
import {
  hasDFSCredentials,
  dfsAppList,
  dfsAppInfo,
  DFS_COLLECTION_MAP,
} from '@/lib/dataforseo';
import { estimateDailyDownloads } from '@/lib/estimates';

function ageText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0)   return 'Today';
  if (days === 1)   return '1 day ago';
  if (days < 30)    return `${days} days ago`;
  if (days < 365)   return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Apple category IDs
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
  const store    = searchParams.get('store')    || 'google';
  const category = searchParams.get('category') || 'APPLICATION';
  const country  = searchParams.get('country')  || 'us';
  const num      = Math.min(parseInt(searchParams.get('num') || '20'), 100);
  const type     = searchParams.get('type')     || 'free'; // free | paid

  try {
    /* ── Apple App Store ───────────────────────────────────────────────── */
    if (store === 'apple') {
      const colKey = type === 'paid' ? 'NEW_PAID_IOS' : 'NEW_FREE_IOS';
      const appleOpts: any = {
        collection: (storeApp as any).collection[colKey],
        country,
        num,
      };
      const catId = AS_CAT[category];
      if (catId) appleOpts.category = catId;

      const apps: any[] = await (storeApp as any).list(appleOpts);
      const enriched = apps.map((app: any, i: number) => {
        const releasedDate = app.released
          ? new Date(app.released).toISOString().split('T')[0]
          : null;
        return {
          appId:           app.appId,
          numericId:       app.id,
          title:           app.title,
          developer:       app.developer,
          developerId:     app.developerId,
          icon:            app.icon,
          score:           app.score  || 0,
          reviews:         app.reviews || 0,
          installs:        null,
          genre:           app.genre,
          genreId:         app.genreId,
          free:            app.free,
          rank:            i + 1,
          estDailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
          releasedDate,
          ageText:         releasedDate ? ageText(releasedDate) : null,
          hasRealDate:     !!releasedDate,
          store:           'apple',
        };
      });

      return NextResponse.json({
        apps:   enriched,
        source: 'apple-rss',
        hasRealDates: true,
      });
    }

    /* ── Google Play via DataForSEO ────────────────────────────────────── */
    if (!hasDFSCredentials()) {
      return NextResponse.json({
        apps:         [],
        source:       'unconfigured',
        hasRealDates: false,
        message:      'DataForSEO credentials not configured. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to .env.local',
      });
    }

    const dfsCollection = type === 'paid'
      ? DFS_COLLECTION_MAP['TOP_NEW_PAID']
      : DFS_COLLECTION_MAP['TOP_NEW_FREE'];

    // Step 1: Get chart listing
    const listItems = await dfsAppList({
      collection: dfsCollection,
      category:   category !== 'APPLICATION' ? category : undefined,
      country,
      num,
    });

    if (!listItems.length) {
      return NextResponse.json({ apps: [], source: 'dataforseo', hasRealDates: false });
    }

    // Step 2: Batch fetch release dates (top 20 only to keep cost minimal)
    const appIds   = listItems.slice(0, 20).map(item => item.app_id);
    let   infoMap: Record<string, any> = {};
    try {
      infoMap = await dfsAppInfo(appIds, country);
    } catch {
      // app_info failure is non-fatal — show apps without dates
    }

    const enriched = listItems.map((item, i) => {
      const info     = infoMap[item.app_id];
      const rawDate  = info?.released_date; // "2024-03-15 00:00:00 +00:00"
      const releasedDate = rawDate
        ? new Date(rawDate).toISOString().split('T')[0]
        : null;

      return {
        appId:           item.app_id,
        title:           item.title,
        developer:       item.developer_name || '',
        developerId:     '',
        icon:            item.icon,
        score:           item.rating?.value      || 0,
        reviews:         item.rating?.votes_count || 0,
        installs:        item.installs            || null,
        minInstalls:     0,
        genre:           item.categories?.[0]     || '',
        free:            item.is_free ?? (type !== 'paid'),
        rank:            i + 1,
        estDailyInstalls: estimateDailyDownloads(i + 1, category, country),
        releasedDate,
        ageText:         releasedDate ? ageText(releasedDate) : null,
        hasRealDate:     !!releasedDate,
        store:           'google',
      };
    });

    // hasRealDates = true if at least half the returned apps have dates
    const dateCount    = enriched.filter(a => a.hasRealDate).length;
    const hasRealDates = dateCount >= Math.min(3, enriched.length);

    return NextResponse.json({ apps: enriched, source: 'dataforseo', hasRealDates });

  } catch (e: any) {
    console.error('[/api/new-releases]', e.message);
    return NextResponse.json(
      { error: e.message, apps: [], source: 'error', hasRealDates: false },
      { status: 500 }
    );
  }
}
