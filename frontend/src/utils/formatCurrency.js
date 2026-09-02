/**
 * Formats a rupee amount into a compact Indian-style string:
 * thousands -> K, lakhs -> L, crores -> Cr. Used only by the landing
 * page's community-stats strip, where a precise value isn't needed —
 * just an honest, readable order of magnitude.
 *
 * Examples: 8500 -> "₹8.5K", 245000 -> "₹2.5L", 32000000 -> "₹3.2Cr"
 */
export function formatCompactINR(amount) {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);

  let formatted;
  if (abs >= 1e7) {
    formatted = `${trimTrailingZero(abs / 1e7)}Cr`;
  } else if (abs >= 1e5) {
    formatted = `${trimTrailingZero(abs / 1e5)}L`;
  } else if (abs >= 1e3) {
    formatted = `${trimTrailingZero(abs / 1e3)}K`;
  } else {
    formatted = Math.round(abs).toString();
  }

  return `₹${value < 0 ? '-' : ''}${formatted}`;
}

function trimTrailingZero(n) {
  // One decimal place, but drop it if it's a whole number (e.g. "3.0" -> "3").
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}
