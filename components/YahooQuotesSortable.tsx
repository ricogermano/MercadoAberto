'use client';

import { Fragment, useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ListFilter, Search, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ChangePill from '@/components/ChangePill';
import WatchlistButton from '@/components/WatchlistButton';
import { useLocale, useTranslations } from 'next-intl';
import HelpPopover from '@/components/HelpPopover';
import { formatDecimal } from '@/lib/format';
import { SortBar, SortableTh, useSortCriteria } from '@/components/SortableTable';
import { INDICATORS, IndicatorValue, IndicatorViewBar, formatIndicator, hasMedian, medianTone, medianValue, useIndicatorText, useIndicatorView, type IndicatorKey } from '@/components/IndicatorViews';
import { rankByCriteria, type YahooFundamentals } from '@/lib/yahoo';
import { FULL_SCREEN_FRAME, FullScreenBackdrop, FullScreenButton, useFullScreen } from '@/components/FullScreen';

export type QuoteRow = {
    tvSymbol: string;
    watching: boolean;
    appSymbol: string | null;
    name: string;
    // What the price is quoted in, for rows that are not stocks (commodities)
    unit?: string | null;
    price: number | null;
    change: number | null;
    changePercent: number | null;
} & YahooFundamentals;

export type QuoteLabels = {
    company: string;
    price: string;
    change: string;
    changePercent: string;
    clearSort: string;
    filter: string;
    combinedHint: string;
};

type BaseKey = 'name' | 'price' | 'change' | 'changePercent';
type SortKey = BaseKey | IndicatorKey;


// Case- and accent-insensitive, so "itau" finds "Itaú"
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function YahooQuotesSortable({
    groups,
    labels,
    note,
    watchLabel,
}: {
    groups: { title: string; rows: QuoteRow[] }[];
    labels: QuoteLabels;
    note: string;
    watchLabel: string;
}) {
    const t = useTranslations('YahooQuotes');
    const captionId = useId();
    const locale = useLocale();
    const fmt = (v: number) => formatDecimal(v, locale);
    const fmtOrDash = (v: number | null) => (v == null ? '—' : fmt(v));
    const { criteria, onSort, remove, clear, combined } = useSortCriteria<SortKey>();
    const { view, keys, select, toggle, medians, toggleMedians } = useIndicatorView('quotes-indicator-view');
    const indicatorText = useIndicatorText();
    // Full screen keeps the view, the sort criteria and the stars: the same table is resized in place
    const { expanded, toggle: toggleFullScreen, close } = useFullScreen();
    // Stars toggled here, so they survive re-sorting (rows remount) until the server data catches up
    const [watch, setWatch] = useState<Record<string, boolean>>({});
    // Sector filter: the ticked groups are the only ones listed, and the only ones ranked when a sort is on
    const [sectors, setSectors] = useState<string[]>([]);
    const filtering = sectors.length > 0;
    const shownGroups = filtering ? groups.filter((g) => sectors.includes(g.title)) : groups;
    const toggleSector = (title: string) => setSectors((cur) => (cur.includes(title) ? cur.filter((s) => s !== title) : [...cur, title]));
    const allRows = shownGroups.flatMap((g) => g.rows);
    // Search by name or ticker. It only hides rows: a ranking keeps the positions of the whole (sector-filtered) table
    const [query, setQuery] = useState('');
    const needle = plain(query.trim());
    const matches = (r: QuoteRow) => !needle || plain(r.name).includes(needle) || plain(r.appSymbol ?? r.tvSymbol).includes(needle);
    const foundGroups = shownGroups.map((g) => ({ ...g, rows: g.rows.filter(matches) })).filter((g) => g.rows.length > 0);
    // Decided on the whole table, so the columns don't change with the filter
    const showFundamentals = groups.some((g) => g.rows.some((r) => INDICATORS.some((k) => r[k] != null)));
    // Day change in currency only where there is room for it: the summary view, or a table without indicators (commodities)
    const showChange = !showFundamentals || view === 'summary';
    const shownIndicators = showFundamentals ? keys : [];

    const baseLabels: Record<BaseKey, string> = { name: labels.company, price: labels.price, change: labels.change, changePercent: labels.changePercent };
    const labelOf = (key: SortKey) => indicatorText.label(key) ?? baseLabels[key as BaseKey];
    const columns: { key: SortKey; numeric: boolean }[] = [
        { key: 'name', numeric: false },
        { key: 'price', numeric: true },
        ...(showChange ? [{ key: 'change' as const, numeric: true }] : []),
        { key: 'changePercent', numeric: true },
        ...shownIndicators.map((key) => ({ key, numeric: true })),
    ];

    const sorted = criteria.length > 0 ? rankByCriteria(allRows, criteria).filter(({ row }) => matches(row)) : null;
    const nothingFound = needle !== '' && (sorted ? sorted.length === 0 : foundGroups.length === 0);
    // Each indicator that has a history is followed by a narrow column with the company's own median of past years
    const withMedian = (key: SortKey): key is IndicatorKey => medians && showFundamentals && (INDICATORS as readonly string[]).includes(key) && hasMedian(key as IndicatorKey);
    const colCount = columns.length + columns.filter((c) => withMedian(c.key)).length + 1 + (combined ? 1 : 0); // + the watchlist star
    const renderRow = (r: QuoteRow, position?: number | null) => (
        <tr key={r.tvSymbol} className="border-t border-line/60 transition-colors hover:bg-hover/40">
            <td className="py-1 ps-2 pe-0">
                {r.appSymbol && (
                    <WatchlistButton
                        symbol={r.appSymbol}
                        company={r.name}
                        isInWatchlist={watch[r.appSymbol] ?? r.watching}
                        variant="icon"
                        onWatchlistChange={(symbol, added) => setWatch((cur) => ({ ...cur, [symbol]: added }))}
                    />
                )}
            </td>
            {combined && <td className="num px-3 py-2 text-faint">{position ?? '—'}</td>}
            <td className="px-3 py-2">
                {r.appSymbol ? (
                    <Link href={`/stocks/${r.appSymbol}`} className="font-semibold hover:text-brand-ink">
                        <span className="block max-w-[10.5rem] truncate sm:inline sm:max-w-none">{r.name}</span>{' '}
                        <span className="mono text-[12px] text-faint">{r.appSymbol.replace(/\.SA$/, '')}</span>
                    </Link>
                ) : (
                    <span className="font-semibold">
                        {r.name} <span className="mono text-[12px] font-normal text-faint">{r.unit}</span>
                    </span>
                )}
            </td>
            <td className="num whitespace-nowrap px-3 py-2 text-end font-semibold">{fmtOrDash(r.price)}</td>
            {showChange && (
                <td className={`num whitespace-nowrap px-3 py-2 text-end ${r.change != null && r.change < 0 ? 'text-down' : 'text-up'}`}>
                    {r.change == null ? '—' : `${r.change > 0 ? '+' : ''}${fmt(r.change)}`}
                </td>
            )}
            <td className="whitespace-nowrap px-3 py-2 text-end"><ChangePill value={r.changePercent} /></td>
            {shownIndicators.map((key) => (
                <Fragment key={key}>
                    <td className={`num whitespace-nowrap px-3 py-2 text-end ${medians ? medianTone(key, r[key], r.medians) : ''}`}><IndicatorValue k={key} value={r[key]} locale={locale} /></td>
                    {withMedian(key) && <td className="num whitespace-nowrap py-2 ps-0 pe-3 text-end text-[12px] text-faint">{formatIndicator(key, medianValue(key, r.medians), locale)}</td>}
                </Fragment>
            ))}
        </tr>
    );

    // Sits beside the first heading of the table body, in the company column
    const sectorMenu = groups.length > 1 && (
        <span className="inline-flex items-center gap-2.5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className={`pill h-6 cursor-pointer gap-1 px-2.5 font-semibold transition-colors hover:text-foreground ${filtering ? 'is-brand' : ''}`}>
                        <ListFilter aria-hidden />
                        {labels.filter}
                        {filtering && <span className="num">({sectors.length})</span>}
                        <ChevronDown aria-hidden />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="text-[13px]">
                    {/* Ticking keeps the menu open, so several groups can be picked in one go */}
                    <DropdownMenuCheckboxItem checked={!filtering} onSelect={(e) => { e.preventDefault(); setSectors([]); }}>{t('filterAll')}</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {groups.map((g) => (
                        <DropdownMenuCheckboxItem key={g.title} checked={sectors.includes(g.title)} onSelect={(e) => { e.preventDefault(); toggleSector(g.title); }}>
                            {g.title}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {filtering && (
                <button type="button" onClick={() => setSectors([])} className="cursor-pointer text-[12px] text-faint hover:text-brand-ink">
                    {t('clearFilter')}
                </button>
            )}
        </span>
    );
    // Sits ahead of the company title, in one header cell that also spans the star column (and a ranking's position column).
    // The same margin on both sides centres it between the table's edge and that title, with nothing underneath it.
    const searchBox = (
        <span className="relative ms-4 me-5 inline-flex items-center font-normal">
            <Search className="pointer-events-none absolute start-1.5 size-3 text-faint" aria-hidden />
            <input
                type="text"
                role="searchbox"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search')}
                aria-label={t('searchLabel')}
                className="h-6 w-28 rounded-md border border-border bg-transparent ps-6 pe-5 text-[12px] text-foreground placeholder:text-faint focus:border-[var(--brand)] focus:outline-none"
            />
            {query && (
                <button type="button" onClick={() => setQuery('')} aria-label={t('clearSearch')} className="absolute end-1 cursor-pointer text-faint hover:text-brand-ink">
                    <X className="size-3" aria-hidden />
                </button>
            )}
        </span>
    );
    const headingRow = (title: string, withMenu: boolean) => (
        <tr>
            <td colSpan={colCount} className="px-3 pt-3 pb-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {title && <span className="kicker">{title}</span>}
                    {withMenu && sectorMenu}
                </div>
            </td>
        </tr>
    );

    return (
        <>
        {expanded && <FullScreenBackdrop onClose={close} />}
        <div className={expanded ? `${FULL_SCREEN_FRAME} overflow-auto` : 'max-h-[640px] overflow-auto'} tabIndex={0} role="region" aria-labelledby={captionId}>
            <div className="flex items-start">
            <div className="min-w-0 flex-1">
            {showFundamentals && <IndicatorViewBar view={view} keys={keys} onSelect={select} onToggle={toggle} medians={medians} onToggleMedians={toggleMedians} />}
            <SortBar
                hint={combined ? labels.combinedHint : null}
                clearLabel={labels.clearSort}
                criteria={criteria}
                labelOf={labelOf}
                removeLabel={(column) => t('removeSort', { column })}
                onRemove={remove}
                onClear={clear}
            />
            </div>
            <FullScreenButton expanded={expanded} onToggle={toggleFullScreen} className="me-2 mt-1.5" />
            </div>
            <table className="w-full text-[13px]">
                <caption id={captionId} className="sr-only">{t('tableLabel')}</caption>
                {/* The table scrolls inside its own frame, so the header row stays in view */}
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
                    <tr className="text-start text-faint">
                        {columns.map((c) => (
                            <Fragment key={c.key}>
                            <SortableTh
                                id={c.key}
                                label={labelOf(c.key)}
                                sortLabel={t('sortBy', { column: labelOf(c.key) })}
                                criteria={criteria}
                                onSort={onSort}
                                help={indicatorText.help(c.key)}
                                before={c.key === 'name' ? searchBox : undefined}
                                colSpan={c.key === 'name' ? (combined ? 3 : 2) : undefined}
                                className={`${c.key === 'name' ? 'ps-2 pe-3 text-start' : 'px-3'} py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                            />
                            {withMedian(c.key) && <th className="whitespace-nowrap py-2 ps-0 pe-3 text-end text-[12px] font-normal" title={t('medianTitle')}><span className="inline-flex items-center gap-1">{t('medianShort')}<HelpPopover label={t('medianHelp.label')} title={t('medianHelp.title')} body={t('medianHelp.body')} /></span></th>}
                            </Fragment>
                        ))}
                    </tr>
                </thead>
                {nothingFound ? (
                    <tbody>
                        {sectorMenu && headingRow('', true)}
                        <tr>
                            <td colSpan={colCount} className="px-3 py-6 text-center text-muted-foreground">
                                {t('noMatch', { query: query.trim() })}{' '}
                                <button type="button" onClick={() => setQuery('')} className="cursor-pointer underline hover:text-brand-ink">{t('clearSearch')}</button>
                            </td>
                        </tr>
                    </tbody>
                ) : sorted ? (
                    <tbody>
                        {/* A ranking has no group headings: this row names the groups being ranked and keeps the filter at hand */}
                        {sectorMenu && headingRow(filtering ? shownGroups.map((g) => g.title).join(' · ') : '', true)}
                        {sorted.map(({ row, position }) => renderRow(row, position))}
                    </tbody>
                ) : (
                    foundGroups.map((group, i) => (
                        <tbody key={group.title}>
                            {headingRow(group.title, i === 0)}
                            {group.rows.map((r) => renderRow(r))}
                        </tbody>
                    ))
                )}
            </table>
            <p className="px-3 py-2 text-[12px] text-faint">{note}</p>
        </div>
        </>
    );
}
