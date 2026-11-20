/**
 * Server-side access to the Top New Games data set (data/top-new/latest.json), for the API
 * routes that used to ask DataForSEO for Google Play's "top new" charts.
 *
 * Google Play has no such chart any more, and production never had DataForSEO credentials, so
 * those routes returned nothing (or, in /api/market, silently returned the ordinary Top Free
 * chart under a "Top New" label). They now serve games whose release date was read from Google
 * Play and falls inside the last 30 days, ranked by Google Play's own install counter.
 */
import raw from '../../data/top-new/latest.json';
import { type TopNewData, rowsOf } from './topNew';

const data = raw as unknown as TopNewData;

export const topNewDate = (): string => data.date;

/** True for the categories this data set covers: games as a whole, or one game genre. */
export const isGameCategory = (category: string): boolean => category === 'GAME' || category.startsWith('GAME_');

function ageText(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * New games in the row shape the existing pages render: every free game, or every paid one.
 * `category` is a Google Play id: GAME for all games, or a genre such as GAME_PUZZLE.
 */
export function newGames(opts: { category: string; type?: string; num: number; days?: 30 | 60 | 90 | 180 | 270 }) {
  return rowsOf(data, String(opts.days ?? 30), opts.type === 'paid' ? 'paid' : 'free')
    .filter((g) => opts.category === 'GAME' || g.genreId === opts.category)
    .slice(0, opts.num)
    .map((g, i) => ({
      appId: g.pkg,
      title: g.title,
      developer: g.developer,
      developerId: g.developerId,
      icon: g.icon,
      score: g.score || 0,
      reviews: g.ratings || 0,
      installs: g.installsLabel,
      minInstalls: g.installs,
      genre: g.genre,
      genreId: g.genreId,
      free: g.free,
      price: g.price,
      rank: i + 1,
      // Measured, not modelled: installs since release divided by days since release.
      estDailyInstalls: g.perDay,
      estimatedDailyDownloads: g.perDay,
      releasedDate: g.released,
      ageText: ageText(g.ageDays),
      hasRealDate: true,
      status: 'Live',
      url: `https://play.google.com/store/apps/details?id=${g.pkg}`,
      store: 'google',
      dataSource: 'google-play',
    }));
}
