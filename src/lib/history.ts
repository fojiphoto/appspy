// Generates deterministic simulated history based on appId seed
// Used for download/rank history graphs when no real DB exists

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export function generateDownloadHistory(
  appId: string,
  currentDailyDownloads: number,
  days = 90
): HistoryPoint[] {
  const rng = seededRandom(hashCode(appId + 'dl'));
  const points: HistoryPoint[] = [];
  const now = Date.now();

  // Simulate: app was smaller before, grew to current
  let val = currentDailyDownloads * (0.2 + rng() * 0.3);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const label = date.toISOString().split('T')[0];

    // Trend upward with noise
    const trend = (days - i) / days;
    const noise = 1 + (rng() - 0.5) * 0.3;
    val = val * (1 + trend * 0.015) * noise;

    // Occasional spike (feature / viral moment)
    if (rng() > 0.93) val *= 1.4 + rng() * 0.8;

    val = Math.max(10, Math.min(val, currentDailyDownloads * 3));
    points.push({ date: label, value: Math.round(val) });
  }

  // Last point = current estimate
  if (points.length > 0) {
    points[points.length - 1].value = currentDailyDownloads;
  }
  return points;
}

export function generateRankHistory(
  appId: string,
  currentRank: number,
  days = 90
): HistoryPoint[] {
  const rng = seededRandom(hashCode(appId + 'rk'));
  const points: HistoryPoint[] = [];
  const now = Date.now();

  // Start from worse rank, improve to current
  let rank = Math.min(500, currentRank * (3 + rng() * 4));

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const label = date.toISOString().split('T')[0];

    const trend = (days - i) / days;
    const noise = (rng() - 0.5) * 20;
    rank = rank - trend * 0.5 + noise;
    rank = Math.max(1, Math.round(rank));

    points.push({ date: label, value: rank });
  }

  if (points.length > 0) {
    points[points.length - 1].value = currentRank;
  }
  return points;
}

export function generateRatingHistory(
  appId: string,
  currentScore: number,
  days = 90
): HistoryPoint[] {
  const rng = seededRandom(hashCode(appId + 'rt'));
  const points: HistoryPoint[] = [];
  const now = Date.now();
  let score = Math.max(3.0, currentScore - 0.5);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const label = date.toISOString().split('T')[0];
    const noise = (rng() - 0.5) * 0.08;
    score = Math.min(5, Math.max(1, score + noise));
    points.push({ date: label, value: parseFloat(score.toFixed(2)) });
  }

  if (points.length > 0) {
    points[points.length - 1].value = currentScore;
  }
  return points;
}
