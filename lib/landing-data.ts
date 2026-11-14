import ptMessages from '@/messages/pt.json';
import { getYahooDailyQuotes, getYahooFundamentals, getYahooMarketCaps } from '@/lib/actions/yahoo.actions';
import { MARKETS, getMarket } from '@/lib/markets';
import { squarify, type Rect } from '@/lib/treemap';
import { toMessageKey } from '@/i18n/config';
import type { YahooFundamentals } from '@/lib/yahoo';

// Real B3 numbers for the public landing page: the same Yahoo requests (and cache) as the Brazil dashboard, so the page
// shows the product itself instead of a screenshot that goes stale. Everything is laid out here, on the server, in % of
// the map box: the page ships no script for it.

// The map is laid out for a 16:10 box; a different box on screen only stretches the blocks
const MAP = { w: 160, h: 100 };
const SECTOR_LABEL = 5; // in map units: about 18px of a 360px-high box
const TABLE_ROWS = 6;

export type LandingCell = { ticker: string; name: string; changePercent: number; place: Rect };
export type LandingSector = { title: string; label: Rect | null; cells: LandingCell[] };
export type LandingRow = { ticker: string; name: string; price: number; changePercent: number; fundamentals: YahooFundamentals };
export type LandingData = {
    stockCount: number;
    sectorCount: number;
    commodityCount: number;
    otherMarketCount: number;
    currency: string;
    sectors: LandingSector[];
    rows: LandingRow[];
    generatedAt: string; // "14:32", Brasília time
};

const groupNames = ptMessages.Markets.groups as Record<string, string>;
const percentOf = (r: Rect): Rect => ({ x: (r.x / MAP.w) * 100, y: (r.y / MAP.h) * 100, w: (r.w / MAP.w) * 100, h: (r.h / MAP.h) * 100 });
const uniqueSymbols = (id: string) => [...new Set(getMarket(id).groups.flatMap((g) => g.symbols.map(([s]) => s)))];

export async function getLandingData(): Promise<LandingData> {
    const market = getMarket('br');
    const symbols = uniqueSymbols('br');
    const [quotes, caps] = await Promise.all([
        getYahooDailyQuotes(symbols).catch(() => ({}) as Awaited<ReturnType<typeof getYahooDailyQuotes>>),
        getYahooMarketCaps(symbols).catch(() => ({}) as Record<string, number>),
    ]);

    const groups = market.groups
        .map((group) => ({
            title: groupNames[toMessageKey(group.title)] ?? group.title,
            stocks: group.symbols.flatMap(([symbol, name]) => {
                const quote = quotes[symbol];
                const cap = caps[symbol];
                return quote && cap ? [{ symbol, ticker: symbol.split(':').pop() ?? symbol, name, cap, quote }] : [];
            }),
        }))
        .filter((g) => g.stocks.length > 0);

    const sectors: LandingSector[] = squarify(groups, (g) => g.stocks.reduce((sum, s) => sum + s.cap, 0), { x: 0, y: 0, ...MAP }).map(({ item, rect }) => {
        const labelled = rect.w >= 16 && rect.h >= 15;
        const top = labelled ? SECTOR_LABEL : 0;
        return {
            title: item.title,
            label: labelled ? percentOf({ x: rect.x, y: rect.y, w: rect.w, h: SECTOR_LABEL }) : null,
            cells: squarify(item.stocks, (s) => s.cap, { x: 0, y: 0, w: rect.w, h: rect.h - top }).map(({ item: stock, rect: r }) => ({
                ticker: stock.ticker,
                name: stock.name,
                changePercent: stock.quote.changePercent,
                place: percentOf({ x: rect.x + r.x, y: rect.y + top + r.y, w: r.w, h: r.h }),
            })),
        };
    });

    // The largest companies that have a P/L to show (B3 units have none on Yahoo)
    const largest = groups.flatMap((g) => g.stocks).sort((a, b) => b.cap - a.cap).slice(0, TABLE_ROWS * 2);
    const fundamentals = largest.length ? await getYahooFundamentals(largest.map((s) => s.symbol)).catch(() => ({}) as Record<string, YahooFundamentals>) : {};
    const rows = largest
        .flatMap((s) => {
            const f = fundamentals[s.symbol];
            return f && f.pe !== null ? [{ ticker: s.ticker, name: s.name, price: s.quote.price, changePercent: s.quote.changePercent, fundamentals: f }] : [];
        })
        .slice(0, TABLE_ROWS);

    return {
        stockCount: symbols.length,
        sectorCount: market.groups.length,
        commodityCount: uniqueSymbols('cmd').length,
        otherMarketCount: MARKETS.filter((m) => !['br', 'cmd', 'fx', 'crypto'].includes(m.id)).length,
        currency: Object.values(quotes)[0]?.currency ?? 'BRL',
        sectors,
        rows,
        generatedAt: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date()),
    };
}
