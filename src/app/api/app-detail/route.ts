import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
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

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const [detail, reviews] = await Promise.all([
      (gplay as any).app({ appId, country, lang: 'en' }),
      (gplay as any).reviews({ appId, country, lang: 'en', num: 10, sort: (gplay as any).sort.NEWEST }),
    ]);

    return NextResponse.json({ detail, reviews: reviews.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
