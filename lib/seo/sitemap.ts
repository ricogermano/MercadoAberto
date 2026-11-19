import type { MetadataRoute } from 'next';
import { PUBLIC_EXACT_PATHS } from '@/lib/public-paths';
import { B3_STOCKS, b3Path } from '@/lib/seo/b3';

export function sitemapEntries(origin: string): MetadataRoute.Sitemap {
    const base = origin.replace(/\/$/, '');
    return [
        ...PUBLIC_EXACT_PATHS.map((path) => ({
            url: `${base}${path}`,
            changeFrequency: 'monthly' as const,
            priority: path === '/' ? 1 : 0.5,
        })),
        { url: `${base}/acoes`, changeFrequency: 'weekly' as const, priority: 0.8 },
        ...B3_STOCKS.map((s) => ({ url: `${base}${b3Path(s.ticker)}`, changeFrequency: 'daily' as const, priority: 0.7 })),
    ];
}
