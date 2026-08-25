/**
 * Formatting helpers.
 *
 * Every function here returns null for an absent input rather than a
 * substitute value, so callers can render an explicit absence marker. A
 * formatter that turns null into "0" or "—" would quietly manufacture data,
 * which is precisely what this product must not do.
 */

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** Indian-format integer/decimal, or null when there is no number. */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? INR.format(n) : null;
}

/**
 * Amounts in rupees, scaled to crore when large enough to warrant it.
 * Returns null for an absent or non-numeric amount.
 */
export function formatAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) >= 1e7) return `₹${INR.format(n / 1e7)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${INR.format(n / 1e5)} L`;
  return `₹${INR.format(n)}`;
}

/** Absolute timestamp, in the viewer's locale. */
export function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** "3 hours ago". Returns null when there is no usable timestamp. */
export function formatRelative(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  const table = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [2592000, 'day', 86400],
    [31536000, 'month', 2592000],
    [Infinity, 'year', 31536000],
  ];
  const abs = Math.abs(seconds);
  for (const [limit, unit, divisor] of table) {
    if (abs < limit) {
      const amount = Math.round(seconds / divisor);
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return rtf.format(-amount, unit);
    }
  }
  return null;
}

/** Shorten an opaque identifier for display without losing its start. */
export function shortId(value, length = 8) {
  if (!value) return null;
  const s = String(value);
  return s.length <= length ? s : `${s.slice(0, length)}…`;
}

/** Turn SNAKE_CASE into Sentence case for display of API vocabulary. */
export function humanize(value) {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
