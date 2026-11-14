import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownUp, Columns3, Github, Globe, History, Newspaper, Star, Wheat } from "lucide-react";
import SectionHead from "@/components/marketing/SectionHead";
import { HeatmapPreview, IndicatorsPreview } from "@/components/landing/BrazilPreview";
import { getLandingData } from "@/lib/landing-data";
import { APP_NAME, SOURCE_URL, UPSTREAM_NAME, UPSTREAM_URL } from "@/lib/constants";

export const metadata: Metadata = {
    title: `${APP_NAME}: bolsa brasileira, commodities e mercados globais`,
    description: 'Cotações da B3 com indicadores, mapa de calor, notícias e commodities em um só painel. Código aberto. Conteúdo informativo, não é recomendação de investimento.',
};

// The page carries real quotes, so it is rebuilt in the background at most every 15 minutes (the Yahoo requests behind
// it have their own, longer cache). Visitors always get a ready page; nobody waits for Yahoo.
export const revalidate = 900;

// Everything here only says what each screen shows: nothing may read as investment advice (CVM Resolution 20/2021)
const INDICATOR_POINTS = [
    { icon: ArrowDownUp, title: 'Ordenação por vários critérios', body: 'Clique em mais de um cabeçalho e a tabela soma as posições em um ranking combinado.' },
    { icon: History, title: 'Mediana histórica ao lado do número de hoje', body: 'Cada indicador vem com a mediana da própria empresa nos últimos exercícios.' },
    { icon: Columns3, title: 'Visões da tabela', body: 'Resumo, Preço, Rentabilidade, Dívida e liquidez, ou a sua própria escolha de colunas.' },
];

const DATA_SOURCES = [
    { name: 'Cotações e indicadores', body: 'Vêm do Yahoo Finance, com atraso. Algumas empresas, como as units, não têm todos os indicadores.' },
    { name: 'Gráficos', body: 'São fornecidos pelo TradingView e carregados direto do serviço deles.' },
    { name: 'Notícias', body: 'Títulos e links dos portais de origem. A leitura completa acontece no site de cada portal.' },
];

const step = (n: number) => ({ '--lp-step': n }) as React.CSSProperties;

