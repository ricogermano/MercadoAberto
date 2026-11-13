import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@/i18n/config';

// Saved choice first, then Portuguese. The browser's Accept-Language is ignored on purpose: the product is
// Brazilian, and many Brazilian browsers are set to English.
export async function resolveLocale(): Promise<Locale> {
    const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(saved) ? saved : DEFAULT_LOCALE;
}
