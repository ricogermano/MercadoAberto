'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChangePill from '@/components/ChangePill';
import WatchlistButton from '@/components/WatchlistButton';
import { useTranslations } from 'next-intl';
import { SortBar, SortableTh, useSortCriteria } from '@/components/SortableTable';
import { INDICATORS, IndicatorViewBar, formatIndicator, useIndicatorText, useIndicatorView, type IndicatorKey } from '@/components/IndicatorViews';
import { rankByCriteria, type YahooFundamentals } from '@/lib/yahoo';
import { medianSide, mediansOf } from '@/lib/medians';

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
    const { view, keys, select, toggle } = useIndicatorView('quotes-indicator-view');
    const indicatorText = useIndicatorText();
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
    const colCount = columns.length + 1 + (combined ? 1 : 0); // + the watchlist star
    // Each value is compared with the median on screen: its sector's while the table is grouped, the whole table's once a
    // sort mixes the sectors
    type Medians = Record<IndicatorKey, number | null>;
    const overallMedians = mediansOf(allRows, INDICATORS);
    const sideClass = (key: IndicatorKey, value: number | null, med: number | null) => {
        const side = medianSide(key, value, med);
        return side === 'better' ? 'text-up' : side === 'worse' ? 'text-down' : '';
    };

    // A group heading whose indicator columns carry the group's medians
    const renderMedians = (title: string, medianLabel: string, medians: Medians) => (
        <tr>
            <td colSpan={colCount - shownIndicators.length} className="px-3 pt-3 pb-1">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="kicker">{title}</span>
                    {shownIndicators.length > 0 && <span className="whitespace-nowrap text-[11.5px] text-faint">{medianLabel}</span>}
                </div>
            </td>
            {shownIndicators.map((key) => (
                <td key={key} className="num whitespace-nowrap px-3 pt-3 pb-1 text-end text-[12px] text-faint">{formatIndicator(key, medians[key])}</td>
            ))}
        </tr>
    );

    const renderRow = (r: QuoteRow, medians: Medians, position?: number | null) => (
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
                <td key={key} className={`num whitespace-nowrap px-3 py-2 text-end ${sideClass(key, r[key], medians[key])}`}>{formatIndicator(key, r[key])}</td>
            ))}
        </tr>
    );

    return (
        <div className="overflow-x-auto">
            {showFundamentals && <IndicatorViewBar view={view} keys={keys} onSelect={select} onToggle={toggle} />}
            <SortBar
                hint={combined ? labels.combinedHint : null}
                clearLabel={labels.clearSort}
                criteria={criteria}
                labelOf={labelOf}
                removeLabel={(column) => t('removeSort', { column })}
                onRemove={remove}
                onClear={clear}
            />
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-start text-faint">
                        <th className="w-8 p-0" aria-label={watchLabel} />
                        {combined && <th className="px-3 py-2 font-medium">#</th>}
                        {columns.map((c) => (
                            <SortableTh
                                key={c.key}
                                id={c.key}
                                label={labelOf(c.key)}
                                sortLabel={t('sortBy', { column: labelOf(c.key) })}
                                criteria={criteria}
                                onSort={onSort}
                                help={indicatorText.help(c.key)}
                                className={`px-3 py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                            />
                        ))}
                    </tr>
                </thead>
                {sorted ? (
                    <tbody>
                        {shownIndicators.length > 0 && renderMedians(t('allCompanies'), t('medianAll'), overallMedians)}
                        {sorted.map(({ row, position }) => renderRow(row, overallMedians, position))}
                    </tbody>
                ) : (
                    groups.map((group) => {
                        const medians = mediansOf(group.rows, INDICATORS);
                        return (
                            <tbody key={group.title}>
                                {renderMedians(group.title, t('medianSector'), medians)}
                                {group.rows.map((r) => renderRow(r, medians))}
                            </tbody>
                        );
                    })
                )}
            </table>
            <p className="px-3 py-2 text-[11.5px] text-faint">{note}</p>
        </div>
    );
}
