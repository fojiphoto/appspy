import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';
import { fetchAmazonAppDetail } from '@/lib/amazon';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId   = searchParams.get('appId');
  const store   = searchParams.get('store') || 'google';
  const country = searchParams.get('country') || 'us';

  if (!appId) {
    return NextResponse.json({ error: 'appId required' }, { status: 400 });
  }

  // ── Amazon Appstore ──────────────────────────────────────────────────────────
  if (store === 'amazon') {
    const detail = await fetchAmazonAppDetail(appId);
    if (!detail) return NextResponse.json({ error: 'App not found on Amazon Appstore' }, { status: 404 });
    return NextResponse.json({ detail, reviews: [], store: 'amazon' });
  }

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      const raw = await (storeApp as any).app({ appId, country });
      // Normalise to the same shape the detail page expects
      const detail = {
        appId:            raw.appId,
        url:              raw.url,
        title:            raw.title,
        description:      raw.description,
        summary:          raw.description?.slice(0, 200) || '',
        installs:         '—',
        minInstalls:      0,
        maxInstalls:      0,
        score:            raw.score        || 0,
        scoreText:        String(raw.score || 0),
        ratings:          raw.reviews      || 0,
        reviews:          raw.reviews      || 0,
        histogram:        [0, 0, 0, 0, 0],
        price:            raw.price        || 0,
        free:             raw.free         ?? true,
        currency:         raw.currency     || 'USD',
        developer:        raw.developer    || '',
        developerId:      raw.developerId  || '',
        developerEmail:   '',
        developerWebsite: raw.developerWebsite || '',
        icon:             raw.icon,
        headerImage:      raw.screenshots?.[0] || '',
        screenshots:      raw.screenshots  || [],
        video:            '',
        contentRating:    raw.contentRating || '',
        genre:            raw.primaryGenre  || raw.genres?.[0] || '',
        genreId:          String(raw.primaryGenreId || raw.genreIds?.[0] || ''),
        released:         raw.released,
        updated:          raw.updated ? Math.floor(new Date(raw.updated).getTime() / 1000) : 0,
        version:          raw.version      || '',
        recentChanges:    raw.releaseNotes || '',
        adSupported:      false,
        containsAds:      false,
        offersIAP:        raw.inAppPurchases ?? false,
        IAPRange:         '',
        androidVersion:   'iOS ' + (raw.requiredOsVersion || ''),
        androidVersionText: 'iOS ' + (raw.requiredOsVersion || ''),
        permissions:      [],
        store:            'apple',
      };
      return NextResponse.json({ detail, reviews: [], store: 'apple' });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const [detail, reviews] = await Promise.all([
      (gplay as any).app({ appId, country, lang: 'en' }),
      (gplay as any).reviews({ appId, country, lang: 'en', num: 10, sort: (gplay as any).sort.NEWEST }),
    ]);

    return NextResponse.json({ detail, reviews: reviews.data, store: 'google' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
