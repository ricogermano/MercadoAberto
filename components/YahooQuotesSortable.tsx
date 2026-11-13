'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import ChangePill from '@/components/ChangePill';
import { compareNullable } from '@/lib/yahoo';

export type QuoteRow = {
    tvSymbol: string;
    appSymbol: string | null;
    name: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    pe: number | null;
    pb: number | null;
    roe: number | null;
    roce: number | null;
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
    clearSort: string;
};

type SortKey = 'name' | 'price' | 'change' | 'changePercent' | 'pe' | 'pb' | 'roe' | 'roce';
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtOrDash = (v: number | null) => (v == null ? '—' : fmt(v));

export default function YahooQuotesSortable({
    groups,
    labels,
    sortByTemplate,
    note,
}: {
    groups: { title: string; rows: QuoteRow[] }[];
    labels: QuoteLabels;
    sortByTemplate: Record<SortKey, string>;
    note: string;
}) {
    const [sort, setSort] = useState<Sort>(null);
    const allRows = groups.flatMap((g) => g.rows);
    const showFundamentals = allRows.some((r) => r.pe != null || r.pb != null || r.roce != null);

    const columns: { key: SortKey; label: string; numeric: boolean }[] = [
        { key: 'name', label: labels.company, numeric: false },
        { key: 'price', label: labels.price, numeric: true },
        { key: 'change', label: labels.change, numeric: true },
        { key: 'changePercent', label: labels.changePercent, numeric: true },
        ...(showFundamentals
            ? ([
                  { key: 'pe', label: labels.pe, numeric: true },
                  { key: 'pb', label: labels.pb, numeric: true },
                  { key: 'roe', label: labels.roe, numeric: true },
                  { key: 'roce', label: labels.roce, numeric: true },
              ] as const)
            : []),
    ];

    const onSort = (key: SortKey) =>
        setSort((cur) => {
            if (cur?.key === key) return { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' };
            return { key, dir: key === 'name' ? 'asc' : 'desc' };
        });

    const sorted = sort ? [...allRows].sort((a, b) => compareNullable(a[sort.key], b[sort.key], sort.dir)) : null;

    const renderRow = (r: QuoteRow) => (
        <tr key={r.tvSymbol} className="border-t border-line/60 transition-colors hover:bg-hover/40">
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
            {/* Always rendered so the table doesn't jump when a sort starts; hidden while unsorted */}
            <div className="flex h-6 justify-end px-3">
                <button
                    type="button"
                    onClick={() => setSort(null)}
                    className={`text-[11.5px] text-faint hover:text-brand-ink ${sort ? '' : 'invisible'}`}
                    tabIndex={sort ? 0 : -1}
                    aria-hidden={!sort}
                >
                    {labels.clearSort}
                </button>
            </div>
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-start text-faint">
                        {columns.map((c) => {
                            const active = sort?.key === c.key ? sort.dir : null;
                            const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ChevronsUpDown;
                            return (
                                <th
                                    key={c.key}
                                    className={`px-3 py-2 font-medium ${c.numeric ? 'whitespace-nowrap text-end' : ''}`}
                                    aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSort(c.key)}
                                        aria-label={sortByTemplate[c.key]}
                                        className={`inline-flex items-center gap-1 font-medium hover:text-brand-ink ${active ? 'text-brand-ink' : ''}`}
                                    >
                                        {c.label}
                                        <Icon className={`size-3 ${active ? '' : 'opacity-60'}`} aria-hidden />
                                    </button>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {sorted ? (
                    <tbody>{sorted.map(renderRow)}</tbody>
                ) : (
                    groups.map((group) => (
                        <tbody key={group.title}>
                            <tr>
                                <td colSpan={columns.length} className="kicker px-3 pt-3 pb-1">{group.title}</td>
                            </tr>
                            {group.rows.map(renderRow)}
                        </tbody>
                    ))
                )}
            </table>
            <p className="px-3 py-2 text-[11.5px] text-faint">{note}</p>
        </div>
    );
}
