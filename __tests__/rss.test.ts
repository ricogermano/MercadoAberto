import { describe, expect, it } from 'vitest';
import { matchesKeywords, mergeNews, mergeWatchlistNews, parseRss, tagTickers, type RssItem } from '@/lib/rss';

describe('parseRss', () => {
    it('reads RSS items with CDATA, entities, markup and RFC 822 dates', () => {
        const xml = `<rss><channel><title>Feed</title>
          <item><title><![CDATA[Petrobras &amp; Vale: &#8220;lucro&#8221; sobe <b>10%</b>]]></title><link>https://a.com/1</link>
            <pubDate>Thu, 12 Nov 2026 20:03:07 -0300</pubDate></item>
          <item><title>Ibovespa &#x201C;fecha&#x201D; em alta &quot;hoje&quot;</title><link>https://a.com/2</link><dc:date>2026-11-12T10:00:00Z</dc:date></item>
        </channel></rss>`;
        const items = parseRss(xml);
        expect(items).toHaveLength(2);
        expect(items[0].title).toBe('Petrobras & Vale: “lucro” sobe 10%');
        expect(items[0].publishedAt).toBe(Date.parse('2026-11-12T23:03:07Z'));
        expect(items[1].title).toBe('Ibovespa “fecha” em alta "hoje"');
        expect(items[1].publishedAt).toBe(Date.parse('2026-11-12T10:00:00Z'));
    });

    it('reads a zone-less ISO date as Brasília time', () => {
        const [item] = parseRss('<item><title>T</title><link>https://a.com/x</link><pubDate>2026-11-12T20:03:07</pubDate></item>');
        expect(item.publishedAt).toBe(Date.parse('2026-11-12T23:03:07Z'));
    });

    it('reads Atom entries', () => {
        const xml = `<feed><entry><title type="html">Dólar sobe</title><link rel="self" href="https://a.com/self"/><link rel="alternate" href="https://a.com/dolar"/><updated>2026-11-12T10:00:00-03:00</updated></entry></feed>`;
        expect(parseRss(xml)).toEqual([{ title: 'Dólar sobe', link: 'https://a.com/dolar', publishedAt: Date.parse('2026-11-12T13:00:00Z') }]);
    });

    it('skips items without a title or an http(s) link, and never throws on garbage', () => {
        expect(parseRss('<item><link>https://a.com</link></item><item><title>x</title><link>javascript:alert(1)</link></item>')).toEqual([]);
        expect(parseRss('<item><title>Sem data</title><link>https://a.com/1</link></item>')[0].publishedAt).toBeNull();
        expect(parseRss('')).toEqual([]);
        expect(parseRss('<item><title>unclosed')).toEqual([]);
        expect(parseRss(null as unknown as string)).toEqual([]);
        expect(parseRss('{"not":"xml"}')).toEqual([]);
    });
});

describe('tagTickers', () => {
    const symbols: [string, string][] = [['BMFBOVESPA:PETR4', 'Petrobras'], ['BMFBOVESPA:VALE3', 'Vale'], ['BMFBOVESPA:ABEV3', 'Ambev'], ['BMFBOVESPA:ITUB4', 'Itaú Unibanco'], ['BMFBOVESPA:IBOV', 'Ibovespa']];

    it('matches ticker codes in any case and company names as whole words', () => {
        expect(tagTickers('petr4 e VALE3 em alta', symbols)).toEqual(['PETR4.SA', 'VALE3.SA']);
        expect(tagTickers('Petrobras anuncia dividendos', symbols)).toEqual(['PETR4.SA']);
        expect(tagTickers('Itaú Unibanco lucra mais', symbols)).toEqual(['ITUB4.SA']);
    });

    it('is case- and accent-sensitive for names, and ignores partial words', () => {
        expect(tagTickers('vale a pena investir?', symbols)).toEqual([]);
        expect(tagTickers('Itau Unibanco', symbols)).toEqual([]);
        expect(tagTickers('PETR41 e Ambevx', symbols)).toEqual([]);
    });

    it('skips indices and caps the result', () => {
        expect(tagTickers('IBOV sobe', symbols)).toEqual([]);
        expect(tagTickers('PETR4 VALE3 ABEV3 ITUB4', symbols)).toHaveLength(3);
    });
});

