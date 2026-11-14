import React from 'react';
import { heatColor } from '@/lib/heat';
import { formatDecimal, formatPercent } from '@/lib/format';
import { EXTREME_PE, isExtreme } from '@/lib/medians';
import { cn } from '@/lib/utils';
import type { LandingData, LandingRow } from '@/lib/landing-data';
import type { MedianKey } from '@/lib/yahoo';

// The landing page's two product frames, drawn from real B3 numbers (lib/landing-data.ts). Server-rendered, no script:
// the blocks come placed in %, and container queries (app/globals.css, "Landing page") decide which blocks have room
// for their text.

const LOCALE = 'pt';
const signed = (value: number, digits = 2) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatPercent(Math.abs(value), LOCALE, digits)}`;
const LEGEND = [-3, -2, -1, 0, 1, 2, 3];

// The app's window chrome: tab strip on the side colour, content on the canvas
export function AppFrame({ tabs, children, className }: { tabs: string[]; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('lp-frame overflow-hidden rounded-[18px] bg-side p-[3px]', className)}>
            <div className="flex items-end gap-1 overflow-hidden px-3 pt-2" aria-hidden>
                {tabs.map((label, i) => (
                    <span key={label} className={cn('flex h-9 shrink-0 items-center rounded-t-xl px-4 text-[13px] font-semibold', i === 0 ? 'bg-canvas text-foreground' : 'text-faint')}>
                        {label}
                    </span>
                ))}
            </div>
            <div className="rounded-[15px] bg-canvas p-2 sm:p-3">{children}</div>
        </div>
    );
}

const FrameHead = ({ title, note }: { title: string; note: string }) => (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-1.5 pb-2 pt-1">
        <h3 className="text-[15px] font-bold tracking-[-0.02em]">{title}</h3>
        <p className="text-[12px] text-faint">{note}</p>
    </div>
);

export function HeatmapPreview({ data }: { data: LandingData }) {
    const shown = data.sectors.reduce((sum, s) => sum + s.cells.length, 0);
    const box = (r: { x: number; y: number; w: number; h: number }) => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });
    return (
        <AppFrame tabs={['Brasil', 'EUA', 'Commodities', 'Câmbio']}>
            <FrameHead title="Mapa de calor da B3" note={`Yahoo Finance, com atraso · ${data.generatedAt} de Brasília`} />
            <div
                role="img"
                aria-label={`Mapa de calor com ${shown} ações da B3: o tamanho de cada bloco é o valor de mercado da empresa e a cor é a variação do dia.`}
                className="lp-map relative aspect-square w-full overflow-hidden rounded-[8px] sm:aspect-[16/10]"
            >
                {data.sectors.map((sector) => (
                    <React.Fragment key={sector.title}>
                        {sector.label && (
                            <span className="lp-sector absolute truncate px-1.5 font-semibold uppercase tracking-wide text-muted-foreground" style={box(sector.label)}>
                                {sector.title}
                            </span>
                        )}
                        {sector.cells.map((cell) => (
                            <span
                                key={cell.ticker}
                                title={`${cell.name} (${cell.ticker}) · ${signed(cell.changePercent)}`}
                                className="lp-cell absolute overflow-hidden rounded-[3px] border border-canvas"
                                style={{ ...box(cell.place), background: heatColor(cell.changePercent) }}
                            >
                                <span className="lp-cell-text">
                                    <span className="mono font-semibold">{cell.ticker}</span>
                                    <span className="lp-cell-change mono font-medium">{signed(cell.changePercent)}</span>
                                </span>
                            </span>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1.5 pt-2">
                <p className="text-[12px] text-faint">Tamanho: valor de mercado. Cor: variação do dia.</p>
                <ul className="flex gap-0.5" aria-hidden>
                    {LEGEND.map((step) => (
                        <li key={step} className="mono rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-medium text-white" style={{ background: heatColor(step) }}>
                            {signed(step, 0)}
                        </li>
                    ))}
                </ul>
            </div>
        </AppFrame>
    );
}

type Column = { key: MedianKey; label: string; percent?: boolean; className?: string };
const COLUMNS: Column[] = [
    { key: 'dy', label: 'DY', percent: true },
    { key: 'pe', label: 'P/L' },
    { key: 'pb', label: 'P/VP', className: 'max-sm:hidden' },
    { key: 'roe', label: 'ROE', percent: true, className: 'max-sm:hidden' },
];

const indicator = (value: number | null, percent?: boolean) => (value === null ? '—' : percent ? formatPercent(value, LOCALE, 1) : formatDecimal(value, LOCALE, 1, 1));

function IndicatorCell({ row, column }: { row: LandingRow; column: Column }) {
    const median = row.fundamentals.medians[column.key];
    return (
        <td className={cn('px-2 py-2.5 text-right align-top', column.className)}>
            <span className="mono relative block text-[13.5px] font-medium">
                {indicator(row.fundamentals[column.key], column.percent)}
                {isExtreme(column.key, row.fundamentals[column.key]) && <span className="absolute -end-2 text-warn" aria-hidden>*</span>}
            </span>
            <span className="mono block text-[11.5px] text-faint">{median === null ? '\u00a0' : `med. ${indicator(median, column.percent)}`}</span>
        </td>
    );
}

export function IndicatorsPreview({ data }: { data: LandingData }) {
    const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: data.currency });
    return (
        <AppFrame tabs={['Resumo', 'Preço', 'Rentabilidade', 'Dívida e liquidez']}>
            <FrameHead title="Cotações e indicadores" note={`As ${data.rows.length} maiores empresas da lista · Yahoo Finance, com atraso`} />
            <div className="card overflow-hidden">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-line text-[11.5px] font-bold uppercase tracking-wide text-faint">
                            <th scope="col" className="py-2.5 pl-3 pr-2 font-bold">Empresa</th>
                            <th scope="col" className="px-2 py-2.5 text-right font-bold">Preço</th>
                            {COLUMNS.map((c) => (
                                <th key={c.key} scope="col" className={cn('px-2 py-2.5 text-right font-bold', c.className)}>{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row) => (
                            <tr key={row.ticker} className="border-b border-line last:border-0">
                                <th scope="row" className="py-2.5 pl-3 pr-2 align-top font-normal">
                                    <span className="mono block text-[13.5px] font-semibold">{row.ticker}</span>
                                    <span className="block max-w-[9rem] truncate text-[11.5px] text-faint">{row.name}</span>
                                </th>
                                <td className="px-2 py-2.5 text-right align-top">
                                    <span className="mono block text-[13.5px] font-medium">{money.format(row.price)}</span>
                                    <span className={cn('mono block text-[11.5px] font-medium', row.changePercent > 0 ? 'text-up' : row.changePercent < 0 ? 'text-down' : 'text-faint')}>
                                        {signed(row.changePercent)}
                                    </span>
                                </td>
                                {COLUMNS.map((c) => <IndicatorCell key={c.key} row={row} column={c} />)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="px-1.5 pt-2 text-[12px] text-faint">“med.” é a mediana da própria empresa nos últimos exercícios.</p>
            {/* No script on this page, so the app's caution popover becomes a footnote */}
            {data.rows.some((row) => isExtreme('pe', row.fundamentals.pe)) && (
                <p className="px-1.5 pt-1 text-[12px] text-faint">
                    <span className="text-warn" aria-hidden>*</span> P/L acima de {EXTREME_PE} costuma vir de lucro muito baixo nos últimos 12 meses, e não só do preço da ação.
                </p>
            )}
        </AppFrame>
    );
}
