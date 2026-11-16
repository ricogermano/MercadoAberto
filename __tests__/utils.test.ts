import { describe, it, expect } from 'vitest';
import {
    formatSymbolForTradingView,
    isChartEmbeddable,
    formatNumber,
} from '@/lib/utils';

describe('formatSymbolForTradingView', () => {
    it('returns empty string for empty input', () => {
        expect(formatSymbolForTradingView('')).toBe('');
    });

    it('returns uppercase US symbol as-is', () => {
        expect(formatSymbolForTradingView('AAPL')).toBe('AAPL');
        expect(formatSymbolForTradingView('aapl')).toBe('AAPL');
    });

    // Asia-Pacific exchanges
    it('maps Taiwan (.TW) to TWSE prefix', () => {
        expect(formatSymbolForTradingView('2330.TW')).toBe('TWSE:2330');
    });

    it('maps Taiwan OTC (.TWO) to TPEX prefix', () => {
        expect(formatSymbolForTradingView('6488.TWO')).toBe('TPEX:6488');
    });

    it('maps Tokyo (.T) to TSE prefix', () => {
        expect(formatSymbolForTradingView('7203.T')).toBe('TSE:7203');
    });

    it('maps Hong Kong (.HK) to HKEX prefix', () => {
        // TradingView drops Finnhub's zero padding: HKEX:0700 is an invalid symbol there
        expect(formatSymbolForTradingView('0700.HK')).toBe('HKEX:700');
    });

    it('maps Shanghai (.SS) to SSE prefix', () => {
        expect(formatSymbolForTradingView('600519.SS')).toBe('SSE:600519');
    });

    it('maps Shenzhen (.SZ) to SZSE prefix', () => {
        expect(formatSymbolForTradingView('000858.SZ')).toBe('SZSE:000858');
    });

    it('maps Korea (.KS) to KRX prefix', () => {
        expect(formatSymbolForTradingView('005930.KS')).toBe('KRX:005930');
    });

    it('charts India NSE (.NS) listings on BSE, since NSE is blocked in free TradingView embeds', () => {
        expect(formatSymbolForTradingView('RELIANCE.NS')).toBe('BSE:RELIANCE');
    });

    it('maps India BSE (.BO) to BSE prefix', () => {
        expect(formatSymbolForTradingView('RELIANCE.BO')).toBe('BSE:RELIANCE');
    });

    it('spells Indian tickers with - or & the way TradingView does (#113)', () => {
        expect(formatSymbolForTradingView('BAJAJ-AUTO.NS')).toBe('BSE:BAJAJ_AUTO');
        expect(formatSymbolForTradingView('M&M.NS')).toBe('BSE:M_M');
        expect(formatSymbolForTradingView('M&MFIN.BO')).toBe('BSE:M_MFIN');
    });

    it('maps Australia (.AX) to ASX prefix', () => {
        expect(formatSymbolForTradingView('BHP.AX')).toBe('ASX:BHP');
    });

    it('maps Singapore (.SI) to SGX prefix', () => {
        expect(formatSymbolForTradingView('D05.SI')).toBe('SGX:D05');
    });

    // European exchanges
    it('maps London (.L) to LSE prefix', () => {
        expect(formatSymbolForTradingView('SHEL.L')).toBe('LSE:SHEL');
        expect(formatSymbolForTradingView('BT-A.L')).toBe('LSE:BT.A');
    });

    it('maps Germany/Xetra (.DE) to XETR prefix', () => {
        expect(formatSymbolForTradingView('SAP.DE')).toBe('XETR:SAP');
    });

    it('maps Paris (.PA) to EURONEXT prefix', () => {
        expect(formatSymbolForTradingView('MC.PA')).toBe('EURONEXT:MC');
    });

    it('maps Amsterdam (.AS) to EURONEXT prefix', () => {
        expect(formatSymbolForTradingView('ASML.AS')).toBe('EURONEXT:ASML');
    });

    it('maps Milan (.MI) to MIL prefix', () => {
        expect(formatSymbolForTradingView('ENI.MI')).toBe('MIL:ENI');
    });

    it('maps Madrid (.MC) to BME prefix', () => {
        expect(formatSymbolForTradingView('SAN.MC')).toBe('BME:SAN');
    });

    it('maps Swiss (.SW) to SIX prefix', () => {
        expect(formatSymbolForTradingView('NESN.SW')).toBe('SIX:NESN');
    });

    it('maps Stockholm (.ST) to OMXSTO prefix', () => {
        expect(formatSymbolForTradingView('ERIC-B.ST')).toBe('OMXSTO:ERIC_B');
        expect(formatSymbolForTradingView('NOVO-B.CO')).toBe('OMXCOP:NOVO_B');
    });

    // Americas
    it('maps Toronto (.TO) to TSX prefix', () => {
        expect(formatSymbolForTradingView('RY.TO')).toBe('TSX:RY');
        expect(formatSymbolForTradingView('RCI-B.TO')).toBe('TSX:RCI-B');
    });

    it('maps Brazil (.SA) to BMFBOVESPA prefix', () => {
        expect(formatSymbolForTradingView('VALE3.SA')).toBe('BMFBOVESPA:VALE3');
    });

    // Middle East & Africa
    it('maps Tel Aviv (.TA) to TASE prefix', () => {
        expect(formatSymbolForTradingView('TEVA.TA')).toBe('TASE:TEVA');
    });

    it('maps Johannesburg (.JO) to JSE prefix', () => {
        expect(formatSymbolForTradingView('NPN.JO')).toBe('JSE:NPN');
    });

    // Case insensitivity
    it('handles lowercase input', () => {
        expect(formatSymbolForTradingView('2330.tw')).toBe('TWSE:2330');
        expect(formatSymbolForTradingView('shel.l')).toBe('LSE:SHEL');
    });

    // Longer suffix matched before shorter (.TWO before .TW)
    it('prioritizes longer suffixes over shorter ones', () => {
        // .TWO should match before .TW
        expect(formatSymbolForTradingView('6488.TWO')).toBe('TPEX:6488');
        // But .TW still works for regular TW symbols
        expect(formatSymbolForTradingView('2330.TW')).toBe('TWSE:2330');
    });
});

