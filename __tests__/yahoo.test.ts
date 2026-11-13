import { describe, expect, it } from 'vitest';
import { EMPTY_FUNDAMENTALS, averageTurnoverFromChart, payoutFrom, compareNullable, fundamentalsYahooSymbol, dividendYieldFromChart, rankByCriteria, dailyQuoteFromChart, fundamentalsFromTimeseries, normalizeYahooSymbol, yahooAppSymbol, yahooCurrency } from '@/lib/yahoo';
import { formatSymbolForTradingView, isChartEmbeddable } from '@/lib/utils';

describe('Tadawul symbols', () => {
    it('maps app and TradingView symbols to Yahoo', () => {
        expect(normalizeYahooSymbol('2222.SR')).toBe('2222.SR');
        expect(normalizeYahooSymbol('tadawul:2222')).toBe('2222.SR');
        expect(normalizeYahooSymbol('TADAWUL:TASI')).toBe('^TASI.SR');
        // Bare numbers stay ambiguous: 7203 is Toyota in Tokyo
        expect(normalizeYahooSymbol('7203')).toBeNull();
        expect(normalizeYahooSymbol('AAPL')).toBeNull();
        expect(yahooAppSymbol('TADAWUL:1120')).toBe('1120.SR');
        expect(yahooAppSymbol('TADAWUL:TASI')).toBeNull();
    });

    it('charts .SR on TradingView as TADAWUL, without the embed it blocks', () => {
        expect(formatSymbolForTradingView('2222.SR')).toBe('TADAWUL:2222');
        expect(isChartEmbeddable('TADAWUL:2222')).toBe(false);
    });
});

describe('B3 (Brazil) symbols', () => {
    it('maps app and TradingView symbols to Yahoo', () => {
        expect(normalizeYahooSymbol('PETR4.SA')).toBe('PETR4.SA');
        expect(normalizeYahooSymbol('bmfbovespa:petr4')).toBe('PETR4.SA');
        expect(normalizeYahooSymbol('BMFBOVESPA:BPAC11')).toBe('BPAC11.SA');
        expect(normalizeYahooSymbol('BMFBOVESPA:B3SA3')).toBe('B3SA3.SA');
        expect(normalizeYahooSymbol('BMFBOVESPA:IBOV')).toBe('^BVSP');
        expect(normalizeYahooSymbol('BMFBOVESPA:IFIX')).toBe('IFIX.SA');
        expect(yahooAppSymbol('BMFBOVESPA:VALE3')).toBe('VALE3.SA');
        expect(yahooAppSymbol('BMFBOVESPA:IBOV')).toBeNull();
        expect(yahooAppSymbol('IFIX.SA')).toBeNull();
        // A bare ticker stays ambiguous, and .SA is not a suffix of .USA-style names
        expect(normalizeYahooSymbol('PETR4')).toBeNull();
    });

    it('charts .SA on TradingView as BMFBOVESPA, in reais', () => {
        expect(formatSymbolForTradingView('PETR4.SA')).toBe('BMFBOVESPA:PETR4');
        expect(isChartEmbeddable('BMFBOVESPA:PETR4')).toBe(true);
        expect(yahooCurrency('PETR4.SA')).toBe('BRL');
    });
});

describe('Commodity futures', () => {
    it('maps the CMD prefix to Yahoo futures, with no stock page', () => {
        expect(normalizeYahooSymbol('CMD:GC')).toBe('GC=F');
        expect(normalizeYahooSymbol('cmd:ali')).toBe('ALI=F');
        expect(normalizeYahooSymbol('CMD:')).toBeNull();
        expect(normalizeYahooSymbol('CMD:GOLD1')).toBeNull();
        expect(normalizeYahooSymbol('GC=F')).toBeNull();
        expect(yahooAppSymbol('CMD:GC')).toBeNull();
        expect(fundamentalsYahooSymbol('CMD:GC')).toBeNull();
    });
});

