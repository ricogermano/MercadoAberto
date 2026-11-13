import { describe, expect, it } from 'vitest';
import { median, medianSide, mediansOf } from '@/lib/medians';

describe('median', () => {
    it('takes the middle value, or the mean of the two middle ones', () => {
        expect(median([9, 1, 5])).toBe(5);
        expect(median([8, 2, 4, 6])).toBe(5);
    });

    it('ignores missing and non-finite values', () => {
        expect(median([null, 3, undefined, 1, Number.NaN, 2, Infinity])).toBe(2);
    });

    it('gives nothing for fewer than three values', () => {
        expect(median([4, 6])).toBeNull();
        expect(median([null, null, 7])).toBeNull();
    });
});

describe('mediansOf', () => {
    it('computes one median per indicator', () => {
        const rows = [{ pe: 4, roe: 10 }, { pe: 8, roe: null }, { pe: 6, roe: 20 }];
        expect(mediansOf(rows, ['pe', 'roe'] as const)).toEqual({ pe: 6, roe: null });
    });
});

describe('medianSide', () => {
    it('reads multiples and debt as better when lower', () => {
        expect(medianSide('pe', 5, 8)).toBe('better');
        expect(medianSide('pe', 12, 8)).toBe('worse');
        expect(medianSide('netDebtEbitda', -0.5, 1.2)).toBe('better');
    });

    it('reads yields, returns and growth as better when higher', () => {
        expect(medianSide('dy', 9, 6)).toBe('better');
        expect(medianSide('roe', 4, 12)).toBe('worse');
    });

    it('never calls a negative multiple better, even without a median', () => {
        expect(medianSide('pe', -3, 8)).toBe('worse');
        expect(medianSide('evEbitda', -1, null)).toBe('worse');
    });

    it('leaves payout, liquidity, ties and missing values unmarked', () => {
        expect(medianSide('payout', 90, 50)).toBeNull();
        expect(medianSide('liquidity', 1e9, 1e8)).toBeNull();
        expect(medianSide('roe', 12, 12)).toBeNull();
        expect(medianSide('roe', null, 12)).toBeNull();
        expect(medianSide('roe', 12, null)).toBeNull();
    });
});
