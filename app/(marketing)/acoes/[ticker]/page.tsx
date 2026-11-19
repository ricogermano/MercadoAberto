import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ptMessages from '@/messages/pt.json';
import SignUpCta from '@/components/seo/SignUpCta';
import TradingViewEmbed from '@/components/seo/TradingViewEmbed';
import { getYahooDailyQuotes, getYahooFundamentals } from '@/lib/actions/yahoo.actions';
import { APP_NAME, CANDLE_CHART_WIDGET_CONFIG } from '@/lib/constants';
import { formatCompact, formatDecimal, formatPercent, formatSigned } from '@/lib/format';
import { b3Path, findB3Stock, sectorPeers, type B3Stock } from '@/lib/seo/b3';
import { siteUrl } from '@/lib/seo/site';
import { tradingViewSymbolUrl } from '@/lib/utils';
import { MEDIAN_KEYS, type MedianKey, type YahooFundamentals } from '@/lib/yahoo';

// Public page per B3 stock, for search engines and visitors without an account. Same Yahoo requests (and cache) as the
// Brazil dashboard; the page itself is rebuilt in the background at most every 15 minutes, like the landing page.
// Every sentence only says what a number is: nothing may read as investment advice (CVM Resolution 20/2021).
export const revalidate = 900;

type Params = { ticker: string };

// Nothing built ahead: ~100 stocks × 4 Yahoo requests would slow every deploy. Each page is cached on its first visit.
export function generateStaticParams(): Params[] {
    return [];
}

const WIDGET = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const L = 'pt';
const text = ptMessages.YahooQuotes;

const INDICATORS = ['dy', 'pe', 'pb', 'evEbitda', 'roe', 'roce', 'netMargin', 'payout', 'profitGrowth', 'netDebtEbitda', 'liquidity'] as const;
type Indicator = (typeof INDICATORS)[number];
const PERCENT = new Set<Indicator>(['dy', 'payout', 'roe', 'roce', 'netMargin', 'profitGrowth']);

const formatValue = (key: Indicator, value: number | null | undefined) =>
    value === null || value === undefined || !Number.isFinite(value) ? '—'
        : key === 'liquidity' ? `R$ ${formatCompact(value, L)}`
            : PERCENT.has(key) ? formatPercent(value, L, 1) : formatDecimal(value, L);

const medianOf = (key: Indicator, f: YahooFundamentals) => ((MEDIAN_KEYS as readonly string[]).includes(key) ? f.medians[key as MedianKey] : null);
const brl = (value: number) => `R$ ${formatDecimal(value, L)}`;

async function loadStock(stock: B3Stock) {
    const [quotes, fundamentals] = await Promise.all([
        getYahooDailyQuotes([stock.symbol]).catch(() => ({}) as Awaited<ReturnType<typeof getYahooDailyQuotes>>),
        getYahooFundamentals([stock.symbol]).catch(() => ({}) as Awaited<ReturnType<typeof getYahooFundamentals>>),
    ]);
    return { quote: quotes[stock.symbol] ?? null, fundamentals: fundamentals[stock.symbol] ?? null };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const stock = findB3Stock((await params).ticker);
    if (!stock) return { title: `Ação não encontrada | ${APP_NAME}`, robots: { index: false } };
    const { quote, fundamentals: f } = await loadStock(stock);

    const title = `${stock.ticker} (${stock.name}): cotação hoje, P/L, P/VP e dividend yield | ${APP_NAME}`;
    const figures = [
        quote && `${brl(quote.price)} (${formatSigned(quote.changePercent, L)}% no dia)`,
        f?.pe != null && `P/L ${formatValue('pe', f.pe)}`,
        f?.pb != null && `P/VP ${formatValue('pb', f.pb)}`,
        f?.dy != null && `DY ${formatValue('dy', f.dy)}`,
    ].filter(Boolean).join(', ');
    const description = `Cotação de ${stock.ticker} (${stock.name})${figures ? `: ${figures}` : ''}. Indicadores ao lado da mediana histórica da empresa. Dados do Yahoo Finance. Não é recomendação de investimento.`;
    const url = `${siteUrl()}${b3Path(stock.ticker)}`;
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: APP_NAME, type: 'website', locale: 'pt_BR' },
        robots: { index: true, follow: true },
    };
}

