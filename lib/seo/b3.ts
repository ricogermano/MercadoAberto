import ptMessages from '@/messages/pt.json';
import { toMessageKey } from '@/i18n/config';
import { getMarket } from '@/lib/markets';

// Public B3 stock pages (/acoes, /acoes/petr4): the stocks of the Brazil dashboard, so the public pages and the app cover the same list.

export type B3Stock = { symbol: string; ticker: string; name: string; sector: string };
export type B3Sector = { title: string; stocks: B3Stock[] };

const groupNames = ptMessages.Markets.groups as Record<string, string>;

export const B3_SECTORS: B3Sector[] = getMarket('br').groups.map((group) => {
    const title = groupNames[toMessageKey(group.title)] ?? group.title;
    return { title, stocks: group.symbols.map(([symbol, name]) => ({ symbol, ticker: symbol.split(':').pop() ?? symbol, name, sector: title })) };
});

// A stock listed in two groups keeps its first
const BY_TICKER = new Map<string, B3Stock>();
for (const stock of B3_SECTORS.flatMap((s) => s.stocks)) if (!BY_TICKER.has(stock.ticker)) BY_TICKER.set(stock.ticker, stock);

export const B3_STOCKS: B3Stock[] = [...BY_TICKER.values()];

export const findB3Stock = (raw: string): B3Stock | undefined => BY_TICKER.get(raw.trim().toUpperCase());

// Lower case, the usual form of a URL; the lookup takes either case
export const b3Path = (ticker: string) => `/acoes/${ticker.toLowerCase()}`;

export const sectorPeers = (stock: B3Stock): B3Stock[] =>
    B3_SECTORS.find((s) => s.title === stock.sector)?.stocks.filter((s) => s.ticker !== stock.ticker) ?? [];
