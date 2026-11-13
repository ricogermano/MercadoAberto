// Headlines from news RSS / Atom feeds, without a dependency. Pure functions, covered by tests; the network call lives in
// lib/actions/news.actions.ts. Only titles, links and dates are read: never the article text.

import { yahooAppSymbol } from '@/lib/yahoo';

export type RssItem = { title: string; link: string; publishedAt: number | null };
export type NewsItem = { title: string; link: string; source: string; publishedAt: number; tickers: string[] };

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', bull: '•', middot: '·',
};

const decodeEntities = (text: string) =>
    text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec?: string, hex?: string, name?: string) => {
        const code = dec ? Number(dec) : hex ? parseInt(hex, 16) : null;
        if (code !== null) return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        return NAMED_ENTITIES[name!.toLowerCase()] ?? match;
    });

// Plain text of a tag's content: CDATA unwrapped, markup stripped, entities decoded, whitespace collapsed
const toText = (raw: string) =>
    decodeEntities(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const tagContent = (block: string, tag: string) => {
    const match = block.match(new RegExp(`<${tag.replace(':', '\\:')}\\b[^>]*>([\\s\\S]*?)</${tag.replace(':', '\\:')}>`, 'i'));
    return match ? toText(match[1]) : '';
};

const isHttp = (url: string) => /^https?:\/\/\S+$/i.test(url);

// RSS <link>url</link>, else Atom <link href="url"/> (the alternate one when there are several), else a URL-shaped <guid>
function linkOf(block: string): string {
    const text = block.match(/<link\b(?![^>]*\/>)[^>]*>([\s\S]*?)<\/link>/i);
    if (text && isHttp(toText(text[1]))) return toText(text[1]);
    const hrefs = [...block.matchAll(/<link\b[^>]*>/gi)].map((m) => ({
        href: m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? '',
        rel: m[0].match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? 'alternate',
    }));
    const href = (hrefs.find((h) => h.rel === 'alternate' && isHttp(h.href)) ?? hrefs.find((h) => isHttp(h.href)))?.href;
    if (href) return decodeEntities(href);
    const guid = tagContent(block, 'guid');
    return isHttp(guid) ? guid : '';
}

// RFC 822 ("Thu, 12 Nov 2026 20:03:07 -0300") and ISO 8601 both go through Date.parse. An ISO time with no zone ("2026-11-12T20:03:07",
// as Exame sends) would be read in the server's zone, so it is read in `naiveOffset` instead (Brasília, for the Brazilian feeds).
function dateOf(block: string, naiveOffset: string): number | null {
    for (const tag of ['pubDate', 'dc:date', 'published', 'updated']) {
        let value = tagContent(block, tag);
        if (!value) continue;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)) value += naiveOffset;
        const time = Date.parse(value);
        if (Number.isFinite(time)) return time;
    }
    return null;
}

