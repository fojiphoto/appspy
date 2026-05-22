import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId   = searchParams.get('appId');
  const country = searchParams.get('country') || 'us';
  const store   = searchParams.get('store')   || 'google';

  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 });

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      const raw: any[] = await (storeApp as any).similar({ appId, country, num: 12 });
      const apps = raw.map((app: any) => ({
        appId:       app.appId,
        title:       app.title,
        developer:   app.developer,
        icon:        app.icon,
        score:       app.score  || 0,
        reviews:     app.reviews || 0,
        installs:    null,
        minInstalls: 0,
        genre:       app.primaryGenre || '',
        genreId:     String(app.primaryGenreId || ''),
        free:        app.free ?? true,
        url:         app.url,
        store:       'apple',
      }));
      return NextResponse.json({ apps });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const apps = await (gplay as any).similar({ appId, country, lang: 'en', num: 12 });
    return NextResponse.json({ apps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
