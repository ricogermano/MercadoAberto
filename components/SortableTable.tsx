'use client';

import { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, X } from 'lucide-react';
import HelpPopover from '@/components/HelpPopover';

// Shared by the Yahoo quotes table and the watchlist table: stackable sort criteria that combine into one rank-sum ranking
// (see rankByCriteria in lib/yahoo.ts), the clickable header cell, and the hint / "clear" bar above the table.

export type SortDir = 'asc' | 'desc';
export type SortHelp = { label: string; title: string; body: string };

// Lowest first for the valuation multiples and for debt, A-Z for names, highest first for everything else
const LOWEST_FIRST = new Set(['name', 'pe', 'pb', 'evEbitda', 'netDebtEbitda']);
export const defaultSortDir = (key: string): SortDir => (LOWEST_FIRST.has(key) ? 'asc' : 'desc');

export function useSortCriteria<K extends string>() {
    const [criteria, setCriteria] = useState<{ key: K; dir: SortDir }[]>([]);
    // Not selected -> appended -> direction flipped -> removed
    const onSort = useCallback(
        (key: K) =>
            setCriteria((cur) => {
                const found = cur.find((c) => c.key === key);
                if (!found) return [...cur, { key, dir: defaultSortDir(key) }];
                if (found.dir === defaultSortDir(key)) return cur.map((c) => (c.key === key ? { key, dir: c.dir === 'asc' ? 'desc' : 'asc' } : c));
                return cur.filter((c) => c.key !== key);
            }),
        [],
    );
    const remove = useCallback((key: K) => setCriteria((cur) => cur.filter((c) => c.key !== key)), []);
    const clear = useCallback(() => setCriteria([]), []);
    return { criteria, onSort, remove, clear, combined: criteria.length > 1 };
}

export function SortableTh<K extends string>({
    id,
    label,
    sortLabel,
    criteria,
    onSort,
    help,
    className,
}: {
    id: K;
    label: string;
    sortLabel: string;
    criteria: { key: K; dir: SortDir }[];
    onSort: (key: K) => void;
    help?: SortHelp;
    className?: string;
}) {
    const index = criteria.findIndex((c) => c.key === id);
    const active = index >= 0 ? criteria[index].dir : null;
    const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ChevronsUpDown;
    return (
        <th className={className} aria-sort={index !== 0 ? 'none' : active === 'asc' ? 'ascending' : 'descending'}>
            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                <button
                    type="button"
                    onClick={() => onSort(id)}
                    aria-label={sortLabel}
                    className={`inline-flex items-center gap-1 font-medium hover:text-brand-ink ${active ? 'text-brand-ink' : ''}`}
                >
                    {label}
                    <Icon className={`size-3 ${active ? '' : 'opacity-60'}`} aria-hidden />
                    {criteria.length > 1 && active && <span className="num text-[10.5px]">{index + 1}</span>}
                </button>
                {/* A sibling of the sort button, so opening the help never changes the sort */}
                {help && <HelpPopover {...help} />}
            </div>
        </th>
    );
}

// Above the table: one removable tag per sort criterion (a criterion can sit in a column the current view hides, so the tags
// are the only place that always shows what the ranking is made of), the "clear" button, and the combined-ranking hint.
// Always rendered so the table doesn't jump when a sort starts.
export function SortBar<K extends string>({
    hint,
    clearLabel,
    criteria,
    labelOf,
    removeLabel,
    onRemove,
    onClear,
}: {
    hint: string | null;
    clearLabel: string;
    criteria: { key: K; dir: SortDir }[];
    labelOf: (key: K) => string;
    removeLabel: (column: string) => string;
    onRemove: (key: K) => void;
    onClear: () => void;
}) {
    const active = criteria.length > 0;
    return (
        <div className="min-h-7 px-3 pb-1">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {criteria.map((c, i) => {
                        const Icon = c.dir === 'asc' ? ArrowUp : ArrowDown;
                        return (
                            <span key={c.key} className="pill is-brand h-6 gap-1 ps-2 pe-1">
                                {criteria.length > 1 && <span className="num text-[10.5px]">{i + 1}</span>}
                                {labelOf(c.key)}
                                <Icon aria-hidden />
                                <button type="button" onClick={() => onRemove(c.key)} aria-label={removeLabel(labelOf(c.key))} className="hit grid size-4 cursor-pointer place-items-center rounded-full hover:bg-hover">
                                    <X aria-hidden />
                                </button>
                            </span>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className={`shrink-0 cursor-pointer pt-1 text-[12px] text-faint hover:text-brand-ink ${active ? '' : 'invisible'}`}
                    tabIndex={active ? 0 : -1}
                    aria-hidden={!active}
                >
                    {clearLabel}
                </button>
            </div>
            {hint && <p className="pt-1 text-[12px] text-faint">{hint}</p>}
        </div>
    );
}
