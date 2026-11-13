'use server';

import { QUOTE_TTL_SECONDS } from '@/lib/market-data';
import { EMPTY_FUNDAMENTALS, averageTurnoverFromChart, payoutFrom, dailyQuoteFromChart, fundamentalsYahooSymbol, dividendYieldFromChart, fundamentalsFromTimeseries, marketCapFallbackSymbol, marketCapFromTimeseries, normalizeYahooSymbol, yahooAppSymbol, yahooCurrency, type YahooDailyQuote, type YahooFundamentals } from '@/lib/yahoo';

// Daily Tadawul, Warsaw and B3 quotes from Yahoo Finance (free, no key, covers .SR, .WA and .SA), keyed by the symbol passed in.
// One chart call per symbol (no batch endpoint without login) behind the shared quote cache (hourly in cached
// mode, 5 minutes in realtime), so a Saudi, Polish or Brazilian dashboard costs ~17-24 requests per refresh, not per user.
export async function getYahooDailyQuotes(symbols: string[]): Promise<Record<string, YahooDailyQuote>> {
    const entries = await Promise.all(
        symbols.map(async (symbol) => {
            const yahooSymbol = normalizeYahooSymbol(symbol);
            if (!yahooSymbol) return [symbol, null] as const;
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    next: { revalidate: Math.max(QUOTE_TTL_SECONDS, 300) },
                    // A stalled request would hold up the whole dashboard (movers and quotes aren't suspended)
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) return [symbol, null] as const;
                return [symbol, dailyQuoteFromChart(await res.json(), yahooCurrency(yahooSymbol))] as const;
            } catch (e) {
                console.error('Yahoo daily quote error', symbol, e);
                return [symbol, null] as const;
            }
        }),
    );
    return Object.fromEntries(entries.filter(([, q]) => q)) as Record<string, YahooDailyQuote>;
}

const YAHOO_BASE = 'https://query1.finance.yahoo.com';
const FUNDAMENTAL_TYPES = [
    'trailingPeRatio', 'trailingPbRatio', 'trailingMarketCap', 'trailingEnterprisesValueEBITDARatio',
    'trailingEBIT', 'quarterlyTotalAssets', 'quarterlyCurrentLiabilities', 'annualEBIT', 'annualTotalAssets', 'annualCurrentLiabilities',
    'trailingNetIncome', 'trailingTotalRevenue', 'annualNetIncome', 'annualTotalRevenue',
    'trailingEBITDA', 'annualEBITDA', 'quarterlyNetDebt', 'annualNetDebt', 'quarterlyTotalDebt', 'annualTotalDebt',
    'quarterlyCashCashEquivalentsAndShortTermInvestments', 'annualCashCashEquivalentsAndShortTermInvestments',
    'quarterlyCashAndCashEquivalents', 'annualCashAndCashEquivalents',
].join(',');

// The fundamentals timeseries URL of one Yahoo symbol. The window reaches back four fiscal years (for profit growth) and is rounded to whole days so the URL is stable and Next's
// fetch cache can hit; the indicators and the heatmap's market values share it, so they cost one request between them.
function timeseriesUrl(yahooSymbol: string, types = FUNDAMENTAL_TYPES) {
    const day = 86_400;
    const today = Math.floor(Date.now() / 1000 / day) * day;
    return `${YAHOO_BASE}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(yahooSymbol)}?type=${types}&period1=${today - 1650 * day}&period2=${today + day}`;
}

// Cached six hours since these figures change once a day; null on any failure so one source never loses the others
async function fetchSlowJson(url: string, symbol: string): Promise<unknown> {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 21600 },
            signal: AbortSignal.timeout(5000),
        });
        return res.ok ? await res.json() : null;
    } catch (e) {
        console.error('Yahoo fundamentals error', symbol, e);
        return null;
    }
}

// The table indicators per symbol (indices, crypto, forex and other exchanges skipped; plain US tickers included). Two requests
// per symbol (the fundamentals timeseries and a 1-year daily chart with dividend events, which gives the dividend yield and the
// average daily traded value), cached six hours since the figures change once a day.
export async function getYahooFundamentals(symbols: string[]): Promise<Record<string, YahooFundamentals>> {
    const entries = await Promise.all(
        symbols.map(async (symbol) => {
            const yahooSymbol = fundamentalsYahooSymbol(symbol);
            if (!yahooSymbol) return [symbol, null] as const;
            const [series, chart] = await Promise.all([
                fetchSlowJson(timeseriesUrl(yahooSymbol), symbol),
                fetchSlowJson(`${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1y&events=div`, symbol),
            ]);
            const fundamentals = series ? fundamentalsFromTimeseries(series) : null;
            const dy = chart ? dividendYieldFromChart(chart) : null;
            const liquidity = chart ? averageTurnoverFromChart(chart) : null;
            if (!fundamentals && dy === null && liquidity === null) return [symbol, null] as const;
            const base = fundamentals ?? EMPTY_FUNDAMENTALS;
            return [symbol, { ...base, dy, liquidity, payout: payoutFrom(dy, base.pe) }] as const;
        }),
    );
    return Object.fromEntries(entries.filter(([, f]) => f)) as Record<string, YahooFundamentals>;
}

// Company market value per Yahoo-priced stock, for sizing the heatmap. Same request as the indicators (a cache hit when the
// quotes table is on the page); B3 units have none of their own and take one more request for the common share's.
export async function getYahooMarketCaps(symbols: string[]): Promise<Record<string, number>> {
    const entries = await Promise.all(
        symbols.map(async (symbol) => {
            const yahooSymbol = yahooAppSymbol(symbol);
            if (!yahooSymbol) return [symbol, null] as const;
            const own = marketCapFromTimeseries(await fetchSlowJson(timeseriesUrl(yahooSymbol), symbol));
            if (own !== null) return [symbol, own] as const;
            const fallback = marketCapFallbackSymbol(yahooSymbol);
            if (!fallback) return [symbol, null] as const;
            return [symbol, marketCapFromTimeseries(await fetchSlowJson(timeseriesUrl(fallback, 'trailingMarketCap'), symbol))] as const;
        }),
    );
    return Object.fromEntries(entries.filter(([, cap]) => cap !== null && cap > 0)) as Record<string, number>;
}
