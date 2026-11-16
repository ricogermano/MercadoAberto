import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCompact, numberLocale } from '@/lib/format';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getDateRange = (days: number) => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    return {
        to: toDate.toISOString().split('T')[0],
        from: fromDate.toISOString().split('T')[0],
    };
};

// Check for required article fields
export const validateArticle = (article: RawNewsArticle) =>
    article.headline && article.summary && article.url && article.datetime;

export const formatArticle = (
    article: RawNewsArticle,
    isCompanyNews: boolean,
    symbol?: string,
    index: number = 0,
    // Shown when Finnhub omits the source; getNews passes the NewsSources messages
    fallbackSource: string = isCompanyNews ? 'Company News' : 'Market News'
) => ({
    id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
    headline: article.headline!.trim(),
    summary:
        article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + '...',
    source: article.source || fallbackSource,
    url: article.url!,
    datetime: article.datetime!,
    image: article.image || '',
    category: isCompanyNews ? 'company' : article.category || 'general',
    related: isCompanyNews ? symbol! : article.related || '',
});

export const formatPrice = (price: number, currency = 'USD', locale?: string) => {
    return new Intl.NumberFormat(numberLocale(locale), {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(price);
};

export function formatNumber(num?: number | null, notAvailable = 'N/A', locale?: string): string {
    // Guard against missing/invalid market caps (Finnhub omits this field for many
    // symbols, e.g. ETFs). Without this, `num * 1e6` yields NaN and renders "NaN".
    if (num === undefined || num === null || !Number.isFinite(num)) return notAvailable;

    // If number is small (likely already in millions from Finnhub), multiply by 1M to get actual value
    // Typical mega-cap is > 100B. 100B in millions is 100,000.
    // If we assume typical market cap input IS millions:
    const value = num * 1000000;

    // Outside English the short forms are the language's own: "3,45 tri", "120,5 bi"
    if (numberLocale(locale) !== 'en-US') return formatCompact(value, locale, 2);

    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toString();
}


export const getFormattedTodayDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});

/**
 * Maps Finnhub exchange suffixes to TradingView exchange prefixes.
 * Finnhub symbols use a dot-suffix convention (e.g. "2330.TW"),
 * while TradingView uses a colon-prefix convention (e.g. "TWSE:2330").
 */
const FINNHUB_TO_TRADINGVIEW_EXCHANGE: Record<string, string> = {
    // Asia-Pacific
    '.TW': 'TWSE',   // Taiwan Stock Exchange
    '.TWO': 'TPEX',  // Taiwan OTC Exchange
    '.T': 'TSE',     // Tokyo Stock Exchange
    '.HK': 'HKEX',   // Hong Kong
    '.SS': 'SSE',    // Shanghai
    '.SZ': 'SZSE',   // Shenzhen
    '.KS': 'KRX',    // Korea Exchange
    '.KQ': 'KRX',    // KOSDAQ (Korea)
    '.SI': 'SGX',    // Singapore
    '.AX': 'ASX',    // Australian Securities Exchange
    '.NZ': 'NZX',    // New Zealand
    '.BO': 'BSE',    // Bombay Stock Exchange
    '.NS': 'BSE',    // NSE listing: NSE is blocked in free TradingView embeds, the same ticker renders on BSE
    '.BK': 'SET',    // Stock Exchange of Thailand
    '.JK': 'IDX',    // Indonesia Stock Exchange
    '.KL': 'MYX',    // Bursa Malaysia

    // Europe
    '.L': 'LSE',     // London Stock Exchange
    '.IL': 'LSE',    // London (IOB international)
    '.DE': 'XETR',   // Deutsche Boerse (Xetra)
    '.F': 'FWB',     // Frankfurt Stock Exchange
    '.PA': 'EURONEXT', // Euronext Paris
    '.AS': 'EURONEXT', // Euronext Amsterdam
    '.BR': 'EURONEXT', // Euronext Brussels
    '.LS': 'EURONEXT', // Euronext Lisbon
    '.MI': 'MIL',    // Borsa Italiana (Milan)
    '.MC': 'BME',    // Bolsa de Madrid
    '.ST': 'OMXSTO', // Stockholm (Nasdaq Nordic)
    '.HE': 'OMXHEX', // Helsinki (Nasdaq Nordic)
    '.CO': 'OMXCOP', // Copenhagen (Nasdaq Nordic)
    '.OL': 'OSL',    // Oslo Stock Exchange
    '.SW': 'SIX',    // SIX Swiss Exchange
    '.VI': 'VIE',    // Vienna Stock Exchange
    '.WA': 'GPW',    // Warsaw Stock Exchange
    '.PR': 'PSECZ',  // Prague Stock Exchange (TradingView's PSE is the Philippines)
    '.AT': 'ATHEX',  // Athens Stock Exchange
    '.IS': 'BIST',   // Borsa Istanbul

    // Americas
    '.TO': 'TSX',    // Toronto Stock Exchange
    '.V': 'TSXV',    // TSX Venture Exchange
    '.SA': 'BMFBOVESPA', // B3 (Brazil)
    '.MX': 'BMV',    // Bolsa Mexicana de Valores
    '.BA': 'BCBA',   // Buenos Aires Stock Exchange

    // Middle East & Africa
    '.TA': 'TASE',   // Tel Aviv Stock Exchange
    '.JO': 'JSE',    // Johannesburg Stock Exchange
    '.SR': 'TADAWUL', // Saudi Exchange (2222.SR -> TADAWUL:2222)
};

