"use client";

import React, { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import CreateAlertModal from "./CreateAlertModal";
import AddToListMenu from "./AddToListMenu";
import WatchlistButton from "@/components/WatchlistButton";
import ChangePill from "@/components/ChangePill";
import PriceFlash from "@/components/PriceFlash";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { SearchButton } from "@/components/SearchCommand";
import { SortBar, SortableTh, useSortCriteria } from "@/components/SortableTable";
import { INDICATORS, IndicatorViewBar, formatIndicator, hasMedian, medianTone, medianValue, useIndicatorText, useIndicatorView, type IndicatorKey } from "@/components/IndicatorViews";
import { formatNumber, formatPrice } from "@/lib/utils";
import { formatSigned } from "@/lib/format";
import { hasFinnhubQuotes } from "@/lib/markets";
import { EMPTY_FUNDAMENTALS, rankByCriteria, type YahooFundamentals } from "@/lib/yahoo";
import type { getWatchlistData } from "@/lib/actions/finnhub.actions";

type Row = Awaited<ReturnType<typeof getWatchlistData>>[number];
type BaseKey = 'name' | 'price' | 'changePercent' | 'change' | 'marketCap';
type SortKey = BaseKey | IndicatorKey;
const SUGGESTIONS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN'];

export default function WatchlistTable({ initialRows, lists = [], fundamentals = {} }: { initialRows: Row[]; lists?: { id: string; name: string }[]; fundamentals?: Record<string, YahooFundamentals> }) {
    const locale = useLocale();
    const t = useTranslations('WatchlistTableRow');
    const th = useTranslations('WatchlistTable.headers');
    const ty = useTranslations('YahooQuotes');
    const { criteria, onSort, remove, clear, combined } = useSortCriteria<SortKey>();
    const { view, keys, select, toggle, medians, toggleMedians } = useIndicatorView('watchlist-indicator-view');
    const indicatorText = useIndicatorText();
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
        return {
            ...(fundamentals[row.symbol] ?? EMPTY_FUNDAMENTALS),
            row,
            name: row.name,
            price: row.price || null,
            change: row.price ? row.change : null,
            changePercent: row.price ? row.changePercent : null,
            marketCap: row.marketCap || null,
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

    // Day change in currency and market value only where there is room: the summary view, or a list without indicators
    const showExtras = !showIndicators || view === 'summary';
    const shownIndicators = showIndicators ? keys : [];
    const baseLabels: Record<BaseKey, string> = { name: th('company'), price: th('price'), changePercent: t('today'), change: th('change'), marketCap: th('marketCap') };
    const labelOf = (key: SortKey) => indicatorText.label(key) ?? baseLabels[key as BaseKey];
    const columns: [SortKey, boolean][] = [
        ['name', false],
        ['price', true],
        ['changePercent', true],
        ...(showExtras ? ([['change', true], ['marketCap', true]] as [SortKey, boolean][]) : []),
        ...shownIndicators.map((k) => [k, true] as [SortKey, boolean]),
    ];

    // Each indicator that has a history is followed by a narrow column with the company's own median of past years
    const withMedian = (key: SortKey): key is IndicatorKey => medians && showIndicators && (INDICATORS as readonly string[]).includes(key) && hasMedian(key as IndicatorKey);

    return (
        <div className="overflow-x-auto rounded-[14px]">
            {showIndicators && <IndicatorViewBar view={view} keys={keys} onSelect={select} onToggle={toggle} medians={medians} onToggleMedians={toggleMedians} />}
            <SortBar
                hint={combined ? ty('combinedHint') : null}
                clearLabel={ty('clearSort')}
                criteria={criteria}
                labelOf={labelOf}
                removeLabel={(column) => ty('removeSort', { column })}
                onRemove={remove}
                onClear={clear}
            />
            <table className="data-table">
                <thead>
                    <tr>
                        {combined && <th>#</th>}
                        {columns.map(([key, numeric]) => (
                            <Fragment key={key}>
                            <SortableTh
                                id={key}
                                label={labelOf(key)}
                                sortLabel={ty('sortBy', { column: labelOf(key) })}
                                criteria={criteria}
                                onSort={onSort}
                                help={indicatorText.help(key)}
                                className={numeric ? 'is-num' : undefined}
                            />
                            {withMedian(key) && <th className="is-num !ps-0 text-[12px] !font-normal" title={ty('medianTitle')}>{ty('medianShort')}</th>}
                            </Fragment>
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
                                <PriceFlash value={row.price} className="px-1">{row.price ? formatPrice(row.price, row.currency, locale) : '—'}</PriceFlash>
                            </td>
                            <td className="is-num"><ChangePill value={row.price ? row.changePercent : null} /></td>
                            {showExtras && (
                                <>
                                    <td className="is-num text-muted-foreground">{row.price ? formatSigned(row.change, locale) : '—'}</td>
                                    <td className="is-num text-muted-foreground">{row.marketCap ? formatNumber(row.marketCap, undefined, locale) : '—'}</td>
                                </>
                            )}
                            {shownIndicators.map((k) => (
                                <Fragment key={k}>
                                    <td className={`is-num ${(medians && medianTone(k, f[k], f.medians)) || 'text-muted-foreground'}`}>{formatIndicator(k, f[k], locale)}</td>
                                    {withMedian(k) && <td className="is-num !ps-0 text-[12px] text-faint">{formatIndicator(k, medianValue(k, f.medians), locale)}</td>}
                                </Fragment>
                            ))}
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
