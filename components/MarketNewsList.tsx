'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { htmlLang } from '@/i18n/config';
import type { NewsItem } from '@/lib/rss';

// "2 h ago" in the interface language. Computed after mount, so the server and first client render agree.
function ago(publishedAt: number, now: number, locale: string) {
    const rtf = new Intl.RelativeTimeFormat(htmlLang(locale), { numeric: 'always', style: 'short' });
    const minutes = Math.max(0, Math.round((now - publishedAt) / 60_000));
    if (minutes < 60) return rtf.format(-Math.max(1, minutes), 'minute');
    if (minutes < 60 * 24) return rtf.format(-Math.round(minutes / 60), 'hour');
    return rtf.format(-Math.round(minutes / (60 * 24)), 'day');
}

export default function MarketNewsList({ items, sources, unavailable }: { items: NewsItem[]; sources: string[]; unavailable: string }) {
    const t = useTranslations('MarketNews');
    const locale = useLocale();
    const [now, setNow] = useState<number | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [onlyTable, setOnlyTable] = useState(false);
    useEffect(() => setNow(Date.now()), []);

    if (items.length === 0) return <p className="search-list-indicator">{unavailable}</p>;

    const filtered = items.filter((i) => (selected.length === 0 || selected.includes(i.source)) && (!onlyTable || i.tickers.length > 0));
    const filtering = selected.length > 0 || onlyTable;
    const toggle = (source: string) => setSelected((cur) => (cur.includes(source) ? cur.filter((s) => s !== source) : [...cur, source]));
    const clear = () => {
        setSelected([]);
        setOnlyTable(false);
    };
    const chip = (active: boolean) => `pill h-7 cursor-pointer px-3 text-[12px] ${active ? 'is-up' : 'hover:bg-hover hover:text-foreground'}`;

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line/60 px-3 py-2" role="group" aria-label={t('sourcesLabel')}>
                {sources.map((source) => (
                    <button key={source} type="button" className={chip(selected.includes(source))} aria-pressed={selected.includes(source)} onClick={() => toggle(source)}>
                        {source}
                    </button>
                ))}
                {items.some((i) => i.tickers.length > 0) && (
                    <button type="button" className={chip(onlyTable)} aria-pressed={onlyTable} onClick={() => setOnlyTable((v) => !v)}>
                        {t('onlyTable')}
                    </button>
                )}
                {/* Kept in the layout while no filter is active so the chips don't shift */}
                <button
                    type="button"
                    onClick={clear}
                    className={`ms-auto text-[11.5px] text-faint hover:text-brand-ink ${filtering ? '' : 'invisible'}`}
                    tabIndex={filtering ? 0 : -1}
                    aria-hidden={!filtering}
                >
                    {t('clearFilters')}
                </button>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                        <p className="search-list-indicator">{t('noMatch')}</p>
                        <button type="button" onClick={clear} className="text-[12.5px] text-faint hover:text-brand-ink">{t('clearFilters')}</button>
                    </div>
                ) : (
                    <ul>
                        {filtered.map((item) => (
                            <li key={item.link} className="border-t border-line/60 px-3 py-2.5 first:border-t-0">
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-semibold hover:text-brand-ink">
                                    {item.title}
                                </a>
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-faint">
                                    <span>{item.source}</span>
                                    {now !== null && <span aria-hidden>·</span>}
                                    {now !== null && <span>{ago(item.publishedAt, now, locale)}</span>}
                                    {item.tickers.map((symbol) => (
                                        <Link key={symbol} href={`/stocks/${symbol}`} className="pill mono h-5 px-2 text-[11px] hover:bg-hover hover:text-foreground">
                                            {symbol.replace(/\.SA$/, '')}
                                        </Link>
                                    ))}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <p className="border-t border-line/60 px-3 py-2 text-[11.5px] text-faint">{t('footnote', { sources: sources.join(', ') })}</p>
        </div>
    );
}
