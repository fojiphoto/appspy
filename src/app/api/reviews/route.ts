import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const country = searchParams.get('country') || 'us';
  const page = parseInt(searchParams.get('page') || '0');
  const sort = searchParams.get('sort') || 'NEWEST';

  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 });

  try {
    const sortKey = (gplay as any).sort[sort] ?? (gplay as any).sort.NEWEST;
    const result = await (gplay as any).reviews({
      appId, country, lang: 'en',
      num: 20, page, sort: sortKey,
    });
    return NextResponse.json({ reviews: result.data, nextPaginationToken: result.nextPaginationToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