// Exchanges whose candle chart TradingView refuses in free embeds ("This symbol doesn't exist"), each confirmed
// with two tickers. Financials, technicals and profile still work for them.
// ponytail: static list, re-test with a real browser user agent if TradingView changes its licensing.
const CHART_BLOCKED_EXCHANGES = new Set(['TSE', 'HKEX', 'LSE', 'KRX', 'TWSE', 'SGX', 'NZX', 'SET', 'MYX', 'BIST', 'TSXV', 'BMV', 'JSE', 'TADAWUL']);

export const isChartEmbeddable = (tvSymbol: string) => !CHART_BLOCKED_EXCHANGES.has(tvSymbol.split(':')[0]);

export const tradingViewSymbolUrl = (tvSymbol: string) => `https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`;

// Finnhub writes share classes and symbols with - or &; on these exchanges TradingView only knows its own spelling
// (the Finnhub one shows "This symbol doesn't exist"): BAJAJ-AUTO.NS → BSE:BAJAJ_AUTO, M&M.NS → BSE:M_M,
// ERIC-B.ST → OMXSTO:ERIC_B, NOVO-B.CO → OMXCOP:NOVO_B, BT-A.L → LSE:BT.A. TSX accepts RCI-B as is.
const TICKER_SEPARATOR: Record<string, string> = { BSE: '_', OMXSTO: '_', OMXCOP: '_', LSE: '.' };

// Listed outside the US (has a known exchange suffix like .L, .T, .NS). Class shares such as BRK.B are not.
export function isInternationalSymbol(symbol: string): boolean {
    const upper = symbol.toUpperCase();
    return Object.keys(FINNHUB_TO_TRADINGVIEW_EXCHANGE).some((suffix) => upper.endsWith(suffix.toUpperCase()));
}

export function formatSymbolForTradingView(symbol: string): string {
    if (!symbol) return '';
    const upperSymbol = symbol.toUpperCase();

    // Check for known exchange suffixes, trying longer suffixes first
    // to avoid ".TWO" matching ".TW" prematurely
    const suffixes = Object.keys(FINNHUB_TO_TRADINGVIEW_EXCHANGE)
        .sort((a, b) => b.length - a.length);

    for (const suffix of suffixes) {
        if (upperSymbol.endsWith(suffix.toUpperCase())) {
            const exchange = FINNHUB_TO_TRADINGVIEW_EXCHANGE[suffix];
            let ticker = upperSymbol.slice(0, -suffix.length);
            // Finnhub pads Hong Kong codes (0700.HK); TradingView doesn't (HKEX:700)
            if (exchange === 'HKEX') ticker = ticker.replace(/^0+(?=\d)/, '');
            if (TICKER_SEPARATOR[exchange]) ticker = ticker.replace(/[-&]/g, TICKER_SEPARATOR[exchange]);
            return `${exchange}:${ticker}`;
        }
    }

    return upperSymbol;
}

// For values interpolated into email HTML
export const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// The welcome intro is AI output from a prompt that includes sign-up fields, so it is untrusted HTML.
// Keep its text and plain <strong>, drop every other tag (links, images, styles), and wrap it ourselves.
export const sanitizeEmailIntro = (html: string) => {
    const text = html
        .replace(/<strong\b[^>]*>/gi, '<strong>') // keep the emphasis balanced, drop its attributes
        .replace(/<(?!\/?strong>)[^>]*>/gi, '')
        .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .trim();
    const safe = escapeHtml(text).replace(/&lt;(\/?)strong&gt;/gi, '<$1strong>');
    return `<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">${safe}</p>`;
};
