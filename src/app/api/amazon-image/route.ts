/**
 * /api/amazon-image?url=ENCODED_URL
 *
 * Proxy for Amazon CDN images.
 * Amazon's CDN (m.media-amazon.com) blocks cross-origin <img> requests
 * from non-Amazon referrers. This proxy fetches the image server-side
 * with the correct Referer header and streams it to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-eu.ssl-images-amazon.com',
  'images-fe.ssl-images-amazon.com',
];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) return new NextResponse('Missing url param', { status: 400 });

  let url: URL;
  try {
    url = new URL(decodeURIComponent(raw));
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  // Security: only proxy from Amazon's image CDN
  if (!ALLOWED_HOSTS.some(h => url.hostname === h)) {
    return new NextResponse('Forbidden host', { status: 403 });
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Referer':       'https://www.amazon.com/',
        'User-Agent':    'Mozilla/5.0 (Linux; Android 10; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/84.4.20 like Chrome/84.0.4147.125 Safari/537.36',
        'Accept':        'image/webp,image/apng,image/*,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!res.ok) return new NextResponse('Image not found', { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // cache 24h
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[amazon-image proxy]', err.message);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
