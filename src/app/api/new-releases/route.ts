/**
 * /api/new-releases
 *
 * Returns newly published apps with REAL release dates.
 *
 * Google Play  → data/top-new/latest.json, written daily by scripts/top-new/collect.mjs:
 *               games released in the last 30 days, release date and installs read from
 *               Google Play. Games only; `country` does not apply (installs are worldwide).
 *
 * Apple Store  → app-store-scraper (NEW_FREE_IOS / NEW_PAID_IOS)
 *               100% free, real dates from Apple's official RSS feed.
 *
 * Query params:
 *   store      google | apple | amazon (default: google)
 *   category   APPLICATION | GAME | …  (default: APPLICATION)
 *   country    us | gb | pk | …        (default: us)
 *   num        1–100                   (default: 20)
 *   type       free | paid             (default: free)
 */

import { NextRequest, NextResponse } from 'next/server';
import storeApp from 'app-store-scraper';
import { fetchAmazonChart } from '@/lib/amazon';
import { isGameCategory, newGames, topNewDate } from '@/lib/topNewData';
import { estimateDailyDownloads } from '@/lib/estimates';

function ageText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0)   return 'Today';
  if (days === 1)   return '1 day ago';
  if (days < 30)    return `${days} days ago`;
  if (days < 365)   return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Google Play → Apple category ID mapping
const AS_CAT: Record<string, number> = {
  APPLICATION:         0,      // All Categories
  GAME:                6014,   // Games
  GAME_ACTION:         7001,   // Games > Action
  GAME_CASUAL:         7003,   // Games > Casual (mapped to Arcade, closest match)
  GAME_PUZZLE:         7012,   // Games > Puzzle
  GAME_STRATEGY:       7016,   // Games > Strategy
  GAME_ARCADE:         7003,   // Games > Arcade
  COMMUNICATION:       6018,   // Developer Tools / Communication
  SOCIAL:              6005,   // Social Networking
  TOOLS:               6002,   // Utilities
  PRODUCTIVITY:        6007,   // Productivity
  ENTERTAINMENT:       6016,   // Entertainment
  EDUCATION:           6017,   // Education
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store    = searchParams.get('store')    || 'google';
  const category = searchParams.get('category') || 'APPLICATION';
  const country  = searchParams.get('country')  || 'us';
  const num      = Math.min(parseInt(searchParams.get('num') || '20'), 100);
  const type     = searchParams.get('type')     || 'free'; // free | paid

  try {
    /* ── Amazon Appstore ───────────────────────────────────────────────── */
    if (store === 'amazon') {
      const raw = await fetchAmazonChart('TOP_NEW_FREE', category, num);
      const enriched = raw.map((app: any, i: number) => ({
        appId:            app.appId,
        title:            app.title,
        developer:        app.developer,
        developerId:      '',
        icon:             app.icon,
        score:            app.score || 0,
        reviews:          app.reviews || 0,
        installs:         null,
        genre:            'Amazon App',
        genreId:          'APPLICATION',
        free:             app.free,
        rank:             i + 1,
        estDailyInstalls: estimateDailyDownloads(i + 1, 'APPLICATION', 'us'),
        releasedDate:     null,
        ageText:          null,
        hasRealDate:      false,
        store:            'amazon',
      }));
      return NextResponse.json({
        apps:        enriched,
        source:      'amazon',
        hasRealDates: false,
      });
    }

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

      const listed: any[] = await (storeApp as any).list(appleOpts);
      // Apple's "new apps" feed ignores the genre it is asked for and returns every category
      // (seen 2026-11-18: 109 apps, 23 genres, for a Games request). Filter here instead.
      const wantGames = category === 'GAME' || category.startsWith('GAME_');
      const apps = wantGames ? listed.filter((app: any) => app.genre === 'Games' || String(app.genreId) === '6014') : listed;
      const enriched = apps.slice(0, num).map((app: any, i: number) => {
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

    /* ── Google Play: games with a release date read from Google Play ─── */
    // Google Play has no "top new" chart, and the DataForSEO route this used to call was never
    // configured in production, so it returned nothing. See src/lib/topNewData.ts.
    if (!isGameCategory(category)) {
      return NextResponse.json({
        apps: [], source: 'google-play', hasRealDates: true,
        message: 'New releases on Google Play are tracked for games only. Pick a game category.',
      });
    }
    return NextResponse.json({
      apps: newGames({ category, type, num }),
      source: 'google-play',
      hasRealDates: true,
      updated: topNewDate(),
    });

  } catch (e: any) {
    console.error('[/api/new-releases]', e.message);
    return NextResponse.json(
      { error: e.message, apps: [], source: 'error', hasRealDates: false },
      { status: 500 }
    );
  }
}
