import { describe, expect, it } from 'vitest';
import { squarify } from '@/lib/treemap';
import { marketCapFallbackSymbol, marketCapFromTimeseries } from '@/lib/yahoo';

describe('squarify', () => {
    const box = { x: 0, y: 0, w: 600, h: 400 };
    const values = [6, 6, 4, 3, 2, 2, 1];

    it('gives every item an area proportional to its value and fills the box', () => {
        const tiles = squarify(values, (v) => v, box);
        expect(tiles).toHaveLength(values.length);
        const total = values.reduce((a, b) => a + b, 0);
        for (const { item, rect } of tiles) expect(rect.w * rect.h).toBeCloseTo((item / total) * 600 * 400, 4);
        expect(tiles.reduce((sum, { rect }) => sum + rect.w * rect.h, 0)).toBeCloseTo(600 * 400, 4);
    });

    it('keeps tiles inside the box and off each other', () => {
        const tiles = squarify(values, (v) => v, box).map((t) => t.rect);
        for (const r of tiles) {
            expect(r.x).toBeGreaterThanOrEqual(-1e-9);
            expect(r.y).toBeGreaterThanOrEqual(-1e-9);
            expect(r.x + r.w).toBeLessThanOrEqual(600 + 1e-6);
            expect(r.y + r.h).toBeLessThanOrEqual(400 + 1e-6);
        }
        for (let a = 0; a < tiles.length; a++) {
            for (let b = a + 1; b < tiles.length; b++) {
                const overlapW = Math.min(tiles[a].x + tiles[a].w, tiles[b].x + tiles[b].w) - Math.max(tiles[a].x, tiles[b].x);
                const overlapH = Math.min(tiles[a].y + tiles[a].h, tiles[b].y + tiles[b].h) - Math.max(tiles[a].y, tiles[b].y);
                expect(overlapW > 1e-6 && overlapH > 1e-6).toBe(false);
            }
        }
    });

    it('keeps tiles reasonably square', () => {
        for (const { rect } of squarify(values, (v) => v, box)) expect(Math.max(rect.w / rect.h, rect.h / rect.w)).toBeLessThan(3);
    });

    it('drops items without a positive value and survives an empty box', () => {
        expect(squarify([5, 0, -1, NaN, 5], (v) => v, box)).toHaveLength(2);
        expect(squarify([], (v: number) => v, box)).toEqual([]);
        expect(squarify([1, 2], (v) => v, { x: 0, y: 0, w: 0, h: 100 })).toEqual([]);
    });
});

describe('market value from Yahoo', () => {
    const point = (asOfDate: string, raw: number) => ({ asOfDate, currencyCode: 'BRL', reportedValue: { raw } });

    it('reads the latest trailingMarketCap', () => {
        const json = { timeseries: { result: [{ meta: { type: ['trailingMarketCap'] }, trailingMarketCap: [point('2026-11-11', 607e9), point('2025-11-11', 400e9)] }] } };
        expect(marketCapFromTimeseries(json)).toBe(607e9);
        expect(marketCapFromTimeseries({ timeseries: { result: [{ meta: { type: ['trailingMarketCap'] } }] } })).toBeNull();
        expect(marketCapFromTimeseries(null)).toBeNull();
    });

    it('sends B3 units to the common share and nothing else', () => {
        expect(marketCapFallbackSymbol('BPAC11.SA')).toBe('BPAC3.SA');
        expect(marketCapFallbackSymbol('taee11.sa')).toBe('TAEE3.SA');
        expect(marketCapFallbackSymbol('PETR4.SA')).toBeNull();
        expect(marketCapFallbackSymbol('PKN.WA')).toBeNull();
    });
});
