import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import { estimateDailyDownloads, estimateDailyRevenue } from '@/lib/estimates';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'GAME';
  const country = searchParams.get('country') || 'us';
  const collection = searchParams.get('collection') || 'topselling_free';
  const num = Math.min(parseInt(searchParams.get('num') || '50'), 100);

  try {
    const results = await (gplay as any).list({
      category: (gplay as any).category[category] || category,
      collection: (gplay as any).collection[collection] || collection,
      country,
      num,
      fullDetail: false,
    });

    const apps = results.map((app: any, index: number) => ({
      rank: index + 1,
      appId: app.appId,
      title: app.title,
      developer: app.developer,
      icon: app.icon,
      score: app.score,
      scoreText: app.scoreText,
      installs: app.installs,
      free: app.free,
      price: app.price,
      currency: app.currency,
      genre: app.genre,
      genreId: app.genreId,
      estimatedDailyDownloads: estimateDailyDownloads(index + 1, category, country),
      estimatedDailyRevenue: estimateDailyRevenue(index + 1, country),
      url: app.url,
    }));

    return NextResponse.json({ apps, category, country, collection });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
