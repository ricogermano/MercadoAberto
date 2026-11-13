'use client';

import { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import HelpPopover from '@/components/HelpPopover';

// Shared by the Yahoo quotes table and the watchlist table: stackable sort criteria that combine into one rank-sum ranking
// (see rankByCriteria in lib/yahoo.ts), the clickable header cell, and the hint / "clear" bar above the table.

export type SortDir = 'asc' | 'desc';
export type SortHelp = { label: string; title: string; body: string };

// Lowest first for the valuation multiples, A-Z for names, highest first for everything else
export const defaultSortDir = (key: string): SortDir => (key === 'name' || key === 'pe' || key === 'pb' ? 'asc' : 'desc');

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
    const clear = useCallback(() => setCriteria([]), []);
    return { criteria, onSort, clear, combined: criteria.length > 1 };
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

// Always rendered so the table doesn't jump when a sort starts; the button is hidden while unsorted
export function SortBar({ hint, clearLabel, active, onClear }: { hint: string | null; clearLabel: string; active: boolean; onClear: () => void }) {
    return (
        <div className="flex min-h-6 items-start justify-between gap-3 px-3">
            <span className="text-[11.5px] text-faint">{hint ?? ''}</span>
            <button
                type="button"
                onClick={onClear}
                className={`shrink-0 text-[11.5px] text-faint hover:text-brand-ink ${active ? '' : 'invisible'}`}
                tabIndex={active ? 0 : -1}
                aria-hidden={!active}
            >
                {clearLabel}
            </button>
        </div>
    );
}
