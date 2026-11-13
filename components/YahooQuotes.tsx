import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Messages } from 'next-intl';
import ChangePill from '@/components/ChangePill';
import YahooQuotesSortable from '@/components/YahooQuotesSortable';
import { getYahooDailyQuotes, getYahooFundamentals } from '@/lib/actions/yahoo.actions';
import { yahooAppSymbol } from '@/lib/yahoo';
import type { Market } from '@/lib/markets';
import { toMessageKey } from '@/i18n/config';

type GroupKey = keyof Messages['Markets']['groups'];

const symbolsOf = (market: Market) => [...new Set(market.groups.flatMap((g) => g.symbols.map(([s]) => s)))];

// Our own quotes table for Yahoo-priced markets: TradingView's market-quotes widget shows no TADAWUL values in free embeds,
// and only end-of-day GPW values. Sorting needs client state, so this server part only fetches and builds plain rows.
export default async function YahooQuotesTable({ market }: { market: Market }) {
    const symbols = symbolsOf(market);
    const [quotes, fundamentals, t, th, tm] = await Promise.all([
        getYahooDailyQuotes(symbols),
        getYahooFundamentals(symbols),
        getTranslations('YahooQuotes'),
        getTranslations('WatchlistTable.headers'),
        getTranslations('Markets'),
    ]);
    const currency = Object.values(quotes)[0]?.currency;

    const groups = market.groups.map((group) => ({
        title: tm(`groups.${toMessageKey(group.title) as GroupKey}`),
        rows: group.symbols.map(([tvSymbol, name]) => {
            const q = quotes[tvSymbol];
            const f = fundamentals[tvSymbol];
            return {
                tvSymbol,
                appSymbol: yahooAppSymbol(tvSymbol),
                name,
                price: q?.price ?? null,
                change: q?.change ?? null,
                changePercent: q?.changePercent ?? null,
                pe: f?.pe ?? null,
                pb: f?.pb ?? null,
                roe: f?.roe ?? null,
                roce: f?.roce ?? null,
            };
        }),
    }));

    const labels = {
        company: th('company'),
        price: th('price'),
        change: th('change'),
        changePercent: t('changePercent'),
        pe: t('pe'),
        pb: t('pb'),
        roe: t('roe'),
        roce: t('roce'),
        clearSort: t('clearSort'),
        combinedHint: t('combinedHint'),
    };
    const sortByTemplate = {
        name: t('sortBy', { column: labels.company }),
        price: t('sortBy', { column: labels.price }),
        change: t('sortBy', { column: labels.change }),
        changePercent: t('sortBy', { column: labels.changePercent }),
        pe: t('sortBy', { column: labels.pe }),
        pb: t('sortBy', { column: labels.pb }),
        roe: t('sortBy', { column: labels.roe }),
        roce: t('sortBy', { column: labels.roce }),
    };
    const hasFundamentals = Object.keys(fundamentals).length > 0;
    const source = currency ? t('source', { currency }) : t('sourceNoCurrency');
    const note = hasFundamentals ? `${source} ${t('fundamentalsNote')}` : source;

    return <YahooQuotesSortable groups={groups} labels={labels} sortByTemplate={sortByTemplate} note={note} />;
}

// Today's biggest movers across the same groups, ranked by day change %
export async function YahooMovers({ market, count = 8 }: { market: Market; count?: number }) {
    const symbols = symbolsOf(market);
    const nameOf = Object.fromEntries(market.groups.flatMap((g) => g.symbols));
    const [quotes, t] = await Promise.all([getYahooDailyQuotes(symbols), getTranslations('YahooQuotes')]);
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
                return (
                    <li key={symbol}>
                        <Link href={`/stocks/${yahooAppSymbol(symbol)}`} className="flex items-center gap-3 rounded-[10px] px-3 py-2 transition-colors hover:bg-hover/60">
                            <span className={up ? 'text-up' : 'text-down'}>
                                {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-semibold">{name}</span>
                                <span className="mono block text-[11.5px] text-faint">{symbol.split(':').pop()}</span>
                            </span>
                            <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-hover">
                                <span
                                    className={`absolute inset-y-0 rounded-full ${up ? 'left-0 bg-up' : 'right-0 bg-down'}`}
                                    style={{ width: `${(Math.abs(quote.changePercent) / max) * 100}%` }}
                                />
                            </span>
                            <ChangePill value={quote.changePercent} />
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
