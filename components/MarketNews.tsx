import { getTranslations } from 'next-intl/server';
import MarketNewsList from '@/components/MarketNewsList';
import { getMarketNews } from '@/lib/actions/news.actions';
import type { Market, NewsFeed } from '@/lib/markets';

// Up to 150 headlines (the list scrolls, and opens full screen) from the market's local news portals (Market.newsFeeds); the filters and relative times need the client
export default async function MarketNews({ market, feeds = market.newsFeeds ?? [] }: { market: Market; feeds?: NewsFeed[] }) {
    const [items, t] = await Promise.all([getMarketNews(market, { perSource: 30, limit: 150, feeds }), getTranslations('MarketNews')]);
    return <MarketNewsList items={items} sources={feeds.map((f) => f.name)} unavailable={t('unavailable')} />;
}
