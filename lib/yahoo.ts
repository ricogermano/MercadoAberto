// Yahoo Finance helpers for exchanges the free sources price badly: Tadawul (.SR) is blocked in TradingView's free
// embeds and on Finnhub free; Warsaw (GPW, .WA) renders in embeds but only end of day, where Yahoo is ~15 minutes delayed.
// B3 (BMFBOVESPA, .SA) is not on Finnhub free at all; Yahoo has it ~15 minutes delayed.
// Pure functions, covered by tests; the network call lives in lib/actions/yahoo.actions.ts.

import { hasFinnhubCompanyData } from '@/lib/markets';

type YahooExchange = { suffix: string; currency: string; ticker: RegExp; indices: Record<string, string> };

// TradingView prefix -> Yahoo suffix, trading currency, the shape of a ticker, and index tickers with their Yahoo symbols
const YAHOO_EXCHANGES: Record<string, YahooExchange> = {
    TADAWUL: { suffix: 'SR', currency: 'SAR', ticker: /^\d+$/, indices: { TASI: '^TASI.SR' } },
    GPW: { suffix: 'WA', currency: 'PLN', ticker: /^[A-Z0-9]+$/, indices: { WIG20: 'WIG20.WA', WIG: 'WIG.WA', MWIG40: 'MWIG40.WA', SWIG80: 'SWIG80.WA' } },
    // PETR4, VALE3, units like BPAC11, BDRs like AAPL34
    BMFBOVESPA: { suffix: 'SA', currency: 'BRL', ticker: /^[A-Z0-9]{4}\d{1,2}$/, indices: { IBOV: '^BVSP', IFIX: 'IFIX.SA', SMLL: 'SMLL.SA', IDIV: 'IDIV.SA' } },
};

const INDEX_SYMBOLS = new Set(Object.values(YAHOO_EXCHANGES).flatMap((ex) => Object.values(ex.indices)));

// "2222.SR" or "TADAWUL:2222" -> "2222.SR"; "PKN.WA" or "GPW:PKN" -> "PKN.WA".
// Indices: "TADAWUL:TASI" -> "^TASI.SR", "GPW:WIG20" -> "WIG20.WA". Anything else -> null.
export function normalizeYahooSymbol(symbol: string): string | null {
    const upper = (symbol || '').trim().toUpperCase();
    if (INDEX_SYMBOLS.has(upper)) return upper;
    // Commodity futures: "CMD:GC" -> "GC=F", Yahoo's nearest-expiry contract
    if (upper.startsWith('CMD:')) return /^[A-Z]{1,3}$/.test(upper.slice(4)) ? `${upper.slice(4)}=F` : null;
    for (const [prefix, ex] of Object.entries(YAHOO_EXCHANGES)) {
        const ticker = upper.startsWith(`${prefix}:`) ? upper.slice(prefix.length + 1)
            : upper.endsWith(`.${ex.suffix}`) ? upper.slice(0, -(ex.suffix.length + 1))
            : null;
        if (ticker === null) continue;
        if (ex.indices[ticker]) return ex.indices[ticker];
        return ex.ticker.test(ticker) ? `${ticker}.${ex.suffix}` : null;
    }
    return null;
}

export const isYahooSymbol = (symbol: string) => normalizeYahooSymbol(symbol) !== null;

// "TADAWUL:2222" -> "2222.SR", "GPW:PKN" -> "PKN.WA": the symbols our stock pages use. Indices and commodity futures have no stock page.
export const yahooAppSymbol = (tvSymbol: string) => {
    const yahoo = normalizeYahooSymbol(tvSymbol);
    return yahoo && !INDEX_SYMBOLS.has(yahoo) && !yahoo.endsWith('=F') ? yahoo : null;
};

// The exchange's currency for a Yahoo symbol ("PKN.WA" -> "PLN"), for when Yahoo leaves meta.currency out
export const yahooCurrency = (yahooSymbol: string) =>
    Object.values(YAHOO_EXCHANGES).find((ex) => yahooSymbol.toUpperCase().endsWith(`.${ex.suffix}`))?.currency ?? 'USD';

export type YahooDailyQuote = {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    name: string;
};

