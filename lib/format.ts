// Numbers follow the interface language: "172.457,77" in Portuguese, "172,457.77" in English.
// Arabic keeps Western digits and English separators, as the rest of the app does.
const NUMBER_LOCALES: Record<string, string> = { pt: 'pt-BR', pl: 'pl-PL' };
export const numberLocale = (locale?: string | null) => (locale && NUMBER_LOCALES[locale]) || 'en-US';

const cache = new Map<string, Intl.NumberFormat>();
const formatter = (locale: string | undefined, key: string, options: Intl.NumberFormatOptions) => {
    const tag = numberLocale(locale);
    const id = `${tag}|${key}`;
    let found = cache.get(id);
    if (!found) cache.set(id, (found = new Intl.NumberFormat(tag, options)));
    return found;
};

export const formatDecimal = (value: number, locale?: string, min = 2, max = Math.max(min, 2)) =>
    formatter(locale, `d${min}-${max}`, { minimumFractionDigits: min, maximumFractionDigits: max }).format(value);

// "+1,25" / "-0,40": the plus is written out, so the direction never depends on colour
export const formatSigned = (value: number, locale?: string, digits = 2) =>
    `${value > 0 ? '+' : ''}${formatDecimal(value, locale, digits, digits)}`;

export const formatPercent = (value: number, locale?: string, digits = 2) => `${formatDecimal(value, locale, digits, digits)}%`;

// "1,2 mi", "3,4 bi" in Portuguese; "1.2M", "3.4B" in English
export const formatCompact = (value: number, locale?: string, digits = 1) =>
    formatter(locale, `c${digits}`, { notation: 'compact', maximumFractionDigits: digits }).format(value);