describe('mergeNews', () => {
    const now = Date.parse('2026-11-13T12:00:00Z');
    const hoursAgo = (h: number) => now - h * 3_600_000;
    const item = (title: string, link: string, publishedAt: number | null): RssItem => ({ title, link, publishedAt });

    it('merges newest first and drops old, future and undated items', () => {
        const out = mergeNews([
            { source: 'A', items: [item('Velha', 'https://a/1', hoursAgo(80)), item('Futura', 'https://a/2', now + 5 * 3_600_000), item('Sem data', 'https://a/3', null), item('Boa A', 'https://a/4', hoursAgo(2))] },
            { source: 'B', items: [item('Boa B', 'https://b/1', hoursAgo(1))] },
        ], now);
        expect(out.map((i) => i.title)).toEqual(['Boa B', 'Boa A']);
        expect(out[0].source).toBe('B');
    });

    it('dedupes by link and by normalised title, keeping the newest', () => {
        const out = mergeNews([
            { source: 'A', items: [item('Dólar sobe!', 'https://a/1', hoursAgo(3))] },
            { source: 'B', items: [item('DOLAR SOBE', 'https://b/1', hoursAgo(1)), item('Outra', 'https://a/1', hoursAgo(2)), item('Terceira', 'https://a/1', hoursAgo(4))] },
        ], now);
        // 'Dólar sobe!' repeats B's title; 'Terceira' repeats the link of the newer 'Outra'
        expect(out.map((i) => i.title)).toEqual(['DOLAR SOBE', 'Outra']);
    });

    it('caps each source and the total, and tags tickers', () => {
        const many = Array.from({ length: 30 }, (_, i) => item(`Titulo ${i}`, `https://a/${i}`, hoursAgo(i * 0.5 + 1)));
        expect(mergeNews([{ source: 'A', items: many }], now)).toHaveLength(12);
        expect(mergeNews([{ source: 'A', items: many }], now, { perSource: 30, limit: 5 })).toHaveLength(5);
        const tagged = mergeNews([{ source: 'A', items: [item('PETR4 sobe', 'https://a/x', hoursAgo(1))], tickersOf: () => ['PETR4.SA'] }], now);
        expect(tagged[0].tickers).toEqual(['PETR4.SA']);
    });
});

describe('matchesKeywords', () => {
    const words = ['dólar', 'Banco Central', 'Fed', 'euro'];
    it('ignores case and accents and matches phrases', () => {
        expect(matchesKeywords('DOLAR fecha em alta', words)).toBe(true);
        expect(matchesKeywords('Decisão do banco central: o que esperar', words)).toBe(true);
    });
    it('matches whole words only', () => {
        expect(matchesKeywords('Federação critica medida', words)).toBe(false);
        expect(matchesKeywords('Eurofarma compra rival', words)).toBe(false);
        expect(matchesKeywords('Petrobras sobe 2%', words)).toBe(false);
    });
});

describe('mergeWatchlistNews', () => {
    const local = (title: string, link: string, publishedAt: number, tickers: string[] = []) => ({ title, link, source: 'Portal', publishedAt, tickers });
    const world = (headline: string, url: string, seconds: number, category = 'company', related = 'AAPL') => ({ headline, url, source: 'Wire', datetime: seconds, category, related });

    it('interleaves both origins newest first and marks what is about a followed symbol', () => {
        const out = mergeWatchlistNews(
            [world('Apple', 'https://w/1', 2000), world('Macro', 'https://w/2', 500, 'general', '')],
            [local('Petrobras sobe', 'https://l/1', 3_000_000, ['VALE3.SA', 'PETR4.SA']), local('Bolsa cai', 'https://l/2', 1_000_000)],
            ['petr4.sa', 'AAPL'],
        );
        expect(out.map((i) => i.title)).toEqual(['Petrobras sobe', 'Apple', 'Bolsa cai', 'Macro']);
        expect(out.map((i) => i.origin)).toEqual(['local', 'world', 'local', 'world']);
        expect(out.map((i) => i.watched)).toEqual([true, true, false, false]);
        expect(out.map((i) => i.tag)).toEqual(['PETR4.SA', 'AAPL', '', '']);
    });

    it('caps the general local headlines but never drops one about a followed symbol, and dedupes by link', () => {
        const many = Array.from({ length: 10 }, (_, i) => local(`Geral ${i}`, `https://l/${i}`, 10_000 - i));
        const out = mergeWatchlistNews([world('Igual', 'https://l/0', 1)], [...many, local('ITUB4 antiga', 'https://l/x', 1, ['ITUB4.SA'])], ['ITUB4.SA'], { localLimit: 4 });
        expect(out.filter((i) => i.origin === 'local')).toHaveLength(4);
        expect(out.some((i) => i.title === 'ITUB4 antiga')).toBe(true);
        expect(out.filter((i) => i.link === 'https://l/0')).toHaveLength(1);
    });
});
