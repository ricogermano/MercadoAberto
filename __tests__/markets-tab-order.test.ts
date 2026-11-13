import { describe, expect, it } from 'vitest';
import { MARKETS, marketsInTabOrder, type MarketId } from '@/lib/markets';
import pt from '@/messages/pt.json';

describe('marketsInTabOrder', () => {
    it('puts Brazil and the US first, countries by translated name, then commodities, forex and crypto', () => {
        const names = pt.Markets.names as Record<MarketId, string>;
        const ids = marketsInTabOrder((id) => names[id], 'pt').map((m) => m.id);
        expect(ids).toEqual(['br', 'us', 'de', 'sa', 'au', 'ca', 'in', 'pl', 'cmd', 'fx', 'crypto']);
        expect(ids).toHaveLength(MARKETS.length);
    });
});
