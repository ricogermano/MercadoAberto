'use server';

import { matchesKeywords, mergeNews, parseRss, tagTickers, type NewsItem } from '@/lib/rss';
import type { Market } from '@/lib/markets';
import { yahooAppSymbol } from '@/lib/yahoo';

type NewsOptions = {
    // App symbols the reader follows ("ABEV3.SA"): tagged first, and tagged even when they are not in the market's table
    watched?: string[];
    perSource?: number;
    limit?: number;
};

// Headlines from the market's own news portals (Market.newsFeeds), newest first. Each feed has its own try/catch and timeout,
// so one portal being down only removes its headlines. Only titles and links are kept. With Market.newsKeywords, only the
// headlines on that theme.
export async function getMarketNews(market: Market, { watched = [], perSource, limit }: NewsOptions = {}): Promise<NewsItem[]> {
    const feeds = market.newsFeeds ?? [];
    const keywords = market.newsKeywords;
    const table = market.groups.flatMap((g) => g.symbols);
    const following = new Set(watched.map((s) => s.trim().toUpperCase()));
    const inTable = new Set(table.map(([tv]) => yahooAppSymbol(tv)));
    // Followed companies first, so the three-ticker cap of a headline never drops them
    const symbols: [string, string][] = [
        ...table.filter(([tv]) => following.has(yahooAppSymbol(tv) ?? '')),
        ...[...following].filter((s) => s.endsWith('.SA') && !inTable.has(s)).map((s): [string, string] => [`BMFBOVESPA:${s.slice(0, -3)}`, '']),
        ...table.filter(([tv]) => !following.has(yahooAppSymbol(tv) ?? '')),
    ];
    const tickersOf = (title: string) => tagTickers(title, symbols);
    const sources = await Promise.all(
        feeds.map(async ({ name, url }) => {
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    next: { revalidate: 600 },
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) return { source: name, items: [] };
                return { source: name, items: parseRss(await res.text()).filter((item) => !keywords || matchesKeywords(item.title, keywords)), tickersOf };
            } catch (e) {
                console.error('News feed error', name, e);
                return { source: name, items: [] };
            }
        }),
    );
    return mergeNews(sources, Date.now(), { ...(perSource ? { perSource } : {}), ...(limit ? { limit } : {}) });
}
