import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage';

export const alt = 'Top 100 new Android games, read from Google Play every day';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage('Top 100 New Android Games', 'Release date, installs and rating read from Google Play every day.', ['1 to 9 months', 'Small-team games', 'CSV']);
}
