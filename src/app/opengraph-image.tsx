import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/ogImage';

export const alt = 'AppSpy by Factorial Studio: app market intelligence';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage('App market intelligence', 'Top charts, new releases and store data from Google Play, the App Store and Amazon.', ['Google Play', 'App Store', 'Amazon']);
}