describe('Warsaw (GPW) symbols', () => {
    it('maps app and TradingView symbols to Yahoo', () => {
        expect(normalizeYahooSymbol('PKN.WA')).toBe('PKN.WA');
        expect(normalizeYahooSymbol('gpw:pkn')).toBe('PKN.WA');
        expect(normalizeYahooSymbol('GPW:WIG20')).toBe('WIG20.WA');
        expect(normalizeYahooSymbol('GPW:MWIG40')).toBe('MWIG40.WA');
        expect(normalizeYahooSymbol('WIG20.WA')).toBe('WIG20.WA');
        expect(normalizeYahooSymbol('XETR:SAP')).toBeNull();
        expect(yahooAppSymbol('GPW:CDR')).toBe('CDR.WA');
        expect(yahooAppSymbol('GPW:WIG20')).toBeNull();
        expect(yahooAppSymbol('WIG.WA')).toBeNull();
    });

    it('charts .WA on TradingView as GPW, which embeds allow', () => {
        expect(formatSymbolForTradingView('PKN.WA')).toBe('GPW:PKN');
        expect(isChartEmbeddable('GPW:PKN')).toBe(true);
    });
});

describe('dailyQuoteFromChart', () => {
    const chart = (close: (number | null)[]) => ({ chart: { result: [{ meta: { currency: 'SAR', shortName: 'Saudi Arabian Oil Co.' }, indicators: { quote: [{ close }] } }] } });

    it('compares the last two closes, skipping gaps', () => {
        const q = dailyQuoteFromChart(chart([25, 26, null, 26.52]))!;
        expect(q.price).toBe(26.52);
        expect(q.change).toBeCloseTo(0.52);
        expect(q.changePercent).toBeCloseTo(2);
        expect(q).toMatchObject({ currency: 'SAR', name: 'Saudi Arabian Oil Co.' });
    });

    it('prefers the long name (GPW short names look like "PKN C.XWAR PLN")', () => {
        const json = { chart: { result: [{ meta: { currency: 'PLN', shortName: 'PKN C.XWAR PLN', longName: 'Orlen S.A.' }, indicators: { quote: [{ close: [147, 146.38] }] } }] } };
        expect(dailyQuoteFromChart(json)).toMatchObject({ currency: 'PLN', name: 'Orlen S.A.' });
    });

    it("prefers Yahoo's own day change (TASI sends a single daily bar)", () => {
        const json = { chart: { result: [{ meta: { regularMarketPrice: 9921.5, fulldayChange: -101.97, regularMarketChangePercent: -1.017 }, indicators: { quote: [{ close: [9921.5] }] } }] } };
        expect(dailyQuoteFromChart(json)).toMatchObject({ price: 9921.5, change: -101.97, changePercent: -1.017 });
    });

    it("falls back to the exchange's currency when Yahoo omits it", () => {
        expect(yahooCurrency('PKN.WA')).toBe('PLN');
        expect(yahooCurrency('^TASI.SR')).toBe('SAR');
        expect(yahooCurrency('AAPL')).toBe('USD');
        const noCurrency = { chart: { result: [{ meta: {}, indicators: { quote: [{ close: [10, 11] }] } }] } };
        expect(dailyQuoteFromChart(noCurrency, yahooCurrency('2222.SR'))?.currency).toBe('SAR');
        expect(dailyQuoteFromChart(noCurrency)?.currency).toBe('USD');
    });

    it('returns null when Yahoo has nothing', () => {
        expect(dailyQuoteFromChart({ chart: { result: null } })).toBeNull();
        expect(dailyQuoteFromChart(chart([null]))).toBeNull();
    });
});

const series = (type: string, items: unknown) => ({ meta: { symbol: ['X.SA'], type: [type] }, [type]: items });
const point = (asOfDate: string, raw: number) => ({ asOfDate, periodType: 'TTM', reportedValue: { raw, fmt: String(raw) } });

