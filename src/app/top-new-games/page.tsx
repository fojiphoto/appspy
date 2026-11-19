import type { Metadata } from 'next';
import data from '../../../data/top-new/latest.json';
import type { TopNewData } from '@/lib/topNew';
import TopNewGamesClient from './TopNewGamesClient';

export const metadata: Metadata = {
  title: 'Top 100 New Android Games (1 to 9 months) — AppSpy',
  description:
    'The 100 most-installed free Android games released in the last 1, 2, 3, 6 and 9 months. Release dates, install counts and ratings are read from Google Play every day.',
};

/**
 * The data file is written by scripts/top-new/collect.mjs, then committed and pushed by the daily
 * task (scripts/top-new/daily.ps1), so each push rebuilds this page with that day's tables.
 * Nothing is fetched at request time.
 */
export default function TopNewGamesPage() {
  return <TopNewGamesClient data={data as unknown as TopNewData} />;
}
