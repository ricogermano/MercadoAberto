import { getTranslations } from 'next-intl/server';
import type { Messages } from 'next-intl';
import HeatmapTreemap from '@/components/HeatmapTreemap';
import { getYahooDailyQuotes, getYahooMarketCaps } from '@/lib/actions/yahoo.actions';
import { yahooAppSymbol } from '@/lib/yahoo';
import type { Market } from '@/lib/markets';
import { toMessageKey } from '@/i18n/config';

type GroupKey = keyof Messages['Markets']['groups'];

// Our own heatmap for Yahoo-priced markets (TradingView's heatmap widgets don't cover B3): one block per stock of the
// market's groups, sized by company market value and coloured by today's move. The layout depends on the box size, so
// this server part only fetches and builds plain rows.
export default async function YahooHeatmap({ market, locale }: { market: Market; locale: string }) {
    const symbols = [...new Set(market.groups.flatMap((g) => g.symbols.map(([s]) => s)))];
    const [quotes, caps, t, tq, tm] = await Promise.all([
        getYahooDailyQuotes(symbols),
        getYahooMarketCaps(symbols).catch(() => ({}) as Record<string, number>),
        getTranslations('Dashboard'),
        getTranslations('YahooQuotes'),
        getTranslations('Markets'),
    ]);
    const currency = Object.values(quotes)[0]?.currency ?? 'USD';
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const compact = new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 });

    const sectors = market.groups
        .map((group) => ({
            title: tm(`groups.${toMessageKey(group.title) as GroupKey}`),
            cells: group.symbols.flatMap(([tvSymbol, name]) => {
                const quote = quotes[tvSymbol];
                const cap = caps[tvSymbol];
                const appSymbol = yahooAppSymbol(tvSymbol);
                // A block needs both a size and a colour
                if (!quote || !cap || !appSymbol) return [];
                return [{
                    ticker: tvSymbol.split(':').pop() ?? tvSymbol,
                    href: `/stocks/${appSymbol}`,
                    name,
                    cap,
                    changePercent: quote.changePercent,
                    detail: `${money.format(quote.price)} · ${compact.format(cap)}`,
                }];
            }),
        }))
        .filter((sector) => sector.cells.length > 0);

    if (sectors.length === 0) return <p className="search-list-indicator">{tq('unavailable')}</p>;

    return <HeatmapTreemap sectors={sectors} note={t('heatmapNote')} />;
}