export default async function LandingPage() {
    const data = await getLandingData();
    // Yahoo out of reach while the page was built: the page stands on its text alone
    const hasMap = data.sectors.length > 0;
    const hasTable = data.rows.length > 0;

    const alsoInPanel = [
        { icon: Wheat, title: 'Commodities', body: `${data.commodityCount} contratos futuros em cinco grupos: energia, metais, grãos, outros agrícolas e pecuária.` },
        { icon: Newspaper, title: 'Notícias em português', body: 'Manchetes de portais brasileiros de economia e mercado, reunidas no painel.' },
        { icon: Star, title: 'Lista de acompanhamento', body: 'Marque uma ação com a estrela e acompanhe preço e indicadores em uma tabela só sua.' },
        { icon: Globe, title: 'Outros mercados', body: `Bolsas de mais ${data.otherMarketCount} países, como Estados Unidos e Alemanha, além de câmbio e criptomoedas.` },
    ];

    return (
        <>
            <section className="mx-auto grid max-w-[1200px] items-center gap-x-10 gap-y-10 px-5 pb-6 pt-10 md:pt-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:pb-14 lg:pt-8">
                <div className={hasMap ? 'lg:col-span-5' : 'lg:col-span-9'}>
                    <p className="kicker lp-enter text-brand-ink" style={step(0)}>Gratuito · Código aberto</p>
                    <h1 className="lp-enter mt-4 text-[42px] font-bold leading-[1.02] tracking-[-0.05em] sm:text-[52px] xl:text-[60px]" style={step(1)}>
                        A bolsa brasileira inteira em uma tela.
                    </h1>
                    <p className="lp-enter mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground" style={step(2)}>
                        {data.stockCount} ações da B3 em {data.sectorCount} setores, com mapa de calor, 11 indicadores e a mediana histórica de cada empresa.
                    </p>
                    <div className="lp-enter mt-8 flex flex-wrap items-center gap-2" style={step(3)}>
                        <Link href="/sign-up" className="btn btn-primary h-11 px-5 text-[15px] max-sm:flex-1">Criar conta gratuita</Link>
                        <Link href="/sign-in" className="btn btn-ghost h-11 px-5 text-[15px] max-sm:flex-1">Já tenho conta</Link>
                    </div>
                    <p className="lp-enter mt-4 text-[13px] text-faint" style={step(4)}>Não pede cartão de crédito.</p>
                </div>
                {hasMap && (
                    <div className="lp-enter min-w-0 lg:col-span-7" style={step(3)}>
                        <HeatmapPreview data={data} />
                    </div>
                )}
            </section>

            <section id="recursos" className="mx-auto mt-20 grid max-w-[1200px] scroll-mt-24 items-center gap-x-10 gap-y-8 px-5 lg:mt-24 lg:grid-cols-12">
                <div className="lg:col-span-5 lg:order-2">
                    <SectionHead kicker="Indicadores" title="Os números de cada empresa, lado a lado." />
                    <ul className="flex flex-col gap-5">
                        {INDICATOR_POINTS.map(({ icon: Icon, title, body }) => (
                            <li key={title} className="flex gap-3.5">
                                <span className="bento-ico mt-0.5 size-9 shrink-0 bg-brand-soft text-brand-ink"><Icon className="size-[18px]" /></span>
                                <div>
                                    <h3 className="text-[16px] font-bold tracking-[-0.02em]">{title}</h3>
                                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {hasTable && (
                    <div className="min-w-0 lg:col-span-7 lg:order-1">
                        <IndicatorsPreview data={data} />
                    </div>
                )}
            </section>

            <section className="mx-auto mt-24 max-w-[1200px] px-5">
                <SectionHead kicker="Também no painel" title="Commodities, notícias e outros mercados no mesmo lugar." />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {alsoInPanel.map(({ icon: Icon, title, body }) => (
                        <div key={title} className="hatch lp-lift">
                            <div className="card flex h-full flex-col gap-3 p-5">
                                <span className="bento-ico size-9 bg-brand-soft text-brand-ink"><Icon className="size-[18px]" /></span>
                                <h3 className="text-[16px] font-bold tracking-[-0.02em]">{title}</h3>
                                <p className="text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="dados" className="mx-auto mt-24 grid max-w-[1200px] scroll-mt-24 gap-x-10 gap-y-2 px-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <SectionHead
                        kicker="Dados"
                        title="De onde vêm os números."
                        sub="Os dados são de terceiros, têm atraso e podem conter erros. Confira na fonte oficial antes de tomar qualquer decisão."
                    />
                </div>
                <dl className="lg:col-span-7">
                    {DATA_SOURCES.map(({ name, body }) => (
                        <div key={name} className="grid gap-x-6 gap-y-1 border-t border-line py-5 last:border-b sm:grid-cols-[11rem_1fr]">
                            <dt className="text-[16px] font-bold tracking-[-0.02em]">{name}</dt>
                            <dd className="text-[15px] leading-relaxed text-muted-foreground">{body}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section id="codigo-aberto" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-5">
                <div className="hatch">
                    <div className="card p-8 md:p-12">
                        <p className="kicker text-brand-ink">Código aberto</p>
                        <h2 className="mt-3 max-w-2xl text-[26px] font-semibold leading-snug tracking-[-0.03em] md:text-[30px]">
                            O código do {APP_NAME} é público, sob a licença AGPL-3.0.
                        </h2>
                        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                            O projeto é baseado no{' '}
                            <a href={UPSTREAM_URL} target="_blank" rel="noreferrer" className="font-semibold text-brand-ink hover:underline">{UPSTREAM_NAME}</a>
                            , com a parte de mercado brasileiro acrescentada aqui. Qualquer pessoa pode ler, copiar e melhorar.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-2">
                            <Link href="/sign-up" className="btn btn-primary h-11 px-5 text-[15px]">Criar conta gratuita</Link>
                            <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="btn btn-ghost h-11 px-5 text-[15px]"><Github /> Ver o código</a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
