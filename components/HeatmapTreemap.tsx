'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { squarify } from '@/lib/treemap';
import { FULL_SCREEN_FRAME, FullScreenBackdrop, FullScreenButton, useFullScreen } from '@/components/FullScreen';

export type HeatmapCell = { ticker: string; href: string; name: string; cap: number; changePercent: number; detail: string };
export type HeatmapSector = { title: string; cells: HeatmapCell[] };

// The colour scale is full at a 3% move either way, like TradingView's heatmaps
const FULL_SCALE = 3;
const SECTOR_LABEL = 18; // px
const LEGEND = [-3, -2, -1, 0, 1, 2, 3];

// Diverging scale: a neutral grey at 0%, then a saturated green for gains and red for losses that brightens with the
// move. The scale has its own endpoints (not --up/--down mixed into grey, which looked washed out); the brightest
// step stays dark enough for the white label text.
const HEAT = {
    up: ['oklch(0.43 0.13 150)', 'oklch(0.66 0.23 146)'],
    down: ['oklch(0.43 0.15 25)', 'oklch(0.60 0.245 27)'],
} as const;

export function heatColor(changePercent: number): string {
    const strength = Math.min(1, Math.abs(changePercent) / FULL_SCALE);
    if (!Number.isFinite(changePercent) || strength < 0.02) return 'oklch(0.32 0.008 95)';
    const [low, high] = HEAT[changePercent > 0 ? 'up' : 'down'];
    // Eased, so an ordinary 0.5%–1% day already shows clear colour instead of sitting near the dark end
    return `color-mix(in oklab, ${high} ${Math.round(strength ** 0.65 * 100)}%, ${low})`;
}

const signed = (value: number, digits = 2) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}%`;

export default function HeatmapTreemap({ sectors, note }: { sectors: HeatmapSector[]; note: string }) {
    const box = useRef<HTMLDivElement>(null);
    // Full screen only resizes the box: the size observer below lays the blocks out again
    const { expanded, toggle, close } = useFullScreen();
    // A typical desktop panel until the real box is measured, so the first paint is already close
    const [size, setSize] = useState({ w: 800, h: 500 });

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const measure = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width > 0 && height > 0) setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const layout = useMemo(() => {
        const capOf = (sector: HeatmapSector) => sector.cells.reduce((sum, c) => sum + c.cap, 0);
        return squarify(sectors, capOf, { x: 0, y: 0, w: size.w, h: size.h }).map(({ item: sector, rect }) => {
            // Sectors too small for a title give the room to their blocks
            const labelled = rect.w >= 70 && rect.h >= 60;
            const inner = { x: 0, y: 0, w: rect.w, h: rect.h - (labelled ? SECTOR_LABEL : 0) };
            return { sector, rect, labelled, cells: squarify(sector.cells, (c) => c.cap, inner) };
        });
    }, [sectors, size]);

    // Everything is placed straight on the map box, in % of its measured size: no nested boxes whose height the browser
    // has to work out first, so a block can't collapse to nothing
    const place = (x: number, y: number, w: number, h: number) => ({
        left: `${(x / size.w) * 100}%`,
        top: `${(y / size.h) * 100}%`,
        width: `${(w / size.w) * 100}%`,
        height: `${(h / size.h) * 100}%`,
    });

    return (
        <>
        {expanded && <FullScreenBackdrop onClose={close} />}
        <div className={`flex flex-col gap-2 p-2 ${expanded ? FULL_SCREEN_FRAME : 'relative'}`}>
            <FullScreenButton expanded={expanded} onToggle={toggle} className="absolute end-3 top-3 z-10 size-7 bg-card/85 text-foreground shadow-sm backdrop-blur-sm" />
            <div ref={box} className={`relative w-full overflow-hidden rounded-[8px] ${expanded ? 'min-h-0 flex-1' : ''}`} style={expanded ? undefined : { height: 480 }} dir="ltr">
                {layout.map(({ sector, rect, labelled, cells }) => {
                    const top = rect.y + (labelled ? SECTOR_LABEL : 0);
                    return (
                        <section key={sector.title} aria-label={sector.title} className="contents">
                            {labelled && (
                                <h3
                                    className="absolute truncate px-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                                    style={{ ...place(rect.x, rect.y, rect.w, SECTOR_LABEL), lineHeight: `${SECTOR_LABEL}px` }}
                                >
                                    {sector.title}
                                </h3>
                            )}
                            {cells.map(({ item: cell, rect: r }) => {
                                const showTicker = r.w >= 40 && r.h >= 20;
                                const showChange = showTicker && r.h >= 38;
                                const fontSize = Math.max(10, Math.min(18, r.w / 5, r.h / 3));
                                const change = signed(cell.changePercent);
                                return (
                                    <Link
                                        key={cell.ticker}
                                        href={cell.href}
                                        title={`${cell.name} (${cell.ticker}) · ${change} · ${cell.detail}`}
                                        aria-label={`${cell.name} ${change}`}
                                        className="absolute flex flex-col items-center justify-center overflow-hidden rounded-[3px] border border-card text-center leading-tight text-white [text-shadow:0_1px_2px_oklch(0_0_0/0.45)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text"
                                        style={{ ...place(rect.x + r.x, top + r.y, r.w, r.h), background: heatColor(cell.changePercent), fontSize }}
                                    >
                                        {showTicker && <span className="mono font-semibold">{cell.ticker}</span>}
                                        {showChange && <span className="mono font-medium" style={{ fontSize: Math.max(10, fontSize * 0.78) }}>{change}</span>}
                                    </Link>
                                );
                            })}
                        </section>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
                <p className="min-w-0 flex-1 basis-64 text-[11.5px] text-muted-foreground">{note}</p>
                <ul className="flex gap-0.5" dir="ltr" aria-hidden="true">
                    {LEGEND.map((step) => (
                        <li key={step} className="mono rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-medium text-white" style={{ background: heatColor(step) }}>
                            {signed(step, 0)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        </>
    );
}
