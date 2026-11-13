import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownUp, CandlestickChart, Github, Grid3x3, Newspaper, Star, Wheat } from "lucide-react";
import SectionHead from "@/components/marketing/SectionHead";
import IconCard from "@/components/marketing/IconCard";
import { APP_NAME, SOURCE_URL, UPSTREAM_NAME, UPSTREAM_URL } from "@/lib/constants";

export const metadata: Metadata = {
    title: `${APP_NAME}: bolsa brasileira, commodities e mercados globais`,
    description: 'Cotações da B3 com indicadores, mapa de calor, notícias e commodities em um só painel. Código aberto. Conteúdo informativo, não é recomendação de investimento.',
};

// Descriptions only say what each screen shows: nothing here may read as investment advice (CVM Resolution 20/2021)
const FEATURES = [
    { icon: ArrowDownUp, title: 'Tabela da B3 com indicadores', body: 'Ações brasileiras por setor, com DY, P/L, P/VP, ROE e ROCE. Clique no cabeçalho para ordenar por um ou mais indicadores.' },
    { icon: Grid3x3, title: 'Mapa de calor', body: 'O dia da bolsa em uma tela: cada empresa com tamanho pelo valor de mercado e cor pela variação.' },
    { icon: Newspaper, title: 'Notícias em português', body: 'Manchetes de portais brasileiros de economia e mercado, reunidas no painel.' },
    { icon: Wheat, title: 'Commodities', body: 'Trinta contratos futuros em cinco grupos: energia, metais, grãos, outros agrícolas e pecuária.' },
    { icon: Star, title: 'Lista de acompanhamento', body: 'Marque uma ação com a estrela e acompanhe preço e indicadores em uma tabela só sua.' },
    { icon: CandlestickChart, title: 'Gráficos e outros mercados', body: 'Gráficos interativos por empresa e painéis de outros mercados, como Estados Unidos, além do Brasil.' },
];

const DATA_SOURCES = [
    { name: 'Cotações e indicadores', body: 'Vêm do Yahoo Finance, com atraso. Algumas empresas, como as units, não têm todos os indicadores.' },
    { name: 'Gráficos', body: 'São fornecidos pelo TradingView e carregados direto do serviço deles.' },
    { name: 'Notícias', body: 'Títulos e links dos portais de origem. A leitura completa acontece no site de cada portal.' },
];

export default function LandingPage() {
    return (
        <>
            <section className="mx-auto max-w-[1200px] px-5 pt-14 md:pt-20">
                <p className="kicker text-brand-ink">Código aberto · Gratuito</p>
                <h1 className="mt-4 max-w-3xl text-[44px] font-bold leading-[1.02] tracking-[-0.05em] md:text-[68px]">
                    O mercado brasileiro em um só painel.
                </h1>
                <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                    Cotações da B3 com indicadores, mapa de calor, notícias e commodities, lado a lado com os mercados globais.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-2">
                    <Link href="/sign-up" className="btn btn-primary h-11 px-5 text-[15px]">Criar conta gratuita</Link>
                    <Link href="/sign-in" className="btn btn-ghost h-11 px-5 text-[15px]">Já tenho conta</Link>
                </div>
            </section>

            <section id="recursos" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-5">
                <SectionHead kicker="Recursos" title="O que você encontra no painel." />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ icon, title, body }) => (
                        <IconCard key={title} icon={icon} title={title}>{body}</IconCard>
                    ))}
                </div>
            </section>

            <section id="dados" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-5">
                <SectionHead
                    kicker="Dados"
                    title="De onde vêm os números."
                    sub="Os dados são de terceiros, têm atraso e podem conter erros. Confira na fonte oficial antes de tomar qualquer decisão."
                />
                <div className="grid gap-3 lg:grid-cols-3">
                    {DATA_SOURCES.map(({ name, body }) => (
                        <div key={name} className="hatch">
                            <div className="card flex h-full flex-col gap-2 p-5">
                                <h3 className="text-[16px] font-bold tracking-[-0.02em]">{name}</h3>
                                <p className="text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                            </div>
                        </div>
                    ))}
                </div>
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
