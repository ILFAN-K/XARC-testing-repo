/* ------------------------------------------------------------------ */
/*  Shared formatting utilities                                       */
/* ------------------------------------------------------------------ */

/** Format a number with locale-aware thousands separators. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Format a number as a percentage string, e.g. 96.8 → "96.8%". */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format a trend value with a sign prefix, e.g. 4 → "+4%", -2 → "-2%". */
export function formatTrend(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}%`;
}

/** Format hours with locale-aware separators, e.g. 1240 → "1,240h". */
export function formatHours(value: number): string {
  return `${formatNumber(value)}h`;
}
