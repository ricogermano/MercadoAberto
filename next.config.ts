import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
    devIndicators: false,
    // Upstream's English marketing pages (sponsorship, OpenStock Cloud, guides, US ticker directory) are not part of this fork:
    // the files stay for easier upstream merges, the routes go home. Temporary, so a page can come back without stale browser caches.
    async redirects() {
        return ['/about', '/help', '/api-docs', '/sponsor', '/love', '/changelog', '/whats-new', '/compare', '/compare/:slug', '/s', '/s/:ticker']
            .map((source) => ({ source, destination: '/', permanent: false }));
    },
    turbopack: {
        root: process.cwd(),
    },
    // No remote images: every next/image src is a local file. Allowing a public upload host here (i.ibb.co was)
    // lets anyone feed files to the image optimizer on self-hosted servers.
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

export default withNextIntl(nextConfig);