type YahooChartJson = {
    chart?: {
        result?: Array<{
            meta?: { currency?: string; shortName?: string; longName?: string; regularMarketPrice?: number; fulldayChange?: number; regularMarketChangePercent?: number };
            indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
    };
};

// Today's quote from a /v8/finance/chart response: Yahoo's own day change when it sends one,
// else the last two daily closes (TASI and the WIG indices only ever return one daily bar, so they need the former).
// longName first: GPW short names look like "PKN C.XWAR PLN".
export function dailyQuoteFromChart(json: unknown, fallbackCurrency = 'USD'): YahooDailyQuote | null {
    const result = (json as YahooChartJson)?.chart?.result?.[0];
    const meta = result?.meta;
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((n): n is number => Number.isFinite(n));
    if (!result || closes.length === 0) return null;
    const price = meta?.regularMarketPrice ?? closes[closes.length - 1];
    const prev = closes.length > 1 ? closes[closes.length - 2] : null;
    const change = meta?.fulldayChange ?? (prev != null ? price - prev : 0);
    return {
        price,
        change,
        changePercent: meta?.regularMarketChangePercent ?? (prev ? (change / prev) * 100 : 0),
        currency: result.meta?.currency || fallbackCurrency,
        name: result.meta?.longName || result.meta?.shortName || '',
    };
}

// The Yahoo symbol to look fundamentals up under: our Yahoo-priced listings as they are, plain US tickers with "." as "-"
// (BRK.B -> BRK-B); crypto pairs, forex, indices and other exchanges have none.
export function fundamentalsYahooSymbol(symbol: string): string | null {
    const yahoo = yahooAppSymbol(symbol);
    if (yahoo) return yahoo;
    const upper = (symbol || '').trim().toUpperCase();
    return upper && hasFinnhubCompanyData(upper) ? upper.replace('.', '-') : null;
}

export type YahooFundamentals = { pe: number | null; pb: number | null; roe: number | null; roce: number | null; dy: number | null };

type YahooTimeseriesJson = {
    timeseries?: {
        result?: Array<Record<string, unknown> & { meta?: { type?: string[] } }>;
    };
};

// The most recent finite value of one ratio (e.g. "trailingPeRatio"); entries come unordered, may be null, or missing entirely
function latestRatio(json: unknown, type: string): number | null {
    let best: { date: string; raw: number } | null = null;
    for (const entry of (json as YahooTimeseriesJson)?.timeseries?.result ?? []) {
        const items = entry?.[type];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
            const raw = item?.reportedValue?.raw;
            const date = typeof item?.asOfDate === 'string' ? item.asOfDate : '';
            if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
            if (!best || date > best.date) best = { date, raw };
        }
    }
    return best ? best.raw : null;
}

type DatedValue = { date: string; currency: string; raw: number };

// Every finite item of one type, with its date and currency
function seriesOf(json: unknown, type: string): DatedValue[] {
    const out: DatedValue[] = [];
    for (const entry of (json as YahooTimeseriesJson)?.timeseries?.result ?? []) {
        const items = entry?.[type];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
            const raw = item?.reportedValue?.raw;
            if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
            out.push({ date: typeof item?.asOfDate === 'string' ? item.asOfDate : '', currency: typeof item?.currencyCode === 'string' ? item.currencyCode : '', raw });
        }
    }
    return out;
}

// ROCE % = EBIT / (total assets - current liabilities), for the latest EBIT that has a balance sheet of the same date AND currency
// (Yahoo sometimes switches currency between periods, so mixing either would make the ratio meaningless). Trailing EBIT with
// the latest quarter first, then annual figures. Banks and insurers have no current liabilities, so they get null.
function roceFrom(json: unknown): number | null {
    for (const [ebitType, assetsType, liabilitiesType] of [
        ['trailingEBIT', 'quarterlyTotalAssets', 'quarterlyCurrentLiabilities'],
        ['annualEBIT', 'annualTotalAssets', 'annualCurrentLiabilities'],
    ]) {
        const ebit = seriesOf(json, ebitType).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!ebit) continue;
        const same = (v: DatedValue) => v.date === ebit.date && v.currency === ebit.currency;
        const assets = seriesOf(json, assetsType).find(same);
        const liabilities = seriesOf(json, liabilitiesType).find(same);
        if (!assets || !liabilities) continue;
        const capital = assets.raw - liabilities.raw;
        return capital > 0 ? (ebit.raw / capital) * 100 : null;
    }
    return null;
}

