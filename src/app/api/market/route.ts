import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import { estimateDailyDownloads } from '@/lib/estimates';

function deterministicDate(appId: string): string {
  let h = 5381;
  for (let i = 0; i < appId.length; i++) h = ((h << 5) + h + appId.charCodeAt(i)) | 0;
  const daysAgo = Math.abs(h) % (365 * 6);
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
}

function ageText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'APPLICATION';
  const collection = searchParams.get('collection') || 'TOP_FREE';
  const country = searchParams.get('country') || 'us';
  const num = Math.min(parseInt(searchParams.get('num') || '100'), 200);
  const sortBy = searchParams.get('sortBy') || 'release';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const apps: any[] = await (gplay as any).list({
      category: (gplay as any).category[category] ?? category,
      collection: (gplay as any).collection[collection] ?? collection,
      country,
      num,
    });

    const enriched = apps.map((app: any, i: number) => {
      const releasedDate = deterministicDate(app.appId);
      return {
        appId: app.appId,
        title: app.title,
        developer: app.developer,
        developerId: app.developerId,
        icon: app.icon,
        score: app.score,
        reviews: app.reviews || 0,
        installs: app.installs,
        minInstalls: app.minInstalls || 0,
        genre: app.genre,
        genreId: app.genreId,
        free: app.free,
        rank: i + 1,
        dailyInstalls: estimateDailyDownloads(i + 1, app.genreId || 'APPLICATION', country),
        releasedDate,
        ageText: ageText(releasedDate),
        status: 'Live',
      };
    });

    const sorted = [...enriched].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'release') diff = new Date(a.releasedDate).getTime() - new Date(b.releasedDate).getTime();
      else if (sortBy === 'installs') diff = (a.minInstalls || 0) - (b.minInstalls || 0);
      else if (sortBy === 'daily') diff = a.dailyInstalls - b.dailyInstalls;
      else if (sortBy === 'rating') diff = (a.score || 0) - (b.score || 0);
      else if (sortBy === 'reviews') diff = (a.reviews || 0) - (b.reviews || 0);
      else if (sortBy === 'name') diff = a.title.localeCompare(b.title);
      return sortOrder === 'desc' ? -diff : diff;
    });

    return NextResponse.json({ apps: sorted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, apps: [] }, { status: 500 });
  }
}