export function parseRss(xml: string, naiveOffset = '-03:00'): RssItem[] {
    if (typeof xml !== 'string') return [];
    const items: RssItem[] = [];
    try {
        for (const match of xml.matchAll(/<(item|entry)\b[^>]*>[\s\S]*?<\/\1>/gi)) {
            const block = match[0];
            const title = tagContent(block, 'title');
            const link = linkOf(block);
            if (!title || !link) continue;
            items.push({ title, link, publishedAt: dateOf(block, naiveOffset) });
        }
    } catch {
        return items;
    }
    return items;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Letters, digits and accents: a "word" for the whole-word checks below (\b misbehaves around accented letters)
const WORD = '[0-9A-Za-zÀ-ÿ]';

// App symbols ("PETR4.SA", as the stock pages spell them) of the companies a headline mentions, at most `max`. The ticker code (PETR4) matches as a whole word,
// any case; the company name as a whole word, exact case and accents ("vale a pena" is not Vale, though a sentence starting with
// "Vale" will match).
export function tagTickers(title: string, symbols: [tvSymbol: string, name: string][], max = 3): string[] {
    const found: string[] = [];
    for (const [tvSymbol, name] of symbols) {
        const code = tvSymbol.split(':').pop() ?? '';
        const whole = (word: string, flags: string) => new RegExp(`(?<!${WORD})${escapeRegExp(word)}(?!${WORD})`, flags).test(title);
        if ((code && whole(code, 'i')) || (name && whole(name, ''))) {
            const app = yahooAppSymbol(tvSymbol);
            if (app && !found.includes(app)) found.push(app);
            if (found.length >= max) break;
        }
    }
    return found;
}

const normalisedTitle = (title: string) => title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// True when the headline mentions one of the words or phrases, as whole words, ignoring case and accents ("Dólar" matches "dolar")
export function matchesKeywords(title: string, keywords: string[]): boolean {
    const text = ` ${normalisedTitle(title)} `;
    return keywords.some((k) => text.includes(` ${normalisedTitle(k)} `));
}

// Merges the per-source items into one newest-first list: at most `perSource` newest items from each source (so the 100-item
// feeds don't crowd out the others), dropping undated items, anything older than `maxAgeMs` or dated more than an hour ahead,
// and duplicates by link or by normalised title; capped to `limit`.
export function mergeNews(
    sources: { source: string; items: RssItem[]; tickersOf?: (title: string) => string[] }[],
    now = Date.now(),
    { perSource = 12, maxAgeMs = 3 * 86_400_000, limit = 60 } = {},
): NewsItem[] {
    const candidates: NewsItem[] = [];
    for (const { source, items, tickersOf } of sources) {
        items
            .flatMap((item) => (item.publishedAt !== null && item.publishedAt >= now - maxAgeMs && item.publishedAt <= now + 3_600_000 ? [{ ...item, publishedAt: item.publishedAt }] : []))
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, perSource)
            .forEach((item) => candidates.push({ title: item.title, link: item.link, source, publishedAt: item.publishedAt, tickers: tickersOf?.(item.title) ?? [] }));
    }
    candidates.sort((a, b) => b.publishedAt - a.publishedAt);
    const links = new Set<string>();
    const titles = new Set<string>();
    const out: NewsItem[] = [];
    for (const item of candidates) {
        const key = normalisedTitle(item.title);
        if (links.has(item.link) || titles.has(key)) continue;
        links.add(item.link);
        titles.add(key);
        out.push(item);
        if (out.length >= limit) break;
    }
    return out;
}

export type WatchNewsItem = { title: string; link: string; source: string; publishedAt: number; tag: string; origin: 'local' | 'world'; watched: boolean };

type WorldArticle = { headline: string; url: string; source: string; datetime: number; related?: string; category?: string };

// One newest-first list for the watchlist: the world articles (Finnhub, `datetime` in seconds) with the local portal headlines.
// Every local headline that mentions a watched symbol is kept; the rest fill up to `localLimit`. `watched` marks what is about
// a symbol the reader follows; `tag` is that symbol (or the first company mentioned), '' when the story is general.
export function mergeWatchlistNews(world: WorldArticle[], local: NewsItem[], watchedSymbols: string[], { localLimit = 30 } = {}): WatchNewsItem[] {
    const watching = new Set(watchedSymbols.map((s) => s.trim().toUpperCase()));
    const locals = local.map((item): WatchNewsItem => {
        const mine = item.tickers.find((t) => watching.has(t.toUpperCase()));
        return { title: item.title, link: item.link, source: item.source, publishedAt: item.publishedAt, tag: mine ?? item.tickers[0] ?? '', origin: 'local', watched: Boolean(mine) };
    });
    const room = Math.max(0, localLimit - locals.filter((i) => i.watched).length);
    let general = 0;
    const keptLocals = locals.filter((i) => i.watched || general++ < room);
    const worlds = world.map((a): WatchNewsItem => ({
        title: a.headline, link: a.url, source: a.source, publishedAt: (a.datetime || 0) * 1000, tag: a.related ?? '', origin: 'world', watched: a.category === 'company',
    }));
    const seen = new Set<string>();
    return [...worlds, ...keptLocals]
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .filter((i) => (seen.has(i.link) ? false : (seen.add(i.link), true)));
}