describe('fundamentalsFromTimeseries', () => {
    it('picks the latest asOfDate even when the array is out of order', () => {
        const json = { timeseries: { result: [
            series('trailingPbRatio', [point('2026-11-11', 1.08), point('2025-10-03', 1.02), point('2026-05-01', 1.5)]),
            series('trailingPeRatio', [point('2026-11-11', 3.9)]),
        ] } };
        const f = fundamentalsFromTimeseries(json);
        expect(f?.pb).toBe(1.08);
        expect(f?.pe).toBe(3.9);
    });

    it('computes roe as P/B over P/E in percent', () => {
        const json = { timeseries: { result: [series('trailingPbRatio', [point('2026-01-01', 2)]), series('trailingPeRatio', [point('2026-01-01', 10)])] } };
        expect(fundamentalsFromTimeseries(json)?.roe).toBeCloseTo(20);
    });

    it('leaves roe null for a negative or missing P/E but keeps P/B', () => {
        const neg = { timeseries: { result: [series('trailingPbRatio', [point('2026-01-01', 2)]), series('trailingPeRatio', [point('2026-01-01', -5)])] } };
        expect(fundamentalsFromTimeseries(neg)).toEqual({ ...EMPTY_FUNDAMENTALS, pe: -5, pb: 2 });
        const missing = { timeseries: { result: [series('trailingPbRatio', [point('2026-01-01', 2)])] } };
        expect(fundamentalsFromTimeseries(missing)).toEqual({ ...EMPTY_FUNDAMENTALS, pb: 2 });
    });

    it('returns null without throwing for empty entries, null items and garbage', () => {
        expect(fundamentalsFromTimeseries({ timeseries: { result: [{ meta: { type: ['trailingPeRatio'] } }] } })).toBeNull();
        expect(fundamentalsFromTimeseries({ timeseries: { result: [series('trailingPeRatio', [null, { asOfDate: '2026-01-01' }])] } })).toBeNull();
        expect(fundamentalsFromTimeseries(null)).toBeNull();
        expect(fundamentalsFromTimeseries('nope')).toBeNull();
        expect(fundamentalsFromTimeseries({})).toBeNull();
    });
});

describe('compareNullable', () => {
    const sortWith = (vals: (number | string | null)[], dir: 'asc' | 'desc') => [...vals].sort((a, b) => compareNullable(a, b, dir));

    it('sorts numbers and keeps nulls last in both directions', () => {
        expect(sortWith([2, null, 5, 1], 'desc')).toEqual([5, 2, 1, null]);
        expect(sortWith([2, null, 5, 1], 'asc')).toEqual([1, 2, 5, null]);
    });

    it('sorts strings with localeCompare', () => {
        expect(sortWith(['Vale', 'Ambev', 'Itaú'], 'asc')).toEqual(['Ambev', 'Itaú', 'Vale']);
        expect(sortWith(['Vale', 'Ambev', 'Itaú'], 'desc')).toEqual(['Vale', 'Itaú', 'Ambev']);
    });
});

describe('fundamentalsFromTimeseries ROCE', () => {
    const item = (asOfDate: string, raw: number, currencyCode = 'BRL') => ({ asOfDate, currencyCode, reportedValue: { raw } });
    const build = (parts: Record<string, unknown[]>) => ({ timeseries: { result: Object.entries(parts).map(([type, items]) => series(type, items)) } });

    it('uses the trailing EBIT with a same-date, same-currency balance sheet', () => {
        const json = build({
            trailingEBIT: [item('2026-09-30', 8.35e9)],
            quarterlyTotalAssets: [item('2026-09-30', 45.64e9)],
            quarterlyCurrentLiabilities: [item('2026-09-30', 18.46e9)],
        });
        expect(fundamentalsFromTimeseries(json)?.roce).toBeCloseTo(30.72, 1);
    });

    it('falls back to annual figures when the balance sheet date or currency differs', () => {
        const annual = { annualEBIT: [item('2025-12-31', 10)], annualTotalAssets: [item('2025-12-31', 100)], annualCurrentLiabilities: [item('2025-12-31', 50)] };
        const otherDate = build({ trailingEBIT: [item('2026-09-30', 99)], quarterlyTotalAssets: [item('2026-06-30', 200)], quarterlyCurrentLiabilities: [item('2026-06-30', 100)], ...annual });
        expect(fundamentalsFromTimeseries(otherDate)?.roce).toBeCloseTo(20);
        const otherCurrency = build({ trailingEBIT: [item('2026-09-30', 99)], quarterlyTotalAssets: [item('2026-09-30', 200, 'USD')], quarterlyCurrentLiabilities: [item('2026-09-30', 100, 'USD')], ...annual });
        expect(fundamentalsFromTimeseries(otherCurrency)?.roce).toBeCloseTo(20);
    });

    it('gives null roce without current liabilities, keeping pe and pb', () => {
        const json = build({
            trailingPeRatio: [point('2026-11-11', 8)],
            trailingPbRatio: [point('2026-11-11', 1.6)],
            trailingEBIT: [item('2026-09-30', 5)],
            quarterlyTotalAssets: [item('2026-09-30', 100)],
        });
        expect(fundamentalsFromTimeseries(json)).toEqual({ ...EMPTY_FUNDAMENTALS, pe: 8, pb: 1.6, roe: 20 });
    });

    it('gives null roce when capital employed is zero or negative, and keeps a negative EBIT', () => {
        const base = { trailingEBIT: [item('2026-09-30', 5)], quarterlyTotalAssets: [item('2026-09-30', 100)] };
        expect(fundamentalsFromTimeseries(build({ ...base, quarterlyCurrentLiabilities: [item('2026-09-30', 120)] }))).toBeNull();
        const loss = build({ trailingEBIT: [item('2026-09-30', -10)], quarterlyTotalAssets: [item('2026-09-30', 100)], quarterlyCurrentLiabilities: [item('2026-09-30', 50)] });
        expect(fundamentalsFromTimeseries(loss)?.roce).toBeCloseTo(-20);
    });
});

