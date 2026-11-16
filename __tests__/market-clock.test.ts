import { describe, expect, it } from 'vitest';

import { getMarket, hasFinnhubCompanyData, hasFinnhubQuotes, isMarketOpen } from '@/lib/markets';

describe('markets', () => {
    it('knows which symbols Finnhub free can price', () => {
        expect(hasFinnhubQuotes('AAPL')).toBe(true);
        expect(hasFinnhubQuotes('BRK.B')).toBe(true);
        expect(hasFinnhubQuotes('BINANCE:BTCUSDT')).toBe(true);
        expect(hasFinnhubQuotes('RELIANCE.NS')).toBe(false);
        expect(hasFinnhubQuotes('BARC.L')).toBe(false);
        expect(hasFinnhubQuotes('7203.T')).toBe(false);
        expect(hasFinnhubQuotes('2222.SR')).toBe(false);
        expect(hasFinnhubQuotes('PKN.WA')).toBe(false);
        expect(hasFinnhubQuotes('FX:EURUSD')).toBe(false);    });

    it('asks Finnhub for company data only where it has some', () => {
        expect(hasFinnhubCompanyData('AAPL')).toBe(true);
        expect(hasFinnhubCompanyData('BINANCE:BTCUSDT')).toBe(false);
        expect(hasFinnhubCompanyData('2222.SR')).toBe(false);
        expect(hasFinnhubCompanyData('PKN.WA')).toBe(false);
    });

    it('opens each market in its own time zone', () => {
        // Wed 2026-09-23 10:00 in Mumbai = 04:30 UTC
        expect(isMarketOpen(getMarket('in'), new Date('2026-09-23T04:30:00Z'))).toBe(true);
        expect(isMarketOpen(getMarket('us'), new Date('2026-09-23T04:30:00Z'))).toBe(false);
        // Saturday: stocks and FX closed, crypto open
        expect(isMarketOpen(getMarket('de'), new Date('2026-09-26T10:00:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('fx'), new Date('2026-09-26T10:00:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('crypto'), new Date('2026-09-26T10:00:00Z'))).toBe(true);
        // FX reopens Sunday 17:00 New York (21:00 UTC in September)
        expect(isMarketOpen(getMarket('fx'), new Date('2026-09-27T21:30:00Z'))).toBe(true);
        // Tadawul trades Sunday to Thursday, 10:00-15:00 Riyadh (07:00-12:00 UTC)
        expect(isMarketOpen(getMarket('sa'), new Date('2026-09-27T08:00:00Z'))).toBe(true);
        expect(isMarketOpen(getMarket('sa'), new Date('2026-09-25T08:00:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('sa'), new Date('2026-09-27T12:30:00Z'))).toBe(false);
        // GPW trades Monday to Friday, 09:00-17:00 Warsaw (07:00-15:00 UTC in September)
        expect(isMarketOpen(getMarket('pl'), new Date('2026-09-23T08:00:00Z'))).toBe(true);
        expect(isMarketOpen(getMarket('pl'), new Date('2026-09-23T15:30:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('pl'), new Date('2026-09-26T10:00:00Z'))).toBe(false);
        // B3 trades Monday to Friday, 10:00-17:00 São Paulo (13:00-20:00 UTC, no daylight saving)
        expect(isMarketOpen(getMarket('br'), new Date('2026-09-23T14:00:00Z'))).toBe(true);
        expect(isMarketOpen(getMarket('br'), new Date('2026-09-23T12:30:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('br'), new Date('2026-09-23T20:30:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('br'), new Date('2026-09-26T14:00:00Z'))).toBe(false);
    });
});
