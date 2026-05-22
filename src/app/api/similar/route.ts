import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const country = searchParams.get('country') || 'us';

  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 });

  try {
    const apps = await (gplay as any).similar({ appId, country, lang: 'en', num: 12 });
    return NextResponse.json({ apps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
