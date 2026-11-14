import { describe, expect, it } from 'vitest';
import { formatCompact, formatDecimal, formatPercent, formatSigned, numberLocale } from '@/lib/format';
import { formatNumber, formatPrice } from '@/lib/utils';

// Intl separates the currency sign with a no-break space
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('number formats by interface language', () => {
    it('maps the interface language to a number format', () => {
        expect(numberLocale('pt')).toBe('pt-BR');
        expect(numberLocale('en')).toBe('en-US');
        expect(numberLocale('ar')).toBe('en-US');
        expect(numberLocale(undefined)).toBe('en-US');
    });

    it('writes decimals the Brazilian way in Portuguese', () => {
        expect(formatDecimal(172457.77, 'pt')).toBe('172.457,77');
        expect(formatDecimal(172457.77, 'en')).toBe('172,457.77');
        expect(formatDecimal(172457.77)).toBe('172,457.77');
    });

    it('keeps the sign on changes', () => {
        expect(formatSigned(1133.45, 'pt')).toBe('+1.133,45');
        expect(formatSigned(-0.4, 'pt')).toBe('-0,40');
        expect(formatSigned(0, 'pt')).toBe('0,00');
    });

    it('formats percentages and short forms', () => {
        expect(formatPercent(1.342, 'pt')).toBe('1,34%');
        expect(formatPercent(12.06, 'pt', 1)).toBe('12,1%');
        expect(plain(formatCompact(1_250_000, 'pt'))).toBe('1,3 mi');
        expect(formatCompact(1_250_000, 'en')).toBe('1.3M');
    });

    it('formats prices and market values in the chosen language', () => {
        expect(plain(formatPrice(44.7, 'BRL', 'pt'))).toBe('R$ 44,70');
        expect(formatPrice(44.7, 'USD')).toBe('$44.70');
        expect(plain(formatNumber(3_450_000, 'N/A', 'pt'))).toBe('3,45 tri');
        expect(formatNumber(3_450_000)).toBe('3.45T');
    });
});
