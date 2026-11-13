import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Messages } from 'next-intl';
import ChangePill from '@/components/ChangePill';
import YahooQuotesSortable from '@/components/YahooQuotesSortable';
import { getYahooDailyQuotes, getYahooFundamentals } from '@/lib/actions/yahoo.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { EMPTY_FUNDAMENTALS, yahooAppSymbol } from '@/lib/yahoo';
import { commodityCode, type Market } from '@/lib/markets';
import { toMessageKey } from '@/i18n/config';

type GroupKey = keyof Messages['Markets']['groups'];
type CommodityKey = keyof Messages['Markets']['commodities'];
type MarketsT = Awaited<ReturnType<typeof getTranslations<'Markets'>>>;

// Commodities are named in the reader's language; companies keep the name from the market list
const displayName = (tm: MarketsT, symbol: string, name: string) => {
    const code = commodityCode(symbol) as CommodityKey | null;
    return code && tm.has(`commodities.${code}`) ? tm(`commodities.${code}`) : name;
};

const symbolsOf = (market: Market) => [...new Set(market.groups.flatMap((g) => g.symbols.map(([s]) => s)))];

// Our own quotes table for Yahoo-priced markets: TradingView's market-quotes widget shows no TADAWUL values in free embeds,
// and only end-of-day GPW values. Sorting needs client state, so this server part only fetches and builds plain rows.
export default async function YahooQuotesTable({ market }: { market: Market }) {
    const symbols = symbolsOf(market);
    const [quotes, fundamentals, watchlist, t, th, tm, tw] = await Promise.all([
        getYahooDailyQuotes(symbols),
        getYahooFundamentals(symbols),
        // The star column still works without it: a failed read only shows every star empty
        getUserWatchlist().catch(() => []) as Promise<{ symbol: string }[]>,
        getTranslations('YahooQuotes'),
        getTranslations('WatchlistTable.headers'),
        getTranslations('Markets'),
        getTranslations('WatchlistPage'),
    ]);
    const currency = Object.values(quotes)[0]?.currency;
    const watched = new Set(watchlist.map((w) => w.symbol));

    const groups = market.groups.map((group) => ({
        title: tm(`groups.${toMessageKey(group.title) as GroupKey}`),
        rows: group.symbols.map(([tvSymbol, name]) => {
            const q = quotes[tvSymbol];
            return {
                tvSymbol,
                watching: watched.has(yahooAppSymbol(tvSymbol) ?? ''),
                appSymbol: yahooAppSymbol(tvSymbol),
                name: displayName(tm, tvSymbol, name),
                unit: market.units?.[tvSymbol] ?? null,
                price: q?.price ?? null,
                change: q?.change ?? null,
                changePercent: q?.changePercent ?? null,
                ...(fundamentals[tvSymbol] ?? EMPTY_FUNDAMENTALS),
            };
        }),
    }));

    const labels = {
        // Commodities are not companies: the first column gets its own heading
        company: market.units ? th('commodity') : th('company'),
        price: th('price'),
        change: th('change'),
        changePercent: t('changePercent'),
        clearSort: t('clearSort'),
        combinedHint: t('combinedHint'),
    };
    const hasFundamentals = Object.keys(fundamentals).length > 0;
    const source = currency ? t('source', { currency }) : t('sourceNoCurrency');
    const note = market.units ? t('commoditiesNote') : hasFundamentals ? `${source} ${t('fundamentalsNote')}` : source;

    return <YahooQuotesSortable groups={groups} labels={labels} note={note} watchLabel={tw('title')} />;
}

// Today's biggest movers across the same groups, ranked by day change %
export async function YahooMovers({ market, count = 8 }: { market: Market; count?: number }) {
    const symbols = symbolsOf(market);
    const nameOf = Object.fromEntries(market.groups.flatMap((g) => g.symbols));
    const [quotes, t, tm] = await Promise.all([getYahooDailyQuotes(symbols), getTranslations('YahooQuotes'), getTranslations('Markets')]);
    const ranked = symbols
        .flatMap((symbol) => (quotes[symbol] ? [{ symbol, name: nameOf[symbol], quote: quotes[symbol] }] : []))
        .sort((a, b) => Math.abs(b.quote.changePercent) - Math.abs(a.quote.changePercent))
        .slice(0, count);
    const max = Math.max(0.01, ...ranked.map((r) => Math.abs(r.quote.changePercent)));

    if (ranked.length === 0) return <p className="search-list-indicator">{t('unavailable')}</p>;

    return (
        <ul className="flex flex-col gap-1 p-1">
            {ranked.map(({ symbol, name, quote }) => {
                const up = quote.changePercent >= 0;
                const appSymbol = yahooAppSymbol(symbol);
                // Commodities have no page of their own
                const Row = ({ children }: { children: React.ReactNode }) => appSymbol
                    ? <Link href={`/stocks/${appSymbol}`} className="flex items-center gap-3 rounded-[10px] px-3 py-2 transition-colors hover:bg-hover/60">{children}</Link>
                    : <div className="flex items-center gap-3 rounded-[10px] px-3 py-2">{children}</div>;
                return (
                    <li key={symbol}>
                        <Row>
                            <span className={up ? 'text-up' : 'text-down'}>
                                {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-semibold">{displayName(tm, symbol, name)}</span>
                                <span className="mono block text-[11.5px] text-faint">{market.units?.[symbol] ?? symbol.split(':').pop()}</span>
                            </span>
                            <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-hover">
                                <span
                                    className={`absolute inset-y-0 rounded-full ${up ? 'left-0 bg-up' : 'right-0 bg-down'}`}
                                    style={{ width: `${(Math.abs(quote.changePercent) / max) * 100}%` }}
                                />
                            </span>
                            <ChangePill value={quote.changePercent} />
                        </Row>
                    </li>
                );
            })}
        </ul>
    );
}
