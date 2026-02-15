/**
 * Format: YYYY-MM-DD
 */
export function todayString(): string {
  return formatDate(new Date());
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns [startDate, endDate] for the last 7 days including today.
 */
export function getLast7DaysRange(): [string, string] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return [formatDate(start), formatDate(today)];
}

/**
 * Returns array of YYYY-MM-DD strings for last 7 days.
 */
export function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

/**
 * YYYY-MM from YYYY-MM-DD
 */
export function getYearMonth(date: string): string {
  return date.substring(0, 7);
}

/**
 * Validate HH:MM format
 */
export function isValidTime(time: string): boolean {
  const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match !== null;
}

/**
 * Parse float, return null if empty or invalid.
 */
export function parseFloatOrNull(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

/**
 * Short day label from date string.
 */
export function shortDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
}