describe('rankByCriteria', () => {
    type R = { id: string; a: number | null; b: number | null };
    const ids = (out: { row: R }[]) => out.map((o) => o.row.id);

    it('adds ranks, so a company that is never first can win', () => {
        const rows: R[] = [{ id: 'x', a: 1, b: 5 }, { id: 'y', a: 2, b: 2 }, { id: 'z', a: 3, b: 1 }, { id: 'w', a: 4, b: 3 }];
        // a asc ranks: x1 y2 z3 w4; b asc ranks: z1 y2 w3 x4 -> totals x5 y4 z4 w7
        const out = rankByCriteria(rows, [{ key: 'a', dir: 'asc' }, { key: 'b', dir: 'asc' }]);
        expect(ids(out)[0]).toBe('y');
        expect(out.map((o) => o.position)).toEqual([1, 2, 3, 4]);
    });

    it('breaks a tie in total by the first criterion', () => {
        const rows: R[] = [{ id: 'x', a: 1, b: 2 }, { id: 'y', a: 2, b: 1 }];
        expect(ids(rankByCriteria(rows, [{ key: 'a', dir: 'asc' }, { key: 'b', dir: 'asc' }]))).toEqual(['x', 'y']);
        expect(ids(rankByCriteria(rows, [{ key: 'b', dir: 'asc' }, { key: 'a', dir: 'asc' }]))).toEqual(['y', 'x']);
    });

    it('uses competition ranking on equal values (1, 1, 3)', () => {
        const rows: R[] = [{ id: 'x', a: 5, b: 3 }, { id: 'y', a: 5, b: 1 }, { id: 'z', a: 9, b: 1 }];
        // a desc: z1 x2 y2? no: z1, x and y share 2; b asc: y and z share 1, x3 -> totals x5 y3 z2
        expect(ids(rankByCriteria(rows, [{ key: 'a', dir: 'desc' }, { key: 'b', dir: 'asc' }]))).toEqual(['z', 'y', 'x']);
        const tied: R[] = [{ id: 'x', a: 1, b: 0 }, { id: 'y', a: 1, b: 0 }, { id: 'z', a: 2, b: 0 }, { id: 'w', a: 2, b: 0 }];
        // a asc ranks 1,1,3,3 and b all 1 -> x,y totals 2; z,w totals 4
        expect(ids(rankByCriteria(tied, [{ key: 'a', dir: 'asc' }, { key: 'b', dir: 'asc' }]))).toEqual(['x', 'y', 'z', 'w']);
    });

    it('puts incomplete rows last with no position', () => {
        const rows: R[] = [{ id: 'x', a: 1, b: null }, { id: 'y', a: 9, b: 9 }, { id: 'z', a: 5, b: 5 }];
        const out = rankByCriteria(rows, [{ key: 'a', dir: 'asc' }, { key: 'b', dir: 'asc' }]);
        expect(ids(out)).toEqual(['z', 'y', 'x']);
        expect(out.map((o) => o.position)).toEqual([1, 2, null]);
    });

    it('honours asc and desc per criterion', () => {
        const rows: R[] = [{ id: 'x', a: 1, b: 1 }, { id: 'y', a: 2, b: 2 }];
        expect(ids(rankByCriteria(rows, [{ key: 'a', dir: 'asc' }, { key: 'b', dir: 'desc' }]))).toEqual(['x', 'y']);
        expect(ids(rankByCriteria(rows, [{ key: 'a', dir: 'desc' }, { key: 'b', dir: 'desc' }]))).toEqual(['y', 'x']);
    });

    it('matches the plain sort with a single criterion', () => {
        const rows: R[] = [{ id: 'x', a: 2, b: 0 }, { id: 'y', a: null, b: 0 }, { id: 'z', a: 7, b: 0 }, { id: 'w', a: 1, b: 0 }];
        for (const dir of ['asc', 'desc'] as const) {
            const plain = [...rows].sort((p, q) => compareNullable(p.a, q.a, dir)).map((r) => r.id);
            expect(ids(rankByCriteria(rows, [{ key: 'a', dir }]))).toEqual(plain);
        }
    });
});

