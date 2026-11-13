import { describe, expect, it } from 'vitest';
import { median, medianSide } from '@/lib/medians';
import { dividendMedians, mediansFromTimeseries, yearlyDividendYieldsFromChart } from '@/lib/yahoo';

describe('median', () => {
    it('takes the middle value, or the mean of the two middle ones', () => {
        expect(median([9, 1, 5])).toBe(5);
        expect(median([8, 2, 4, 6])).toBe(5);
    });

    it('ignores missing and non-finite values', () => {
        expect(median([null, 3, undefined, 1, Number.NaN, 2, Infinity])).toBe(2);
    });

    it('gives nothing for fewer than three values', () => {
        expect(median([4, 6])).toBeNull();
        expect(median([null, null, 7])).toBeNull();
    });
});

describe('medianSide', () => {
    it('reads multiples and debt as better when lower', () => {
        expect(medianSide('pe', 5, 8)).toBe('better');
        expect(medianSide('pe', 12, 8)).toBe('worse');
        expect(medianSide('netDebtEbitda', -0.5, 1.2)).toBe('better');
    });

    it('reads yields, returns and growth as better when higher', () => {
        expect(medianSide('dy', 9, 6)).toBe('better');
        expect(medianSide('roe', 4, 12)).toBe('worse');
    });

    it('never calls a negative multiple better, even without a median', () => {
        expect(medianSide('pe', -3, 8)).toBe('worse');
        expect(medianSide('evEbitda', -1, null)).toBe('worse');
    });

    it('leaves payout, liquidity, ties and missing values unmarked', () => {
        expect(medianSide('payout', 90, 50)).toBeNull();
        expect(medianSide('liquidity', 1e9, 1e8)).toBeNull();
        expect(medianSide('roe', 12, 12)).toBeNull();
        expect(medianSide('roe', null, 12)).toBeNull();
        expect(medianSide('roe', 12, null)).toBeNull();
    });
});

describe('medians of a company from Yahoo', () => {
    const item = (asOfDate: string, raw: number, currencyCode = 'BRL') => ({ asOfDate, currencyCode, reportedValue: { raw } });
    const series = (type: string, items: unknown[]) => ({ meta: { type: [type] }, [type]: items });
    const years = ['2022-12-31', '2023-12-31', '2024-12-31', '2025-12-31'];
    const annual = (type: string, values: number[]) => series(type, values.map((v, i) => item(years[i], v)));
    const timeseries = {
        timeseries: {
            result: [
                annual('annualPeRatio', [4, 10, 8, 6]),
                annual('annualPbRatio', [1, 2, 2, 3]),
                annual('annualNetIncome', [10, 20, 30, 40]),
                annual('annualTotalRevenue', [100, 100, 100, 100]),
                annual('annualEBITDA', [50, 50, -5, 50]),
                annual('annualNetDebt', [50, 100, 100, 150]),
            ],
        },
    };

    it('takes the median of the fiscal years, each computed like today\'s figure', () => {
        const m = mediansFromTimeseries(timeseries);
        expect(m.pe).toBe(7);
        expect(m.pb).toBe(2);
        // ROE per year = P/B / P/E: 25, 20, 25, 50
        expect(m.roe).toBe(25);
        expect(m.netMargin).toBe(25);
        // The year with negative EBITDA is left out: 1, 2, 3
        expect(m.netDebtEbitda).toBe(2);
        expect(m.evEbitda).toBeNull();
        expect(m.roce).toBeNull();
    });

    const at = (iso: string) => Date.parse(iso) / 1000;
    const chart = {
        chart: {
            result: [{
                timestamp: [at('2021-06-01'), at('2022-06-01'), at('2022-12-26'), at('2023-12-25'), at('2024-12-30'), at('2025-12-29'), at('2026-11-09')],
                indicators: { quote: [{ close: [10, 12, 20, 25, 40, 50, 60] }] },
                events: {
                    dividends: {
                        a: { amount: 1, date: at('2022-03-01') },
                        b: { amount: 1, date: at('2022-09-01') },
                        c: { amount: 5, date: at('2023-05-01') },
                        d: { amount: 3, date: at('2025-05-01') },
                        e: { amount: 9, date: at('2026-05-01') },
                    },
                },
            }],
        },
    };

    it('gives the dividend yield of each complete year over its last close', () => {
        const yields = yearlyDividendYieldsFromChart(chart);
        // 2021 (first, cut short) and 2026 (current) are left out; 2024 paid nothing
        expect([...yields]).toEqual([[2022, 10], [2023, 20], [2024, 0], [2025, 6]]);
    });

    it('pairs each year\'s yield with that year\'s P/E for the payout median', () => {
        const m = dividendMedians(yearlyDividendYieldsFromChart(chart), timeseries);
        expect(m.dy).toBe(8);
        // Payout per year = yield x P/E: 40, 200, 0, 36
        expect(m.payout).toBe(38);
    });
});
