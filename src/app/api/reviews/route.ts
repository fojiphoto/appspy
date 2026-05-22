import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId   = searchParams.get('appId');
  const country = searchParams.get('country') || 'us';
  const page    = parseInt(searchParams.get('page') || '0');
  const sort    = searchParams.get('sort') || 'NEWEST';
  const store   = searchParams.get('store') || 'google';

  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 });

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      // app-store-scraper reviews() needs the numeric id; fetch it first
      const appDetail = await (storeApp as any).app({ appId, country });
      const sortKey   = sort === 'RATING' ? (storeApp as any).sort.HELPFUL : (storeApp as any).sort.RECENT;
      const result    = await (storeApp as any).reviews({
        id: appDetail.id, country, sort: sortKey, page: page + 1,
      });
      // Normalise to the same shape as Google reviews
      const reviews = (result || []).map((r: any) => ({
        id:        r.id,
        userName:  r.userName,
        userImage: r.userImage || '',
        date:      r.date,
        score:     r.score,
        title:     r.title || '',
        text:      r.text,
        replyDate: r.replyDate || null,
        replyText: r.replyText || null,
        version:   r.version || '',
        thumbsUp:  r.helpful || 0,
      }));
      return NextResponse.json({ reviews, nextPaginationToken: null });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const sortKey = (gplay as any).sort[sort] ?? (gplay as any).sort.NEWEST;
    const result  = await (gplay as any).reviews({
      appId, country, lang: 'en', num: 20, page, sort: sortKey,
    });
    return NextResponse.json({ reviews: result.data, nextPaginationToken: result.nextPaginationToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