describe('dividendYieldFromChart', () => {
    const chart = (price: unknown, dividends?: unknown) => ({ chart: { result: [{ meta: { regularMarketPrice: price }, ...(dividends ? { events: { dividends } } : {}) }] } });

    it('sums the payments over the current price', () => {
        const divs = { 1: { amount: 1, date: 1 }, 2: { amount: 1.5, date: 2 }, 3: { amount: 0.5, date: 3 } };
        expect(dividendYieldFromChart(chart(50, divs))).toBeCloseTo(6);
    });

    it('is 0 for a valid chart without dividends', () => {
        expect(dividendYieldFromChart(chart(10))).toBe(0);
    });

    it('is null without a usable price', () => {
        expect(dividendYieldFromChart(chart(0, { 1: { amount: 1 } }))).toBeNull();
        expect(dividendYieldFromChart(chart(undefined, { 1: { amount: 1 } }))).toBeNull();
        expect(dividendYieldFromChart(chart(-3))).toBeNull();
    });

    it('is null for garbage', () => {
        expect(dividendYieldFromChart(null)).toBeNull();
        expect(dividendYieldFromChart('x')).toBeNull();
        expect(dividendYieldFromChart({ chart: { result: [] } })).toBeNull();
    });

    it('ignores non-finite, negative and null amounts', () => {
        const divs = { 1: { amount: 2 }, 2: { amount: Number.NaN }, 3: { amount: -1 }, 4: null, 5: { amount: 'x' } };
        expect(dividendYieldFromChart(chart(100, divs))).toBeCloseTo(2);
    });
});

describe('fundamentalsYahooSymbol', () => {
    it('keeps Yahoo-priced listings and maps US tickers', () => {
        expect(fundamentalsYahooSymbol('BMFBOVESPA:PETR4')).toBe('PETR4.SA');
        expect(fundamentalsYahooSymbol('2222.SR')).toBe('2222.SR');
        expect(fundamentalsYahooSymbol('AAPL')).toBe('AAPL');
        expect(fundamentalsYahooSymbol('brk.b')).toBe('BRK-B');
    });

    it('has none for indices, crypto, forex and other exchanges', () => {
        expect(fundamentalsYahooSymbol('BMFBOVESPA:IBOV')).toBeNull();
        expect(fundamentalsYahooSymbol('BINANCE:BTCUSDT')).toBeNull();
        expect(fundamentalsYahooSymbol('FX:EURUSD')).toBeNull();
        expect(fundamentalsYahooSymbol('RELIANCE.NS')).toBeNull();
        expect(fundamentalsYahooSymbol('')).toBeNull();
    });
});

