import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const country = searchParams.get('country') || 'us';

  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  try {
    const results = await (gplay as any).search({
      term: q,
      country,
      lang: 'en',
      num: 20,
      fullDetail: false,
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
