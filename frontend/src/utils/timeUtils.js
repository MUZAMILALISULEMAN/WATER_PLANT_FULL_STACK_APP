// ── Karachi timezone utils ─────────────────────────────────────────────────

const TZ = 'Asia/Karachi';

export function toKarachi(utcString) {
  if (!utcString) return '—';

  const isoUtcString = utcString.replace(' ', 'T') + 'Z';

  return new Date(isoUtcString).toLocaleString('en-US', {
    timeZone: TZ,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Date only — e.g. "27 March 2026"
 */
export function toKarachiDate(utcString) {
  if (!utcString) return '—';
  return new Date(utcString).toLocaleDateString('en-PK', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Helper to get a stable "YYYY-MM-DD" string for Karachi time
 * 'en-CA' (English Canada) is a standard trick to get YYYY-MM-DD.
 */
const toISODate = (date) => date.toLocaleDateString('en-CA', { timeZone: TZ });

// Today as YYYY-MM-DD
export function todayKarachi() {
  return toISODate(new Date());
}

// Yesterday as YYYY-MM-DD
export function yesterdayKarachi() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

// Start of current week (Monday) as YYYY-MM-DD
export function weekStartKarachi() {
  // We get the current date in Karachi to find the correct "Day of week"
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const day = now.getDay(); 
  const diff = (day === 0 ? -6 : 1 - day); // Adjust to Monday
  now.setDate(now.getDate() + diff);
  return toISODate(now);
}

// Start of current month as YYYY-MM-DD
export function monthStartKarachi() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}