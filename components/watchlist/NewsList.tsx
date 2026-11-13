'use client';

import { useEffect, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { WatchNewsItem } from "@/lib/rss";

// World and local stories in one newest-first list. The chips narrow it to one origin or to the followed symbols.
export default function NewsList({ items }: { items: WatchNewsItem[] }) {
    const t = useTranslations('NewsList');
    const format = useFormatter();
    const [origin, setOrigin] = useState<WatchNewsItem['origin'] | null>(null);
    const [onlyWatched, setOnlyWatched] = useState(false);
    // Relative times are computed after mount, so the server and first client render agree
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => setNow(Date.now()), []);

    if (items.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-icon"><Newspaper className="size-5" /></span>
                <h3>{t('emptyTitle')}</h3>
                <p>{t('emptyBody')}</p>
            </div>
        );
    }

    const hasBoth = items.some((i) => i.origin === 'local') && items.some((i) => i.origin === 'world');
    const hasWatchedChoice = items.some((i) => i.watched) && items.some((i) => !i.watched);
    const filtered = items.filter((i) => (!origin || i.origin === origin) && (!onlyWatched || i.watched));
    const filtering = origin !== null || onlyWatched;
    const clear = () => {
        setOrigin(null);
        setOnlyWatched(false);
    };
    const chip = (active: boolean) => `pill h-7 cursor-pointer px-3 text-[12px] ${active ? 'is-up' : 'hover:bg-hover hover:text-foreground'}`;

    return (
        <div>
            {(hasBoth || hasWatchedChoice) && (
                <div className="flex flex-wrap items-center gap-1.5 border-b border-line/60 px-3 py-2" role="group" aria-label={t('filtersLabel')}>
                    {hasBoth && (['local', 'world'] as const).map((o) => (
                        <button key={o} type="button" className={chip(origin === o)} aria-pressed={origin === o} onClick={() => setOrigin((cur) => (cur === o ? null : o))}>
                            {t(o)}
                        </button>
                    ))}
                    {hasWatchedChoice && (
                        <button type="button" className={chip(onlyWatched)} aria-pressed={onlyWatched} onClick={() => setOnlyWatched((v) => !v)}>
                            {t('onlyWatched')}
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
            )}

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                    <p className="search-list-indicator">{t('noMatch')}</p>
                    <button type="button" onClick={clear} className="text-[12.5px] text-faint hover:text-brand-ink">{t('clearFilters')}</button>
                </div>
            ) : (
                <ul className="row-list max-h-[640px] overflow-y-auto">
                    {filtered.map((item) => (
                        <li key={item.link}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-hover/50">
                                <span className={`pill mono mt-0.5 min-w-16 shrink-0 justify-center ${item.watched ? 'is-brand' : ''}`}>
                                    {item.tag ? item.tag.replace(/\.SA$/, '') : item.origin === 'local' ? 'BR' : 'MKT'}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 font-semibold text-foreground group-hover:text-brand-ink transition-colors">{item.title}</span>
                                    <span className="mt-1 block truncate text-[12.5px] text-faint">
                                        {item.source}{now !== null && item.publishedAt ? ` · ${format.relativeTime(item.publishedAt, now)}` : ''}
                                    </span>
                                </span>
                                <ArrowUpRight className="mt-1 size-4 flex-none text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
