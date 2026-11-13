import type { MetadataRoute } from 'next';
import { PUBLIC_EXACT_PATHS } from '@/lib/public-paths';

export function sitemapEntries(origin: string): MetadataRoute.Sitemap {
    const base = origin.replace(/\/$/, '');
    return PUBLIC_EXACT_PATHS.map((path) => ({
        url: `${base}${path}`,
        changeFrequency: 'monthly',
        priority: path === '/' ? 1 : 0.5,
    }));
}
