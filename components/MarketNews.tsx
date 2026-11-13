import { getTranslations } from 'next-intl/server';
import MarketNewsList from '@/components/MarketNewsList';
import { getMarketNews } from '@/lib/actions/news.actions';
import type { Market } from '@/lib/markets';

// Headlines from the market's local news portals (Market.newsFeeds); the filters and relative times need the client
export default async function MarketNews({ market }: { market: Market }) {
    const [items, t] = await Promise.all([getMarketNews(market), getTranslations('MarketNews')]);
    return <MarketNewsList items={items} sources={(market.newsFeeds ?? []).map((f) => f.name)} unavailable={t('unavailable')} />;
}
