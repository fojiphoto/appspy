import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';
import { fetchAmazonChart } from '@/lib/amazon';
import { estimateDailyDownloads, estimateDailyRevenue } from '@/lib/estimates';
import { detectGameSubCategory } from '@/lib/gameCategories';

// ── Apple collection + category maps ─────────────────────────────────────────

const APPLE_COLLECTION: Record<string, string> = {
  TOP_FREE:     'TOP_FREE_IOS',
  TOP_PAID:     'TOP_PAID_IOS',
  GROSSING:     'TOP_GROSSING_IOS',
  TOP_NEW_FREE: 'NEW_FREE_IOS',
};

const APPLE_CATEGORY: Record<string, string> = {
  GAMES:             'GAMES',
  GAMES_ACTION:      'GAMES_ACTION',
  GAMES_CASUAL:      'GAMES_CASUAL',
  GAMES_PUZZLE:      'GAMES_PUZZLE',
  GAMES_STRATEGY:    'GAMES_STRATEGY',
  GAMES_RACING:      'GAMES_RACING',
  GAMES_SPORTS:      'GAMES_SPORTS',
  SOCIAL_NETWORKING: 'SOCIAL_NETWORKING',
  UTILITIES:         'UTILITIES',
  ENTERTAINMENT:     'ENTERTAINMENT',
  EDUCATION:         'EDUCATION',
  HEALTH_AND_FITNESS:'HEALTH_AND_FITNESS',
  PRODUCTIVITY:      'PRODUCTIVITY',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category   = searchParams.get('category')   || 'GAME';
  const country    = searchParams.get('country')    || 'us';
  const collection = searchParams.get('collection') || 'TOP_FREE';
  const store      = searchParams.get('store')      || 'google';
  const num        = Math.min(parseInt(searchParams.get('num') || '50'), 100);

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      const appleCol = APPLE_COLLECTION[collection] || 'TOP_FREE_IOS';
      const appleCat = APPLE_CATEGORY[category]     || category;

      const colKey = (storeApp as any).collection[appleCol];
      const catKey = (storeApp as any).category[appleCat];

      const results = await (storeApp as any).list({
        collection: colKey,
        category:   catKey,
        country,
        num,
      });

      const apps = (results || []).map((app: any, i: number) => {
        const isGame = category.includes('GAME');
        const gameSubCategory = isGame ? detectGameSubCategory(app.title, app.description || '', app.primaryGenre || '') : null;
        return {
          rank:                    i + 1,
          appId:                   app.appId,
          title:                   app.title,
          developer:               app.developer,
          icon:                    app.icon,
          score:                   app.score || 0,
          installs:                null,
          free:                    app.free ?? true,
          price:                   app.price || 0,
          genre:                   app.primaryGenre || '',
          genreId:                 String(app.primaryGenreId || ''),
          gameSubCategory:         gameSubCategory,
          estimatedDailyDownloads: estimateDailyDownloads(i + 1, 'GAME', country),
          estimatedDailyRevenue:   estimateDailyRevenue(i + 1, country),
          url:                     app.url,
          store:                   'apple',
        };
      });

      return NextResponse.json({ apps, category, country, collection, store: 'apple' });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Amazon Appstore ──────────────────────────────────────────────────────────
  if (store === 'amazon') {
    try {
      const raw = await fetchAmazonChart(collection, category, num);
      const apps = raw.map((app, i) => ({
        rank:                    i + 1,
        appId:                   app.appId,
        title:                   app.title,
        developer:               app.developer,
        icon:                    app.icon,
        score:                   app.score || 0,
        installs:                null,
        free:                    app.free,
        price:                   app.price,
        genre:                   'Amazon App',
        genreId:                 'APPLICATION',
        estimatedDailyDownloads: estimateDailyDownloads(i + 1, 'APPLICATION', 'us'),
        estimatedDailyRevenue:   estimateDailyRevenue(i + 1, 'us'),
        url:                     app.url,
        store:                   'amazon',
      }));
      return NextResponse.json({ apps, category, collection, store: 'amazon' });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const results = await (gplay as any).list({
      category:   (gplay as any).category[category]   || category,
      collection: (gplay as any).collection[collection] || collection,
      country,
      num,
      fullDetail: false,
    });

    const apps = results.map((app: any, i: number) => {
      const isGame = category.startsWith('GAME');
      const gameSubCategory = isGame ? detectGameSubCategory(app.title, app.description || '', app.genre) : null;
      return {
        rank:                    i + 1,
        appId:                   app.appId,
        title:                   app.title,
        developer:               app.developer,
        icon:                    app.icon,
        score:                   app.score,
        scoreText:               app.scoreText,
        installs:                app.installs,
        free:                    app.free,
        price:                   app.price,
        currency:                app.currency,
        genre:                   app.genre,
        genreId:                 app.genreId,
        gameSubCategory:         gameSubCategory,
        estimatedDailyDownloads: estimateDailyDownloads(i + 1, category, country),
        estimatedDailyRevenue:   estimateDailyRevenue(i + 1, country),
        url:                     app.url,
        store:                   'google',
      };
    });

    return NextResponse.json({ apps, category, country, collection, store: 'google' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
