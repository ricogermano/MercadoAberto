'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChangePill from '@/components/ChangePill';
import WatchlistButton from '@/components/WatchlistButton';
import { SortBar, SortableTh, useSortCriteria, type SortHelp } from '@/components/SortableTable';
import { rankByCriteria } from '@/lib/yahoo';

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
    pe: number | null;
    pb: number | null;
    roe: number | null;
    roce: number | null;
    dy: number | null;
};

export type QuoteLabels = {
    company: string;
    price: string;
    change: string;
    changePercent: string;
    pe: string;
    pb: string;
    roe: string;
    roce: string;
    dy: string;
    clearSort: string;
    combinedHint: string;
};

type SortKey = 'name' | 'price' | 'change' | 'changePercent' | 'pe' | 'pb' | 'roe' | 'roce' | 'dy';

const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtOrDash = (v: number | null) => (v == null ? '—' : fmt(v));

export default function YahooQuotesSortable({
    groups,
    labels,
    sortByTemplate,
    help,
    note,
    watchLabel,
}: {
    groups: { title: string; rows: QuoteRow[] }[];
    labels: QuoteLabels;
    sortByTemplate: Record<SortKey, string>;
    help: Partial<Record<SortKey, SortHelp>>;
    note: string;
    watchLabel: string;
}) {
    const { criteria, onSort, clear, combined } = useSortCriteria<SortKey>();
    // Stars toggled here, so they survive re-sorting (rows remount) until the server data catches up
    const [watch, setWatch] = useState<Record<string, boolean>>({});
    const allRows = groups.flatMap((g) => g.rows);
    const showFundamentals = allRows.some((r) => r.pe != null || r.pb != null || r.roce != null || r.dy != null);

    const columns: { key: SortKey; label: string; numeric: boolean }[] = [
        { key: 'name', label: labels.company, numeric: false },
        { key: 'price', label: labels.price, numeric: true },
        { key: 'change', label: labels.change, numeric: true },
        { key: 'changePercent', label: labels.changePercent, numeric: true },
        ...(showFundamentals
            ? ([
                  { key: 'dy', label: labels.dy, numeric: true },
                  { key: 'pe', label: labels.pe, numeric: true },
                  { key: 'pb', label: labels.pb, numeric: true },
                  { key: 'roe', label: labels.roe, numeric: true },
                  { key: 'roce', label: labels.roce, numeric: true },
              ] as const)
            : []),
    ];

    const sorted = criteria.length > 0 ? rankByCriteria(allRows, criteria) : null;
    const colCount = columns.length + 1 + (combined ? 1 : 0); // + the watchlist star

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
            <td className={`num whitespace-nowrap px-3 py-2 text-end ${r.change != null && r.change < 0 ? 'text-down' : 'text-up'}`}>
                {r.change == null ? '—' : `${r.change > 0 ? '+' : ''}${fmt(r.change)}`}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-end"><ChangePill value={r.changePercent} /></td>
            {showFundamentals && (
                <>
                    <td className="num whitespace-nowrap px-3 py-2 text-end">{r.dy == null ? '—' : `${r.dy.toFixed(1)}%`}</td>
                    <td className="num whitespace-nowrap px-3 py-2 text-end">{fmtOrDash(r.pe)}</td>
                    <td className="num whitespace-nowrap px-3 py-2 text-end">{fmtOrDash(r.pb)}</td>
                    <td className="num whitespace-nowrap px-3 py-2 text-end">{r.roe == null ? '—' : `${r.roe.toFixed(1)}%`}</td>
                    <td className="num whitespace-nowrap px-3 py-2 text-end">{r.roce == null ? '—' : `${r.roce.toFixed(1)}%`}</td>
                </>
            )}
        </tr>
    );

    return (
        <div className="overflow-x-auto">
            <SortBar hint={combined ? labels.combinedHint : null} clearLabel={labels.clearSort} active={criteria.length > 0} onClear={clear} />
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-start text-faint">
                        <th className="w-8 p-0" aria-label={watchLabel} />
                        {combined && <th className="px-3 py-2 font-medium">#</th>}
                        {columns.map((c) => (
                            <SortableTh
                                key={c.key}
                                id={c.key}
                                label={c.label}
                                sortLabel={sortByTemplate[c.key]}
                                criteria={criteria}
                                onSort={onSort}
                                help={help[c.key]}
                                className={`px-3 py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                            />
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
    );
}
