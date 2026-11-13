'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronsUpDown, CircleHelp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChangePill from '@/components/ChangePill';
import WatchlistButton from '@/components/WatchlistButton';
import { rankByCriteria, type SortCriterion } from '@/lib/yahoo';

export type QuoteRow = {
    tvSymbol: string;
    watching: boolean;
    appSymbol: string | null;
    name: string;
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
type Criterion = SortCriterion<QuoteRow> & { key: SortKey };

// Lowest first for the valuation multiples, A-Z for names, highest first for everything else
const defaultDir = (key: SortKey): 'asc' | 'desc' => (key === 'name' || key === 'pe' || key === 'pb' ? 'asc' : 'desc');

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
    help: Partial<Record<SortKey, { label: string; title: string; body: string }>>;
    note: string;
    watchLabel: string;
}) {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
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

    // Not selected -> appended -> direction flipped -> removed
    const onSort = (key: SortKey) =>
        setCriteria((cur) => {
            const found = cur.find((c) => c.key === key);
            if (!found) return [...cur, { key, dir: defaultDir(key) }];
            if (found.dir === defaultDir(key)) return cur.map((c) => (c.key === key ? { key, dir: c.dir === 'asc' ? 'desc' : 'asc' } : c));
            return cur.filter((c) => c.key !== key);
        });

    const combined = criteria.length > 1;
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
                <Link href={`/stocks/${r.appSymbol}`} className="font-semibold hover:text-brand-ink">
                    {r.name} <span className="mono text-[11px] text-faint">{r.appSymbol}</span>
                </Link>
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
            {/* Always rendered so the table doesn't jump when a sort starts; the button is hidden while unsorted */}
            <div className="flex min-h-6 items-start justify-between gap-3 px-3">
                <span className="text-[11.5px] text-faint">{combined ? labels.combinedHint : ''}</span>
                <button
                    type="button"
                    onClick={() => setCriteria([])}
                    className={`shrink-0 text-[11.5px] text-faint hover:text-brand-ink ${criteria.length ? '' : 'invisible'}`}
                    tabIndex={criteria.length ? 0 : -1}
                    aria-hidden={!criteria.length}
                >
                    {labels.clearSort}
                </button>
            </div>
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-start text-faint">
                        <th className="w-8 p-0" aria-label={watchLabel} />
                        {combined && <th className="px-3 py-2 font-medium">#</th>}
                        {columns.map((c) => {
                            const index = criteria.findIndex((x) => x.key === c.key);
                            const active = index >= 0 ? criteria[index].dir : null;
                            const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ChevronsUpDown;
                            return (
                                <th
                                    key={c.key}
                                    className={`px-3 py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                                    aria-sort={index !== 0 ? 'none' : active === 'asc' ? 'ascending' : 'descending'}
                                >
                                    <div className="inline-flex items-center gap-1 whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => onSort(c.key)}
                                        aria-label={sortByTemplate[c.key]}
                                        className={`inline-flex items-center gap-1 font-medium hover:text-brand-ink ${active ? 'text-brand-ink' : ''}`}
                                    >
                                        {c.label}
                                        <Icon className={`size-3 ${active ? '' : 'opacity-60'}`} aria-hidden />
                                        {combined && active && <span className="num text-[10.5px]">{index + 1}</span>}
                                    </button>
                                    {help[c.key] && (
                                        // A sibling of the sort button, so opening the help never changes the sort
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button type="button" aria-label={help[c.key]!.label} className="text-faint opacity-60 hover:text-brand-ink hover:opacity-100">
                                                    <CircleHelp className="size-3" aria-hidden />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto max-w-72 whitespace-normal p-3 text-start text-[12.5px] font-normal">
                                                <p className="font-semibold">{help[c.key]!.title}</p>
                                                <p className="mt-1 leading-snug">{help[c.key]!.body}</p>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    </div>
                                </th>
                            );
                        })}
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
