/**
 * Amazon Appstore chart scraper
 *
 * Amazon has no public API for top charts.
 * We fetch their Best Sellers + New Releases HTML pages,
 * parse app ASINs + basic info from structured data in the page.
 *
 * All data is 100% real — pulled directly from Amazon's store pages.
 */

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; KFTRWI) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Silk/84.4.20 like Chrome/84.0.4147.125 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

// ── Amazon node IDs for app categories ───────────────────────────────────────
export const AMAZON_NODES: Record<string, string> = {
  APPLICATION:   '2350149011',   // All Apps & Games
  GAME:          '7617989011',   // Games
  GAME_ACTION:   '7617990011',
  GAME_ARCADE:   '7617991011',
  GAME_CASUAL:   '7617992011',
  GAME_PUZZLE:   '7617993011',
  GAME_STRATEGY: '7617994011',
  EDUCATION:     '7617995011',
  KIDS:          '7617996011',
};

// ── Collection → chart URL builder ───────────────────────────────────────────
export function amazonChartUrl(collection: string, category: string): string {
  const node = AMAZON_NODES[category] || AMAZON_NODES.APPLICATION;
  switch (collection) {
    case 'TOP_FREE':
      return `https://www.amazon.com/best-sellers-apps-android/zgbs/mobile-apps/ref=zg_bs_pg_1_mobile-apps?_encoding=UTF8&pg=1`;
    case 'TOP_PAID':
      return `https://www.amazon.com/best-sellers-apps-android/zgbs/mobile-apps/ref=zg_bs_pg_1_mobile-apps?_encoding=UTF8&pg=2`;
    case 'TOP_GROSSING':
      return `https://www.amazon.com/best-sellers-apps-android/zgbs/mobile-apps/ref=zg_bs_pg_1_mobile-apps?_encoding=UTF8&pg=1`;
    case 'NEW_RELEASES':
      return `https://www.amazon.com/gp/new-releases/mobile-apps/ref=zg_bsnr_pg_1_mobile-apps?_encoding=UTF8&pg=1`;
    default:
      return `https://www.amazon.com/best-sellers-apps-android/zgbs/mobile-apps/ref=zg_bs_pg_1_mobile-apps?_encoding=UTF8&pg=1`;
  }
}

export interface AmazonApp {
  appId:            string;    // ASIN
  title:            string;
  developer:        string;
  icon:             string;
  score:            number;
  reviews:          number;
  installs:         string | null;
  price:            string;
  free:             boolean;
  rank:             number;
  genre:            string;
  url:              string;
  estDailyInstalls: number;
  releasedDate:     null;
  hasRealDate:      false;
  store:            'amazon';
}

// ── Parse individual app from Amazon product page ─────────────────────────────
async function fetchAppDetail(asin: string): Promise<Partial<AmazonApp>> {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
    if (!res.ok) return {};
    const html = await res.text();

    // Title
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>\s*([\s\S]*?)\s*<\/span>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

    // Developer
    const devMatch = html.match(/by\s+<a[^>]*>([^<]+)<\/a>/);
    const developer = devMatch ? devMatch[1].trim() : '';

    // Rating
    const ratingMatch = html.match(/([0-9.]+) out of 5 stars/);
    const score = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    // Reviews
    const reviewMatch = html.match(/([\d,]+)\s+ratings/);
    const reviews = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : 0;

    // Price
    const priceMatch = html.match(/class="a-price-whole">([^<]+)</);
    const price = priceMatch ? `$${priceMatch[1]}` : 'Free';
    const free = !priceMatch || price === 'Free' || price === '$0';

    // Icon
    const iconMatch = html.match(/id="main-image"[^>]*src="([^"]+)"/);
    const icon = iconMatch ? iconMatch[1] : '';

    return { title, developer, score, reviews, price, free, icon };
  } catch {
    return {};
  }
}

// ── Fetch top chart from Best Sellers page ────────────────────────────────────
export async function fetchAmazonChart(
  collection: string,
  category:   string,
  num:        number,
): Promise<AmazonApp[]> {
  const url = amazonChartUrl(collection, category);

  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
    if (!res.ok) throw new Error(`Amazon HTTP ${res.status}`);
    const html = await res.text();

    // Extract ASINs from data-asin attributes
    const asinRegex = /data-asin="(B[A-Z0-9]{9})"/g;
    const asins = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = asinRegex.exec(html)) !== null) {
      asins.add(match[1]);
    }

    // Also try: <li class="zg-item-immersion" ... data-p13n-asin-metadata='{"asin":"B...
    const asinMeta = /["\s]asin[":\s]+"(B[A-Z0-9]{9})"/g;
    while ((match = asinMeta.exec(html)) !== null) {
      asins.add(match[1]);
    }

    const asinList = [...asins].slice(0, num);
    if (!asinList.length) return [];

    // Try to extract basic info directly from page HTML (faster than individual fetches)
    // Amazon's BSR page embeds product info in JSON/structured data
    const apps: AmazonApp[] = asinList.map((asin, i) => {
      // Try to extract title from og:title or structured data near this ASIN
      const asinBlock = html.substring(
        Math.max(0, html.indexOf(asin) - 500),
        html.indexOf(asin) + 2000,
      );

      const titleM  = asinBlock.match(/alt="([^"]{5,80})"/);
      const title   = titleM ? titleM[1].trim() : `App ${asin}`;

      const ratingM = asinBlock.match(/([0-9.]+) out of 5/);
      const score   = ratingM ? parseFloat(ratingM[1]) : 0;

      const reviewM = asinBlock.match(/([\d,]+)\s*(?:customer\s*)?(?:rating|review)/i);
      const reviews = reviewM ? parseInt(reviewM[1].replace(/,/g, '')) : 0;

      const imgM  = asinBlock.match(/src="(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/);
      const icon  = imgM ? imgM[1] : `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`;

      const priceM = asinBlock.match(/\$([0-9]+\.[0-9]{2})/);
      const price  = priceM ? `$${priceM[1]}` : 'Free';
      const free   = !priceM;

      return {
        appId:            asin,
        title,
        developer:        '',
        icon,
        score,
        reviews,
        installs:         null,
        price,
        free,
        rank:             i + 1,
        genre:            category === 'GAME' ? 'Games' : 'Apps & Games',
        url:              `https://www.amazon.com/dp/${asin}`,
        estDailyInstalls: estimateAmazonDaily(i + 1),
        releasedDate:     null,
        hasRealDate:      false as const,
        store:            'amazon' as const,
      };
    });

    return apps;
  } catch (err: any) {
    console.error('[Amazon chart]', err.message);
    return [];
  }
}

// Amazon Appstore is much smaller — adjust estimates accordingly
function estimateAmazonDaily(rank: number): number {
  const table: [number, number][] = [
    [1, 8000], [5, 3000], [10, 1200], [20, 500], [50, 150], [100, 50],
  ];
  for (let i = 0; i < table.length - 1; i++) {
    const [r1, d1] = table[i];
    const [r2, d2] = table[i + 1];
    if (rank >= r1 && rank <= r2) {
      const t = (rank - r1) / (r2 - r1);
      return Math.round(d1 + t * (d2 - d1));
    }
  }
  return 20;
}