describe('new table indicators', () => {
    const item = (asOfDate: string, raw: number, currencyCode = 'BRL') => ({ asOfDate, currencyCode, reportedValue: { raw } });
    const build = (parts: Record<string, unknown[]>) => ({ timeseries: { result: Object.entries(parts).map(([type, items]) => series(type, items)) } });

    it('reads EV/EBITDA and computes the net margin from same-period figures', () => {
        const f = fundamentalsFromTimeseries(build({
            trailingEnterprisesValueEBITDARatio: [point('2026-11-11', 3.06), point('2025-10-03', 3.7)],
            trailingNetIncome: [item('2026-06-30', 25), item('2025-06-30', 10)],
            trailingTotalRevenue: [item('2026-06-30', 100), item('2025-06-30', 80)],
        }));
        expect(f?.evEbitda).toBe(3.06);
        expect(f?.netMargin).toBeCloseTo(25);
    });

    it('falls back to the fiscal year for the net margin when the trailing revenue is in another currency', () => {
        const f = fundamentalsFromTimeseries(build({
            trailingNetIncome: [item('2026-06-30', 25)],
            trailingTotalRevenue: [item('2026-06-30', 100, 'USD')],
            annualNetIncome: [item('2025-12-31', 10)],
            annualTotalRevenue: [item('2025-12-31', 50)],
        }));
        expect(f?.netMargin).toBeCloseTo(20);
    });

    it('divides net debt by trailing EBITDA, and derives net debt from debt minus cash when Yahoo omits it', () => {
        const reported = build({ trailingEBITDA: [item('2026-06-30', 50)], quarterlyNetDebt: [item('2026-06-30', 20), item('2026-03-31', 99)] });
        expect(fundamentalsFromTimeseries(reported)?.netDebtEbitda).toBeCloseTo(0.4);
        const netCash = build({
            trailingEBITDA: [item('2026-09-30', 10)],
            quarterlyTotalDebt: [item('2026-09-30', 4)],
            quarterlyCashCashEquivalentsAndShortTermInvestments: [item('2026-09-30', 6)],
        });
        expect(fundamentalsFromTimeseries(netCash)?.netDebtEbitda).toBeCloseTo(-0.2);
    });

    it('gives no net debt / EBITDA without EBITDA (banks) or with a negative one', () => {
        expect(fundamentalsFromTimeseries(build({ trailingPeRatio: [point('2026-11-11', 9)], quarterlyNetDebt: [item('2026-09-30', 20)] }))?.netDebtEbitda).toBeNull();
        expect(fundamentalsFromTimeseries(build({ trailingPeRatio: [point('2026-11-11', 9)], trailingEBITDA: [item('2026-09-30', -5)], quarterlyNetDebt: [item('2026-09-30', 20)] }))?.netDebtEbitda).toBeNull();
    });

    it('annualises profit growth between the oldest and latest fiscal year of the same currency', () => {
        const f = fundamentalsFromTimeseries(build({ annualNetIncome: [item('2025-12-31', 800), item('2022-12-31', 100), item('2021-12-31', 1, 'USD'), item('2023-12-31', 300)] }));
        expect(f?.profitGrowth).toBeCloseTo(100, 0);
    });

    it('gives no profit growth from or to a loss, or with under two years of history', () => {
        const pe = { trailingPeRatio: [point('2026-11-11', 9)] };
        expect(fundamentalsFromTimeseries(build({ ...pe, annualNetIncome: [item('2022-12-31', -5), item('2025-12-31', 10)] }))?.profitGrowth).toBeNull();
        expect(fundamentalsFromTimeseries(build({ ...pe, annualNetIncome: [item('2022-12-31', 5), item('2025-12-31', -10)] }))?.profitGrowth).toBeNull();
        expect(fundamentalsFromTimeseries(build({ ...pe, annualNetIncome: [item('2024-12-31', 5), item('2025-12-31', 10)] }))?.profitGrowth).toBeNull();
    });

    it('computes payout as dividend yield times P/E, only with positive earnings', () => {
        expect(payoutFrom(6, 5)).toBeCloseTo(30);
        expect(payoutFrom(6, -5)).toBeNull();
        expect(payoutFrom(null, 5)).toBeNull();
        expect(payoutFrom(6, null)).toBeNull();
    });

    it('averages close x volume over the last sessions that have both', () => {
        const chart = (close: (number | null)[], volume: (number | null)[]) => ({ chart: { result: [{ indicators: { quote: [{ close, volume }] } }] } });
        expect(averageTurnoverFromChart(chart([10, 20, null, 30], [100, 100, 100, 200]), 2)).toBe(4000);
        expect(averageTurnoverFromChart(chart([10, 20], [100, 300]))).toBe(3500);
        expect(averageTurnoverFromChart(chart([10], [0]))).toBeNull();
        expect(averageTurnoverFromChart(chart([], []))).toBeNull();
        expect(averageTurnoverFromChart(null)).toBeNull();
    });
});
