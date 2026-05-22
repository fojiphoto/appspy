import { NextRequest, NextResponse } from 'next/server';

/**
 * Ad Intelligence API — Meta Ad Library
 *
 * Searches Facebook/Instagram ads by developer/advertiser name.
 * Requires META_ACCESS_TOKEN in .env.local
 *
 * Docs: https://developers.facebook.com/docs/graph-api/reference/ads_archive/
 *
 * GET /api/ads?developer=Lessmore+GmbH&country=US&limit=20
 */

const META_BASE = 'https://graph.facebook.com/v19.0';

const AD_FIELDS = [
  'id',
  'ad_creative_bodies',
  'ad_creative_link_titles',
  'ad_creative_link_descriptions',
  'ad_snapshot_url',
  'page_name',
  'page_id',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'impressions',
  'publisher_platforms',
  'languages',
  'media_type',
].join(',');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const developer = (searchParams.get('developer') || '').trim();
  const country   = (searchParams.get('country')   || 'US').toUpperCase();
  const limit     = Math.min(Number(searchParams.get('limit') || 24), 50);
  const token     = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ ads: [], source: 'unconfigured', message: 'META_ACCESS_TOKEN not set' });
  }
  if (!developer) {
    return NextResponse.json({ error: 'developer param required' }, { status: 400 });
  }

  try {
    const url = new URL(`${META_BASE}/ads_archive`);
    url.searchParams.set('search_terms',        developer);
    url.searchParams.set('ad_type',             'ALL');
    url.searchParams.set('ad_reached_countries', JSON.stringify([country]));
    url.searchParams.set('fields',              AD_FIELDS);
    url.searchParams.set('limit',               String(limit));
    url.searchParams.set('access_token',        token);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();

    if (data.error) {
      console.error('Meta Ad Library error:', data.error);
      return NextResponse.json({ ads: [], source: 'error', error: data.error.message });
    }

    const ads: MetaAd[] = (data.data || []).map((ad: any) => ({
      id:          ad.id,
      bodyText:    ad.ad_creative_bodies?.[0]      || null,
      headline:    ad.ad_creative_link_titles?.[0]  || null,
      description: ad.ad_creative_link_descriptions?.[0] || null,
      snapshotUrl: ad.ad_snapshot_url               || null,
      pageName:    ad.page_name                     || null,
      pageId:      ad.page_id                       || null,
      startDate:   ad.ad_delivery_start_time        || null,
      stopDate:    ad.ad_delivery_stop_time         || null,
      impressions: ad.impressions                   || null,   // { lower_bound, upper_bound }
      platforms:   ad.publisher_platforms           || [],
      languages:   ad.languages                     || [],
      mediaType:   ad.media_type                    || 'UNKNOWN',
      isActive:    !ad.ad_delivery_stop_time,
    }));

    return NextResponse.json({ ads, source: 'meta', total: ads.length });
  } catch (err: any) {
    console.error('Ads API error:', err);
    return NextResponse.json({ ads: [], source: 'error', error: err.message });
  }
}

export interface MetaAd {
  id:          string;
  bodyText:    string | null;
  headline:    string | null;
  description: string | null;
  snapshotUrl: string | null;
  pageName:    string | null;
  pageId:      string | null;
  startDate:   string | null;
  stopDate:    string | null;
  impressions: { lower_bound: string; upper_bound: string } | null;
  platforms:   string[];
  languages:   string[];
  mediaType:   string;
  isActive:    boolean;
}
