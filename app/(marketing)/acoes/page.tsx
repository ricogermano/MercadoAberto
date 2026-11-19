import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { B3_SECTORS, B3_STOCKS, b3Path } from '@/lib/seo/b3';
import { siteUrl } from '@/lib/seo/site';

// Directory of the public B3 stock pages, by sector: the way in for visitors and for crawlers following links
export const revalidate = 86400;

const title = `Ações da B3: cotação e indicadores por empresa | ${APP_NAME}`;
const description = `Cotação, P/L, P/VP, dividend yield e outros indicadores de ${B3_STOCKS.length} ações da B3, organizadas por setor. Dados do Yahoo Finance. Não é recomendação de investimento.`;

export function generateMetadata(): Metadata {
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: `${siteUrl()}/acoes` },
        openGraph: { title, description, url: `${siteUrl()}/acoes`, siteName: APP_NAME, type: 'website', locale: 'pt_BR' },
    };
}

export default function B3StocksPage() {
    return (
        <article className="mx-auto max-w-[1200px] px-5 pt-10 pb-4">
            <header className="max-w-3xl">
                <p className="kicker text-brand-ink">B3</p>
                <h1 className="mt-2 text-[36px] font-bold leading-[1.05] tracking-[-0.045em] md:text-[48px]">Ações da B3</h1>
                <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
                    Escolha uma empresa para ver a cotação do dia e os indicadores ao lado da mediana histórica da própria empresa. Dados do Yahoo Finance, com atraso. Conteúdo informativo, não é recomendação de investimento.
                </p>
            </header>

            {B3_SECTORS.map((sector) => (
                <section key={sector.title} className="mt-10">
                    <h2 className="text-[24px] font-bold tracking-[-0.04em]">{sector.title}</h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {sector.stocks.map((s) => (
                            <li key={s.ticker}>
                                <Link href={b3Path(s.ticker)} className="btn btn-ghost h-9 px-3 text-[14px]">{s.ticker} · {s.name}</Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </article>
    );
}
