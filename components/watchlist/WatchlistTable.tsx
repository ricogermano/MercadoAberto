"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import CreateAlertModal from "./CreateAlertModal";
import AddToListMenu from "./AddToListMenu";
import WatchlistButton from "@/components/WatchlistButton";
import ChangePill from "@/components/ChangePill";
import PriceFlash from "@/components/PriceFlash";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { SearchButton } from "@/components/SearchCommand";
import { SortBar, SortableTh, useSortCriteria, type SortHelp } from "@/components/SortableTable";
import { formatNumber, formatPrice } from "@/lib/utils";
import { hasFinnhubQuotes } from "@/lib/markets";
import { rankByCriteria, type YahooFundamentals } from "@/lib/yahoo";
import type { getWatchlistData } from "@/lib/actions/finnhub.actions";

type Row = Awaited<ReturnType<typeof getWatchlistData>>[number];
type SortKey = 'name' | 'price' | 'changePercent' | 'change' | 'marketCap' | 'dy' | 'pe' | 'pb' | 'roe' | 'roce';
const INDICATORS = ['dy', 'pe', 'pb', 'roe', 'roce'] as const;
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toFixed(1)}%`);
const num2 = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const SUGGESTIONS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN'];

export default function WatchlistTable({ initialRows, lists = [], fundamentals = {} }: { initialRows: Row[]; lists?: { id: string; name: string }[]; fundamentals?: Record<string, YahooFundamentals> }) {
    const t = useTranslations('WatchlistTableRow');
    const th = useTranslations('WatchlistTable.headers');
    const ty = useTranslations('YahooQuotes');
    const { criteria, onSort, clear, combined } = useSortCriteria<SortKey>();
    const [baseRows, setBaseRows] = useState(initialRows);
    const live = useLiveQuotes(baseRows.map((r) => r.symbol));

    // Server re-renders (after add/remove) replace the local copy
    useEffect(() => setBaseRows(initialRows), [initialRows]);

    const rows = baseRows.map((r) => {
        const q = live[r.symbol];
        return q?.c ? { ...r, price: q.c, change: q.d ?? r.change, changePercent: q.dp ?? r.changePercent } : r;
    });

    // Sorting works on the live values; a symbol without a quote has no price, change or market cap to rank
    const sortRows = rows.map((row) => {
        const f = fundamentals[row.symbol];
        return {
            row,
            name: row.name,
            price: row.price || null,
            change: row.price ? row.change : null,
            changePercent: row.price ? row.changePercent : null,
            marketCap: row.marketCap || null,
            dy: f?.dy ?? null,
            pe: f?.pe ?? null,
            pb: f?.pb ?? null,
            roe: f?.roe ?? null,
            roce: f?.roce ?? null,
        };
    });
    const shown = criteria.length > 0 ? rankByCriteria(sortRows, criteria) : sortRows.map((r) => ({ row: r, position: null as number | null }));
    const showIndicators = sortRows.some((r) => INDICATORS.some((k) => r[k] != null));

    if (rows.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-icon"><Star className="size-5" /></span>
                <h3>{t('emptyTitle')}</h3>
                <p className="max-w-sm">{t('emptyBody')}</p>
                <SearchButton className="btn btn-primary mt-3"><Search /> {t('searchStocks')}</SearchButton>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {SUGGESTIONS.map((s) => (
                        <Link key={s} href={`/stocks/${s}`} className="pill mono h-7 px-3 hover:bg-hover hover:text-foreground">{s}</Link>
                    ))}
                </div>
            </div>
        );
    }

    const columns: [SortKey, string, boolean][] = [
        ['name', th('company'), false],
        ['price', th('price'), true],
        ['changePercent', t('today'), true],
        ['change', th('change'), true],
        ['marketCap', th('marketCap'), true],
        ...(showIndicators ? INDICATORS.map((k) => [k, ty(k), true] as [SortKey, string, boolean]) : []),
    ];
    const helpFor = (key: SortKey): SortHelp | undefined =>
        (INDICATORS as readonly string[]).includes(key)
            ? { label: ty('helpAbout', { column: ty(key as (typeof INDICATORS)[number]) }), title: ty(`help.${key as (typeof INDICATORS)[number]}.title`), body: ty(`help.${key as (typeof INDICATORS)[number]}.body`) }
            : undefined;

    return (
        <div className="overflow-x-auto rounded-[14px]">
            <SortBar hint={combined ? ty('combinedHint') : null} clearLabel={ty('clearSort')} active={criteria.length > 0} onClear={clear} />
            <table className="data-table">
                <thead>
                    <tr>
                        {combined && <th>#</th>}
                        {columns.map(([key, label, numeric]) => (
                            <SortableTh
                                key={key}
                                id={key}
                                label={label}
                                sortLabel={ty('sortBy', { column: label })}
                                criteria={criteria}
                                onSort={onSort}
                                help={helpFor(key)}
                                className={numeric ? 'is-num' : undefined}
                            />
                        ))}
                        <th className="w-[88px]"><span className="sr-only">{th('action')}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {shown.map(({ row: { row, ...f }, position }) => (
                        <tr key={row.symbol}>
                            {combined && <td className="is-num text-faint">{position ?? '—'}</td>}
                            <td className="max-w-[320px]">
                                <Link href={`/stocks/${row.symbol}`} className="group flex items-center gap-3">
                                    {row.logo ? (
                                        <span className="logo-well"><img src={row.logo} alt="" className="size-full object-contain p-1" /></span>
                                    ) : (
                                        <span className="logo-well is-empty">{row.symbol[0]}</span>
                                    )}
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold text-foreground group-hover:text-brand-ink transition-colors" title={row.name}>{row.name}</span>
                                        <span className="mono block text-[12px] text-faint">{row.symbol}</span>
                                    </span>
                                </Link>
                            </td>
                            <td className="is-num font-semibold text-foreground">
                                <PriceFlash value={row.price} className="px-1">{row.price ? formatPrice(row.price, row.currency) : '—'}</PriceFlash>
                            </td>
                            <td className="is-num"><ChangePill value={row.price ? row.changePercent : null} /></td>
                            <td className="is-num text-muted-foreground">{row.price ? `${row.change > 0 ? '+' : ''}${row.change.toFixed(2)}` : '—'}</td>
                            <td className="is-num text-muted-foreground">{row.marketCap ? formatNumber(row.marketCap) : '—'}</td>
                            {showIndicators && (
                                <>
                                    <td className="is-num text-muted-foreground">{pct(f.dy)}</td>
                                    <td className="is-num text-muted-foreground">{num2(f.pe)}</td>
                                    <td className="is-num text-muted-foreground">{num2(f.pb)}</td>
                                    <td className="is-num text-muted-foreground">{pct(f.roe)}</td>
                                    <td className="is-num text-muted-foreground">{pct(f.roce)}</td>
                                </>
                            )}
                            <td>
                                <div className="flex items-center justify-end gap-1">
                                    <AddToListMenu symbol={row.symbol} company={row.name} lists={lists} />
                                    {hasFinnhubQuotes(row.symbol) ? (
                                        <CreateAlertModal symbol={row.symbol} currentPrice={row.price} currency={row.currency}>
                                            <button type="button" className="icon-btn" title={t('setAlertLabel', { symbol: row.symbol })} aria-label={t('setAlertLabel', { symbol: row.symbol })}>
                                                <Bell />
                                            </button>
                                        </CreateAlertModal>
                                    ) : (
                                        <span className="icon-btn opacity-40" title={t('alertsUnavailable')}><Bell /></span>
                                    )}
                                    <WatchlistButton
                                        symbol={row.symbol}
                                        company={row.name}
                                        isInWatchlist
                                        variant="icon"
                                        onWatchlistChange={(sym, added) => {
                                            if (!added) setBaseRows((current) => current.filter((r) => r.symbol !== sym));
                                        }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
