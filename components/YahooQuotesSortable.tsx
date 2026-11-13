'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import ChangePill from '@/components/ChangePill';
import WatchlistButton from '@/components/WatchlistButton';
import { useTranslations } from 'next-intl';
import { SortBar, SortableTh, useSortCriteria } from '@/components/SortableTable';
import { INDICATORS, IndicatorViewBar, formatIndicator, hasMedian, medianTone, medianValue, useIndicatorText, useIndicatorView, type IndicatorKey } from '@/components/IndicatorViews';
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
    combinedHint: string;
};

type BaseKey = 'name' | 'price' | 'change' | 'changePercent';
type SortKey = BaseKey | IndicatorKey;

const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtOrDash = (v: number | null) => (v == null ? '—' : fmt(v));

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
    const { criteria, onSort, remove, clear, combined } = useSortCriteria<SortKey>();
    const { view, keys, select, toggle, medians, toggleMedians } = useIndicatorView('quotes-indicator-view');
    const indicatorText = useIndicatorText();
    // Full screen keeps the view, the sort criteria and the stars: the same table is resized in place
    const { expanded, toggle: toggleFullScreen, close } = useFullScreen();
    // Stars toggled here, so they survive re-sorting (rows remount) until the server data catches up
    const [watch, setWatch] = useState<Record<string, boolean>>({});
    const allRows = groups.flatMap((g) => g.rows);
    const showFundamentals = allRows.some((r) => INDICATORS.some((k) => r[k] != null));
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

    const sorted = criteria.length > 0 ? rankByCriteria(allRows, criteria) : null;
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
                        {r.name} <span className="mono text-[11px] text-faint">{r.appSymbol}</span>
                    </Link>
                ) : (
                    <span className="font-semibold">
                        {r.name} <span className="mono text-[11px] font-normal text-faint">{r.unit}</span>
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
                    <td className={`num whitespace-nowrap px-3 py-2 text-end ${medians ? medianTone(key, r[key], r.medians) : ''}`}>{formatIndicator(key, r[key])}</td>
                    {withMedian(key) && <td className="num whitespace-nowrap py-2 ps-0 pe-3 text-end text-[12px] text-faint">{formatIndicator(key, medianValue(key, r.medians))}</td>}
                </Fragment>
            ))}
        </tr>
    );

    return (
        <>
        {expanded && <FullScreenBackdrop onClose={close} />}
        <div className={expanded ? `${FULL_SCREEN_FRAME} overflow-auto` : 'overflow-x-auto'}>
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
                {/* With the whole screen to scroll, the header row stays in view */}
                <thead className={expanded ? '[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card' : ''}>
                    <tr className="text-start text-faint">
                        <th className="w-8 p-0" aria-label={watchLabel} />
                        {combined && <th className="px-3 py-2 font-medium">#</th>}
                        {columns.map((c) => (
                            <Fragment key={c.key}>
                            <SortableTh
                                id={c.key}
                                label={labelOf(c.key)}
                                sortLabel={t('sortBy', { column: labelOf(c.key) })}
                                criteria={criteria}
                                onSort={onSort}
                                help={indicatorText.help(c.key)}
                                className={`px-3 py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                            />
                            {withMedian(c.key) && <th className="whitespace-nowrap py-2 ps-0 pe-3 text-end text-[11.5px] font-normal" title={t('medianTitle')}>{t('medianShort')}</th>}
                            </Fragment>
                        ))}
                    </tr>
                </thead>
                {sorted ? (
                    <tbody>{sorted.map(({ row, position }) => renderRow(row, position))}</tbody>
                ) : (
                    groups.map((group) => (
                        <tbody key={group.title}>
                            <tr>
                                <td colSpan={colCount} className="kicker px-3 pt-3 pb-1">{group.title}</td>
                            </tr>
                            {group.rows.map((r) => renderRow(r))}
                        </tbody>
                    ))
                )}
            </table>
            <p className="px-3 py-2 text-[11.5px] text-faint">{note}</p>
        </div>
        </>
    );
}