describe('formatNumber', () => {
    // Finnhub's profile2 marketCapitalization is expressed in millions of USD,
    // which formatNumber scales up by 1e6.
    it('formats market caps (input in millions) into T/B/M/K suffixes', () => {
        expect(formatNumber(3_000_000)).toBe('3.00T'); // 3,000,000M => $3T
        expect(formatNumber(150_000)).toBe('150.00B'); // 150,000M => $150B
        expect(formatNumber(150)).toBe('150.00M'); // 150M => $150M
    });

    it('returns N/A for missing or non-finite market caps', () => {
        // Finnhub omits marketCapitalization for many symbols (e.g. ETFs); the
        // watchlist passes that value straight through, so it must not render "NaN".
        expect(formatNumber(undefined)).toBe('N/A');
        expect(formatNumber(null)).toBe('N/A');
        expect(formatNumber(NaN)).toBe('N/A');
        expect(formatNumber(Infinity)).toBe('N/A');
    });
});

describe('isChartEmbeddable', () => {
    it('allows exchanges whose candle chart TradingView embeds', () => {
        for (const s of ['AAPL', 'BINANCE:BTCUSDT', 'BSE:RELIANCE', 'XETR:SAP', 'TSX:SHOP', 'PSECZ:CEZ']) expect(isChartEmbeddable(s)).toBe(true);
    });

    it('flags exchanges TradingView refuses in free embeds', () => {
        for (const s of ['TSE:7203', 'HKEX:700', 'LSE:VOD', 'KRX:005930']) expect(isChartEmbeddable(s)).toBe(false);
    });

    it('maps Prague to PSECZ, not the Philippine PSE', () => {
        expect(formatSymbolForTradingView('CEZ.PR')).toBe('PSECZ:CEZ');
    });
});
