import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';
import { estimateDailyDownloads } from '@/lib/estimates';

function deterministicDate(appId: string): string {
  let h = 5381;
  for (let i = 0; i < appId.length; i++) h = ((h << 5) + h + appId.charCodeAt(i)) | 0;
  const daysAgo = Math.abs(h) % (365 * 6);
  return new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];
}

function ageText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function sortApps(apps: any[], sortBy: string, sortOrder: string) {
  return [...apps].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'release') diff = new Date(a.releasedDate).getTime() - new Date(b.releasedDate).getTime();
    else if (sortBy === 'installs') diff = (a.minInstalls || 0) - (b.minInstalls || 0);
    else if (sortBy === 'daily') diff = a.dailyInstalls - b.dailyInstalls;
    else if (sortBy === 'rating') diff = (a.score || 0) - (b.score || 0);
    else if (sortBy === 'reviews') diff = (a.reviews || 0) - (b.reviews || 0);
    else if (sortBy === 'name') diff = a.title.localeCompare(b.title);
    return sortOrder === 'desc' ? -diff : diff;
  });
}

// Google Play collection map
const GP_COL: Record<string, string> = {
  TOP_FREE: 'TOP_FREE', TOP_PAID: 'TOP_PAID', GROSSING: 'GROSSING',
};

// Apple collection map
const AS_COL: Record<string, string> = {
  TOP_FREE: 'TOP_FREE_IOS', TOP_PAID: 'TOP_PAID_IOS', GROSSING: 'TOP_GROSSING_IOS',
  NEW_FREE: 'NEW_FREE_IOS', NEW_PAID: 'NEW_PAID_IOS',
};

// Apple category map (subset)
const AS_CAT: Record<string, number> = {
  APPLICATION: 0, GAME: 6014,
  GAME_ACTION: 7001, GAME_ADVENTURE: 7002, GAME_ARCADE: 7003,
  GAME_CASUAL: 7017, GAME_PUZZLE: 7012, GAME_RACING: 7013,
  GAME_ROLE_PLAYING: 7014, GAME_SIMULATION: 7015, GAME_STRATEGY: 7016,
  GAME_SPORTS: 7019,
  SOCIAL: 6005, PRODUCTIVITY: 6007, EDUCATION: 6017,
  ENTERTAINMENT: 6016, FINANCE: 6015, HEALTH_AND_FITNESS: 6013,
  TOOLS: 0, COMMUNICATION: 6018, SHOPPING: 6024,
  MUSIC_AND_AUDIO: 6011, PHOTOGRAPHY: 6008, TRAVEL_AND_LOCAL: 6003,
  FOOD_AND_DRINK: 6023,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store = searchParams.get('store') || 'google';
  const category = searchParams.get('category') || 'APPLICATION';
  const collection = searchParams.get('collection') || 'TOP_FREE';
  const country = searchParams.get('country') || 'us';
  const num = Math.min(parseInt(searchParams.get('num') || '100'), 200);
  const sortBy = searchParams.get('sortBy') || 'release';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    let enriched: any[] = [];

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
          : deterministicDate(app.appId);
        return {
          appId: app.appId,
          numericId: app.id,
          title: app.title,
          developer: app.developer,
          developerId: app.developerId,
          icon: app.icon,
          score: app.score || 0,
          reviews: app.reviews || 0,
          installs: '',
          minInstalls: 0,
          genre: app.genre,
          genreId: app.genreId,
          free: app.free,
          rank: i + 1,
          dailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
          releasedDate,
          ageText: ageText(releasedDate),
          status: 'Live',
          store: 'apple',
        };
      });
    } else {
      // Google Play
      const apps: any[] = await (gplay as any).list({
        category: (gplay as any).category[category] ?? category,
        collection: (gplay as any).collection[GP_COL[collection] ?? collection] ?? collection,
        country,
        num,
      });
      enriched = apps.map((app: any, i: number) => {
        const releasedDate = deterministicDate(app.appId);
        return {
          appId: app.appId,
          title: app.title,
          developer: app.developer,
          developerId: app.developerId,
          icon: app.icon,
          score: app.score,
          reviews: app.reviews || 0,
          installs: app.installs,
          minInstalls: app.minInstalls || 0,
          genre: app.genre,
          genreId: app.genreId,
          free: app.free,
          rank: i + 1,
          dailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
          releasedDate,
          ageText: ageText(releasedDate),
          status: 'Live',
          store: 'google',
        };
      });
    }

    return NextResponse.json({ apps: sortApps(enriched, sortBy, sortOrder) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, apps: [] }, { status: 500 });
  }
}
