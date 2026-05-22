import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const term = searchParams.get('term');
  const country = searchParams.get('country') || 'us';

  if (!term) return NextResponse.json({ error: 'term required' }, { status: 400 });

  try {
    const [suggestions, results] = await Promise.all([
      (gplay as any).suggest({ term, country, lang: 'en' }),
      (gplay as any).search({ term, country, lang: 'en', num: 10 }),
    ]);
    return NextResponse.json({ suggestions, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
