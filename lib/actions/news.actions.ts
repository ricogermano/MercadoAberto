'use server';

import { matchesKeywords, mergeNews, parseRss, tagTickers, type NewsItem } from '@/lib/rss';
import type { Market } from '@/lib/markets';

// Headlines from the market's own news portals (Market.newsFeeds), newest first. Each feed has its own try/catch and timeout,
// so one portal being down only removes its headlines. Only titles and links are kept. With Market.newsKeywords, only the
// headlines on that theme.
export async function getMarketNews(market: Market): Promise<NewsItem[]> {
    const feeds = market.newsFeeds ?? [];
    const keywords = market.newsKeywords;
    const symbols = market.groups.flatMap((g) => g.symbols);
    const sources = await Promise.all(
        feeds.map(async ({ name, url }) => {
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    next: { revalidate: 600 },
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) return { source: name, items: [] };
                return { source: name, items: parseRss(await res.text()).filter((item) => !keywords || matchesKeywords(item.title, keywords)), tickersOf: (title: string) => tagTickers(title, symbols) };
            } catch (e) {
                console.error('News feed error', name, e);
                return { source: name, items: [] };
            }
        }),
    );
    return mergeNews(sources);
}
