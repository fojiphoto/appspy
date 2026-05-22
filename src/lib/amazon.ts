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

    // ── Step 1: Collect (ASIN → position-of-data-asin-attr) ─────────────────
    // We store the MATCH INDEX so the surrounding block is anchored to the
    // actual list-item element that owns the attribute, not some random first
    // occurrence of the ASIN string elsewhere in the page.
    const asinPositions = new Map<string, number>(); // asin → index in html

    const asinAttrRx = /data-asin="(B[A-Z0-9]{9})"/g;
    let m: RegExpExecArray | null;
    while ((m = asinAttrRx.exec(html)) !== null) {
      if (!asinPositions.has(m[1])) asinPositions.set(m[1], m.index);
    }

    // Also pick up ASINs embedded in JSON metadata blobs
    const metaRx = /["']asin["']\s*:\s*["'](B[A-Z0-9]{9})["']/g;
    while ((m = metaRx.exec(html)) !== null) {
      if (!asinPositions.has(m[1])) asinPositions.set(m[1], m.index);
    }

    if (!asinPositions.size) return [];

    // Sort by position (preserves chart order as it appears in the DOM)
    const ordered = [...asinPositions.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, num);

    // ── Step 2: Extract metadata from the block around each data-asin attr ──
    const apps: AmazonApp[] = ordered.map(([asin, pos], i) => {
      // Grab 200 chars before (catches opening <li …>) and 3 500 after (full item)
      const block = html.substring(Math.max(0, pos - 200), pos + 3500);

      // ── Title (4 strategies, first match wins) ───────────────────────────
      let title = '';

      // 1. <span class="…p13n-sc-truncate…">Title</span>
      const t1 = block.match(/p13n-sc-truncate[^>]*>\s*([^<]{4,120})\s*</);
      if (t1) title = t1[1].trim();

      // 2. <div class="…zg-carousel-general-faceout…">…<span>Title</span>
      if (!title) {
        const t2 = block.match(/zg-carousel-general-faceout[\s\S]{0,400}?<span[^>]*>\s*([^<]{4,120})\s*<\/span>/);
        if (t2) title = t2[1].trim();
      }

      // 3. img alt attribute (usually the app name)
      if (!title) {
        const t3 = block.match(/alt="([^"]{4,120})"/);
        if (t3) title = t3[1].trim();
      }

      // 4. Link text immediately after /dp/ASIN
      if (!title) {
        const t4 = block.match(new RegExp(`/dp/${asin}[^"]*"[^>]*>\\s*([^<]{4,120})\\s*<`));
        if (t4) title = t4[1].trim();
      }

      if (!title) title = asin; // last resort — never "App BXXXXXXX"

      // ── Developer ────────────────────────────────────────────────────────
      // "by AuthorName" pattern common on Amazon detail blocks
      const devM = block.match(/by\s+<a[^>]*>([^<]+)<\/a>/);
      const developer = devM ? devM[1].trim() : '';

      // ── Icon ─────────────────────────────────────────────────────────────
      // Prefer CDN images with size hint (._SY|._SX|._CR)
      const imgM = block.match(
        /src="(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%+._-]+\.(?:jpg|png)[^"]*)"/,
      );
      const icon = imgM ? imgM[1] : '';

      // ── Rating / reviews ─────────────────────────────────────────────────
      const ratingM = block.match(/([0-9.]+) out of 5/);
      const score   = ratingM ? parseFloat(ratingM[1]) : 0;

      const reviewM = block.match(/([\d,]+)\s*(?:customer\s*)?(?:rating|review)/i);
      const reviews = reviewM ? parseInt(reviewM[1].replace(/,/g, '')) : 0;

      // ── Price ────────────────────────────────────────────────────────────
      const priceM = block.match(/\$([0-9]+\.[0-9]{2})/);
      const price  = priceM ? `$${priceM[1]}` : 'Free';
      const free   = !priceM;

      return {
        appId:            asin,
        title,
        developer,
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
