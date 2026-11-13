// The fork's public site is the landing page, the terms and the privacy policy; everything else needs a session.
// The upstream marketing pages (about, help, sponsor, /s, /compare...) are redirected home in next.config.ts.
export const PUBLIC_EXACT_PATHS = ['/', '/terms', '/privacy'] as const;

const EXACT = new Set<string>(PUBLIC_EXACT_PATHS);

export function isPublicPath(pathname: string): boolean {
    if (EXACT.has(pathname)) return true;
    if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return true;
    return false;
}
