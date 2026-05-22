import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const devId = searchParams.get('devId');
  const country = searchParams.get('country') || 'us';

  if (!devId) return NextResponse.json({ error: 'devId required' }, { status: 400 });

  try {
    const apps = await (gplay as any).developer({
      devId,
      country,
      lang: 'en',
      num: 60,
    });

    return NextResponse.json({ apps, devId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
