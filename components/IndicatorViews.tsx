'use client';

import { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { SortHelp } from '@/components/SortableTable';
import { MEDIAN_KEYS, type MedianKey, type YahooFundamentals, type YahooMedians } from '@/lib/yahoo';
import { medianSide } from '@/lib/medians';

// Shared by the Yahoo quotes table and the watchlist table: eleven indicators are too many columns to show at once, so the
// tables show one "view" (a themed handful of them) at a time, or the reader's own pick, remembered in the browser.

// In the order of the column picker and of a custom view
export const INDICATORS = ['dy', 'pe', 'pb', 'evEbitda', 'payout', 'roe', 'roce', 'netMargin', 'profitGrowth', 'netDebtEbitda', 'liquidity'] as const satisfies readonly (keyof YahooFundamentals)[];
export type IndicatorKey = (typeof INDICATORS)[number];

const PRESETS = {
    summary: ['dy', 'pe', 'pb', 'roe'],
    valuation: ['pe', 'pb', 'evEbitda', 'dy', 'payout'],
    profitability: ['roe', 'roce', 'netMargin', 'profitGrowth'],
    debt: ['netDebtEbitda', 'liquidity'],
} as const satisfies Record<string, readonly IndicatorKey[]>;
type Preset = keyof typeof PRESETS;
const PRESET_NAMES = Object.keys(PRESETS) as Preset[];
export type IndicatorView = Preset | 'custom';

const PERCENT = new Set<IndicatorKey>(['dy', 'payout', 'roe', 'roce', 'netMargin', 'profitGrowth']);
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatIndicator(key: IndicatorKey, value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—';
    if (key === 'liquidity') return compact.format(value);
    if (PERCENT.has(key)) return `${value.toFixed(1)}%`;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Indicators whose column is followed by the company's own median of past years
export const hasMedian = (key: IndicatorKey): key is IndicatorKey & MedianKey => (MEDIAN_KEYS as readonly string[]).includes(key);
export const medianValue = (key: IndicatorKey, medians: YahooMedians): number | null => (hasMedian(key) ? medians[key] : null);
// Colour of today's value by the side of the company's own median it sits on; '' when there is nothing to compare
export function medianTone(key: IndicatorKey, value: number | null | undefined, medians: YahooMedians): string {
    const side = hasMedian(key) ? medianSide(key, value, medians[key]) : null;
    return side === 'better' ? 'text-up' : side === 'worse' ? 'text-down' : '';
}

const isIndicator = (k: unknown): k is IndicatorKey => (INDICATORS as readonly unknown[]).includes(k);

// The chosen view and the indicator columns it shows. Starts on the summary (also what the server renders) and then picks up
// what this browser saved; storage can be blocked, so every access is guarded and the table works without it.
export function useIndicatorView(storageKey: string) {
    const [view, setView] = useState<IndicatorView>('summary');
    const [custom, setCustom] = useState<IndicatorKey[]>([...PRESETS.summary]);
    const [medians, setMedians] = useState(true);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as { view?: unknown; custom?: unknown; medians?: unknown } | null;
            if (!saved) return;
            if (Array.isArray(saved.custom)) setCustom(INDICATORS.filter((k) => (saved.custom as unknown[]).includes(k)));
            if (saved.view === 'custom' || PRESET_NAMES.includes(saved.view as Preset)) setView(saved.view as IndicatorView);
            if (saved.medians === false) setMedians(false);
        } catch {}
    }, [storageKey]);

    const save = useCallback(
        (nextView: IndicatorView, nextCustom: IndicatorKey[], nextMedians: boolean) => {
            setView(nextView);
            setCustom(nextCustom);
            setMedians(nextMedians);
            try {
                localStorage.setItem(storageKey, JSON.stringify({ view: nextView, custom: nextCustom, medians: nextMedians }));
            } catch {}
        },
        [storageKey],
    );

    const keys: readonly IndicatorKey[] = view === 'custom' ? custom : PRESETS[view];
    const select = useCallback((next: IndicatorView) => save(next, custom, medians), [save, custom, medians]);
    const toggleMedians = useCallback(() => save(view, custom, !medians), [save, view, custom, medians]);
    // Ticking a column starts a custom view from whatever is on screen
    const toggle = useCallback(
        (key: IndicatorKey) => {
            const has = keys.includes(key);
            save('custom', INDICATORS.filter((k) => (k === key ? !has : keys.includes(k))), medians);
        },
        [save, keys, medians],
    );
    return { view, keys, select, toggle, medians, toggleMedians };
}

// Column titles and "?" explanations of the indicators, in the reader's language
export function useIndicatorText() {
    const t = useTranslations('YahooQuotes');
    const label = (key: string) => (isIndicator(key) ? t(key) : null);
    const help = (key: string): SortHelp | undefined =>
        isIndicator(key) ? { label: t('helpAbout', { column: t(key) }), title: t(`help.${key}.title`), body: t(`help.${key}.body`) } : undefined;
    return { label, help };
}

// The row of view buttons above a table, with the column picker at the end
export function IndicatorViewBar({
    view,
    keys,
    onSelect,
    onToggle,
    medians,
    onToggleMedians,
}: {
    view: IndicatorView;
    keys: readonly IndicatorKey[];
    onSelect: (view: IndicatorView) => void;
    onToggle: (key: IndicatorKey) => void;
    medians: boolean;
    onToggleMedians: () => void;
}) {
    const t = useTranslations('YahooQuotes');
    return (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-2" role="group" aria-label={t('views.label')}>
            {[...PRESET_NAMES, 'custom' as const].map((name) => (
                <button
                    key={name}
                    type="button"
                    onClick={() => onSelect(name)}
                    aria-pressed={view === name}
                    className={`pill h-7 cursor-pointer px-3 font-semibold transition-colors hover:text-foreground ${view === name ? 'is-brand' : ''}`}
                >
                    {t(`views.${name}`)}
                </button>
            ))}
            <Popover>
                <PopoverTrigger asChild>
                    <button type="button" className="pill ms-auto h-7 cursor-pointer gap-1.5 px-3 font-semibold transition-colors hover:text-foreground">
                        <SlidersHorizontal aria-hidden /> {t('views.columns')}
                    </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3 text-[13px]">
                    <p className="mb-2 text-[11.5px] text-faint">{t('views.columnsHint')}</p>
                    <ul className="flex flex-col gap-1.5">
                        {INDICATORS.map((key) => (
                            <li key={key}>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input type="checkbox" className="accent-[var(--brand)]" checked={keys.includes(key)} onChange={() => onToggle(key)} />
                                    {t(`help.${key}.title`)}
                                </label>
                            </li>
                        ))}
                    </ul>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-line/60 pt-3">
                        <input type="checkbox" className="accent-[var(--brand)]" checked={medians} onChange={onToggleMedians} />
                        {t('views.medians')}
                    </label>
                </PopoverContent>
            </Popover>
        </div>
    );
}