// P/E, P/B, ROE and ROCE from /ws/fundamentals-timeseries; null when Yahoo has none (units such as BPAC11 come back empty)
export function fundamentalsFromTimeseries(json: unknown): YahooFundamentals | null {
    const pe = latestRatio(json, 'trailingPeRatio');
    const pb = latestRatio(json, 'trailingPbRatio');
    const roce = roceFrom(json);
    if (pe === null && pb === null && roce === null) return null;
    // ROE = P/B / P/E: both ratios are currency-free, while Yahoo mixes USD and BRL in the statement fields
    const roe = pe !== null && pb !== null && pe > 0 && pb > 0 ? (pb / pe) * 100 : null;
    return { pe, pb, roe, roce, dy: null };
}

// Company market value from /ws/fundamentals-timeseries (type trailingMarketCap), in the listing's currency; null when Yahoo has none
export const marketCapFromTimeseries = (json: unknown): number | null => latestRatio(json, 'trailingMarketCap');

// Yahoo has no market value for B3 units (BPAC11, SANB11...), but the company's common share carries the value of the
// whole company, so units look it up there ("BPAC11.SA" -> "BPAC3.SA"). null for everything else.
export function marketCapFallbackSymbol(yahooSymbol: string): string | null {
    const m = /^([A-Z]{4})11\.SA$/.exec((yahooSymbol || '').toUpperCase());
    return m ? `${m[1]}3.SA` : null;
}

type YahooDividendChartJson = {
    chart?: { result?: Array<{ meta?: { regularMarketPrice?: number }; events?: { dividends?: Record<string, { amount?: number } | null> } }> };
};

// Dividend yield % = dividends paid in the chart's last twelve months / current price. 0 for a valid chart with no
// dividends (Yahoo leaves `events` out then); null when there is no usable price to divide by.
export function dividendYieldFromChart(json: unknown): number | null {
    const result = (json as YahooDividendChartJson)?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
    let paid = 0;
    for (const d of Object.values(result?.events?.dividends ?? {})) {
        const amount = d?.amount;
        if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) paid += amount;
    }
    return (paid / price) * 100;
}

// Orders rows for a sortable column: nulls always last in both directions, strings A-Z / Z-A, numbers by value
export function compareNullable(a: number | string | null | undefined, b: number | string | null | undefined, dir: 'asc' | 'desc'): number {
    const aNull = a == null || (typeof a === 'number' && !Number.isFinite(a));
    const bNull = b == null || (typeof b === 'number' && !Number.isFinite(b));
    if (aNull || bNull) return aNull === bNull ? 0 : aNull ? 1 : -1;
    const order = typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : (a as number) - (b as number);
    return dir === 'asc' ? order : -order;
}

export type SortCriterion<T> = { key: keyof T; dir: 'asc' | 'desc' };

// Combined ranking: each chosen column gives a rank (1 = best in its direction, ties share a rank: 1, 1, 3) and the ranks are
// added up, lowest total first. Values are continuous, so a plain multi-key sort would only ever break exact ties.
// Rows missing a value in any chosen column can't be ranked fairly: they go last, without a position.
export function rankByCriteria<T>(rows: T[], criteria: SortCriterion<T>[]): { row: T; position: number | null }[] {
    const value = (row: T, key: keyof T) => row[key] as unknown as number | string | null;
    const byCriteria = (a: T, b: T) => {
        for (const c of criteria) {
            const order = compareNullable(value(a, c.key), value(b, c.key), c.dir);
            if (order !== 0) return order;
        }
        return 0;
    };
    const complete = rows.filter((r) => criteria.every((c) => isFiniteValue(value(r, c.key))));
    const incomplete = rows.filter((r) => !complete.includes(r));
    const total = new Map(complete.map((r) => [r, criteria.reduce((sum, c) => sum + 1 + complete.filter((o) => compareNullable(value(o, c.key), value(r, c.key), c.dir) < 0).length, 0)]));
    const ranked = [...complete].sort((a, b) => total.get(a)! - total.get(b)! || byCriteria(a, b));
    return [
        ...ranked.map((row, i) => ({ row, position: i + 1 })),
        ...[...incomplete].sort(byCriteria).map((row) => ({ row, position: null })),
    ];
}

const isFiniteValue = (v: number | string | null | undefined) => v != null && (typeof v !== 'number' || Number.isFinite(v));
