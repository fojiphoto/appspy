import { NextRequest, NextResponse } from 'next/server';
import gplay from 'google-play-scraper';
import storeApp from 'app-store-scraper';

// ── Score helpers ─────────────────────────────────────────────────────────────

function computeVolume(term: string, suggestions: string[], results: any[]): number {
  let score = 25;
  if (term.length <= 4)       score += 30;
  else if (term.length <= 7)  score += 20;
  else if (term.length <= 12) score += 12;
  else                        score += 5;
  score += Math.min(suggestions.length * 4, 20);
  const top3    = results.slice(0, 3);
  const avgRevs = top3.reduce((s: number, a: any) => s + (a.reviews || 0), 0) / Math.max(top3.length, 1);
  if      (avgRevs > 1_000_000) score += 25;
  else if (avgRevs > 100_000)   score += 18;
  else if (avgRevs > 10_000)    score += 12;
  else if (avgRevs > 1_000)     score += 7;
  else                          score += 3;
  return Math.min(Math.round(score), 100);
}

function computeDifficulty(results: any[]): number {
  const top5 = results.slice(0, 5);
  if (!top5.length) return 50;
  const avgScore = top5.reduce((s: number, a: any) => s + (a.score || 4), 0) / top5.length;
  const avgRevs  = top5.reduce((s: number, a: any) => s + (a.reviews || 0), 0) / top5.length;
  let d = (avgScore / 5) * 35;
  d += Math.min((Math.log10(Math.max(avgRevs, 1)) / 6) * 65, 65);
  return Math.round(Math.min(Math.max(d, 5), 100));
}

function deterministicVariation(str: string, range: number): number {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % range) - Math.floor(range / 2);
}

function suggestionMetrics(suggestion: string, baseVolume: number, baseDifficulty: number) {
  const lenFactor = Math.max(0.4, 1 - (suggestion.length - 5) * 0.018);
  const vol  = Math.round(Math.min(Math.max(baseVolume * lenFactor + deterministicVariation(suggestion, 18), 5), 100));
  const diff = Math.round(Math.min(Math.max(baseDifficulty + deterministicVariation(suggestion, 26), 5), 100));
  return { volume: vol, difficulty: diff };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const term    = searchParams.get('term');
  const country = searchParams.get('country') || 'us';
  const store   = searchParams.get('store')   || 'google';

  if (!term) return NextResponse.json({ error: 'term required' }, { status: 400 });

  // ── Apple App Store ──────────────────────────────────────────────────────────
  if (store === 'apple') {
    try {
      const [rawSuggestions, rawResults] = await Promise.all([
        (storeApp as any).suggest({ term, country }),
        (storeApp as any).search({ term, country, num: 15 }),
      ]);
      const suggestions: string[] = rawSuggestions || [];
      const results = (rawResults || []).map((a: any, i: number) => ({
        appId:     a.appId,
        title:     a.title,
        developer: a.developer,
        icon:      a.icon,
        score:     a.score || 0,
        reviews:   a.reviews || 0,
        installs:  null,
        free:      a.free ?? true,
        url:       a.url,
        store:     'apple',
        rank:      i + 1,
      }));
      const volume     = computeVolume(term, suggestions, results);
      const difficulty = computeDifficulty(results);
      const chance     = Math.round(Math.min(Math.max(100 - difficulty + 5, 5), 95));
      const relatedKeywords = suggestions.map(s => ({
        keyword: s,
        ...suggestionMetrics(s, volume, difficulty),
      }));
      return NextResponse.json({ suggestions, relatedKeywords, results, volume, difficulty, chance, resultsCount: results.length });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Google Play ──────────────────────────────────────────────────────────────
  try {
    const [rawSuggestions, rawResults] = await Promise.all([
      (gplay as any).suggest({ term, country, lang: 'en' }),
      (gplay as any).search({ term, country, lang: 'en', num: 15, fullDetail: false }),
    ]);
    const suggestions: string[] = rawSuggestions || [];
    const results = (rawResults || []).map((a: any, i: number) => ({
      appId:     a.appId,
      title:     a.title,
      developer: a.developer,
      icon:      a.icon,
      score:     a.score || 0,
      reviews:   a.reviews || 0,
      installs:  a.installs  || null,
      minInstalls: a.minInstalls || 0,
      free:      a.free ?? true,
      url:       a.url,
      store:     'google',
      rank:      i + 1,
    }));
    const volume     = computeVolume(term, suggestions, results);
    const difficulty = computeDifficulty(results);
    const chance     = Math.round(Math.min(Math.max(100 - difficulty + 5, 5), 95));
    const relatedKeywords = suggestions.map(s => ({
      keyword: s,
      ...suggestionMetrics(s, volume, difficulty),
    }));
    return NextResponse.json({ suggestions, relatedKeywords, results, volume, difficulty, chance, resultsCount: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
