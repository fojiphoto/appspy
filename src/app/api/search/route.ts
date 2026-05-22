import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q       = searchParams.get('q');
  const country = searchParams.get('country') || 'us';
  const store   = searchParams.get('store')   || 'google';

  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      const raw: any[] = await (storeApp as any).search({ term: q, country, num: 20 });
      const results = raw.map((app: any) => ({
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
      return NextResponse.json({ results });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const results = await (gplay as any).search({
      term: q, country, lang: 'en', num: 20, fullDetail: false,
    });
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