export default async function B3StockPage({ params }: { params: Promise<Params> }) {
    const stock = findB3Stock((await params).ticker);
    if (!stock) notFound();
    const { quote, fundamentals } = await loadStock(stock);

    const tvSymbol = stock.symbol;
    const peers = sectorPeers(stock);
    const updatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

    return (
        <article className="mx-auto max-w-[1200px] px-5 pt-10 pb-4">
            <nav aria-label="Navegação estrutural" className="flex flex-wrap items-center gap-x-2 text-[13px] font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground">{APP_NAME}</Link>
                <span aria-hidden>/</span>
                <Link href="/acoes" className="hover:text-foreground">Ações da B3</Link>
                <span aria-hidden>/</span>
                <span className="text-foreground">{stock.ticker}</span>
            </nav>

            <header className="mt-6 max-w-3xl">
                <p className="kicker text-brand-ink">B3 · {stock.sector}</p>
                <h1 className="mt-2 text-[36px] font-bold leading-[1.05] tracking-[-0.045em] md:text-[48px]">{stock.name} ({stock.ticker}): cotação e indicadores</h1>
                <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
                    Cotação de {stock.ticker} com a variação do dia e os principais indicadores da {stock.name}, cada um ao lado da mediana da própria empresa nos últimos exercícios. Dados do Yahoo Finance, com atraso. Conteúdo informativo, não é recomendação de investimento.
                </p>
            </header>

            <section className="hatch mt-8">
                <div className="card flex flex-wrap items-end gap-x-8 gap-y-2 p-6">
                    {quote ? (
                        <>
                            <p className="mono text-[40px] font-bold tracking-[-0.03em]">{brl(quote.price)}</p>
                            <p className={`mono text-[20px] font-semibold ${quote.changePercent >= 0 ? 'text-up' : 'text-down'}`}>{formatSigned(quote.changePercent, L)}% no dia</p>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Cotação indisponível no momento.</p>
                    )}
                    <p className="w-full text-[13px] text-muted-foreground">Atualizado em {updatedAt} (horário de Brasília). Fonte: Yahoo Finance.</p>
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-[28px] font-bold tracking-[-0.04em]">Indicadores de {stock.ticker}</h2>
                {fundamentals ? (
                    <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {INDICATORS.map((key) => {
                            const median = medianOf(key, fundamentals);
                            return (
                                <div key={key} className="card flex flex-col gap-1 p-5">
                                    <dt className="kicker">{text[key]}</dt>
                                    <dd className="mono text-[24px] font-bold">{formatValue(key, fundamentals[key])}</dd>
                                    {median !== null && <dd className="text-[13px] text-muted-foreground">Mediana da empresa: {formatValue(key, median)}</dd>}
                                    <dd className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{text.help[key].body}</dd>
                                </div>
                            );
                        })}
                    </dl>
                ) : (
                    <p className="mt-4 text-muted-foreground">Indicadores indisponíveis no momento.</p>
                )}
            </section>

            <section className="hatch mt-10">
                <div className="card p-1">
                    <TradingViewEmbed
                        scriptUrl={`${WIDGET}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(tvSymbol, 'pt')}
                        height={520}
                        creditHref={tradingViewSymbolUrl(tvSymbol)}
                        creditLabel={`Gráfico de ${stock.ticker} pelo TradingView`}
                    />
                </div>
            </section>

            {peers.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-[28px] font-bold tracking-[-0.04em]">Outras empresas de {stock.sector}</h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {peers.map((p) => (
                            <li key={p.ticker}>
                                <Link href={b3Path(p.ticker)} className="btn btn-ghost h-9 px-3 text-[14px]">{p.ticker} · {p.name}</Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="mt-10">
                <SignUpCta
                    title={`Acompanhe ${stock.ticker} no painel`}
                    body="Crie uma conta grátis para ver a tabela completa com ranking, o mapa de calor da B3, as notícias do mercado e montar suas listas."
                    href="/sign-up"
                    label="Criar conta grátis"
                />
            </div>
        </article>
    );
}
