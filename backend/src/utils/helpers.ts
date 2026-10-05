import crypto from 'crypto';

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const generateBrowserFingerprint = (req: any): string => {
  const data = `${req.headers['user-agent'] || ''}-${req.headers['accept-language'] || ''}-${req.ip}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// ============================================================
// SEMESTER WEEK HELPERS (Mon–Sun weeks)
// ============================================================

/**
 * Build week buckets from semester start to end, Monday–Sunday.
 * First partial week (e.g. semester starts Thursday) is Wk1, ending Sunday.
 * Returns [{ label, start, end }].
 */
export function getSemesterWeekBuckets(
  startDate: Date,
  endDate: Date,
): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  if (!startDate || !endDate) return buckets;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // First week starts at semester start date, ends Sunday of that week
  const weekStart = new Date(start);
  weekStart.setHours(0, 0, 0, 0);

  const firstSunday = new Date(weekStart);
  const day = firstSunday.getDay(); // 0=Sun
  const daysToSunday = day === 0 ? 0 : 7 - day;
  firstSunday.setDate(firstSunday.getDate() + daysToSunday);
  firstSunday.setHours(23, 59, 59, 999);

  let i = 1;
  let cursor = weekStart;
  let cursorEnd = firstSunday;

  while (cursor <= end) {
    buckets.push({
      label: `Wk${i}`,
      start: new Date(cursor),
      end: new Date(cursorEnd),
    });

    const nextMonday = new Date(cursorEnd);
    nextMonday.setDate(nextMonday.getDate() + 1);
    nextMonday.setHours(0, 0, 0, 0);

    cursor = nextMonday;
    cursorEnd = new Date(cursor);
    cursorEnd.setDate(cursorEnd.getDate() + 6);
    cursorEnd.setHours(23, 59, 59, 999);

    i++;
    if (i > 60) break; // safety cap
  }

  return buckets;
}