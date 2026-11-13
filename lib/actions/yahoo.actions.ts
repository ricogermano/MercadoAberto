'use server';

import { QUOTE_TTL_SECONDS } from '@/lib/market-data';
import { dailyQuoteFromChart, fundamentalsFromTimeseries, normalizeYahooSymbol, yahooAppSymbol, yahooCurrency, type YahooDailyQuote, type YahooFundamentals } from '@/lib/yahoo';

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

// Trailing P/E, P/B and ROE per symbol (indices skipped). The window is rounded to whole days so the URL is stable
// and Next's fetch cache can hit; the ratios change once a day, so six hours is plenty.
export async function getYahooFundamentals(symbols: string[]): Promise<Record<string, YahooFundamentals>> {
    const day = 86_400;
    const today = Math.floor(Date.now() / 1000 / day) * day;
    const period1 = today - 400 * day;
    const period2 = today + day;
    const entries = await Promise.all(
        symbols.map(async (symbol) => {
            const yahooSymbol = yahooAppSymbol(symbol);
            if (!yahooSymbol) return [symbol, null] as const;
            try {
                const res = await fetch(
                    `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(yahooSymbol)}?type=trailingPeRatio,trailingPbRatio&period1=${period1}&period2=${period2}`,
                    {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        next: { revalidate: 21600 },
                        signal: AbortSignal.timeout(5000),
                    },
                );
                if (!res.ok) return [symbol, null] as const;
                return [symbol, fundamentalsFromTimeseries(await res.json())] as const;
            } catch (e) {
                console.error('Yahoo fundamentals error', symbol, e);
                return [symbol, null] as const;
            }
        }),
    );
    return Object.fromEntries(entries.filter(([, f]) => f)) as Record<string, YahooFundamentals>;
}
