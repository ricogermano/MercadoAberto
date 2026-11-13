// Medians of the indicators across a group of companies (a sector, or the whole table), and which side of the median a
// value sits on. A comparison aid for the quotes table, never a signal: the wording around it must stay descriptive.

// Fewer values than this say little about a sector: no median is shown
export const MIN_FOR_MEDIAN = 3;

export function median(values: (number | null | undefined)[]): number | null {
    const sorted = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
    if (sorted.length < MIN_FOR_MEDIAN) return null;
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mediansOf<K extends string>(rows: Partial<Record<K, number | null>>[], keys: readonly K[]): Record<K, number | null> {
    return Object.fromEntries(keys.map((key) => [key, median(rows.map((r) => r[key]))])) as Record<K, number | null>;
}

export type MedianSide = 'better' | 'worse' | null;

// Multiples and debt read better when lower; yields, returns, margins and growth when higher.
// Payout and liquidity have no better side, so they are never marked.
const LOWER_IS_BETTER = new Set(['pe', 'pb', 'evEbitda', 'netDebtEbitda']);
const HIGHER_IS_BETTER = new Set(['dy', 'roe', 'roce', 'netMargin', 'profitGrowth']);
// A negative multiple means a loss or negative equity, not a bargain (negative net debt, though, is net cash)
const NEGATIVE_IS_WORSE = new Set(['pe', 'pb', 'evEbitda']);

export function medianSide(key: string, value: number | null | undefined, med: number | null | undefined): MedianSide {
    if (value == null || !Number.isFinite(value)) return null;
    if (NEGATIVE_IS_WORSE.has(key) && value < 0) return 'worse';
    if (med == null || !Number.isFinite(med) || value === med) return null;
    if (LOWER_IS_BETTER.has(key)) return value < med ? 'better' : 'worse';
    if (HIGHER_IS_BETTER.has(key)) return value > med ? 'better' : 'worse';
    return null;
}
