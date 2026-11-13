import { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import PageHero from '@/components/marketing/PageHero';
import { APP_NAME, SOURCE_URL, UPSTREAM_NAME, UPSTREAM_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: `Termos de uso | ${APP_NAME}`,
    description: 'Regras de uso, aviso sobre investimentos, origem dos dados e licença do código.',
};

const linkClass = 'font-semibold text-brand-ink hover:underline';

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: 'O que é o serviço',
        body: `O ${APP_NAME} é um painel para acompanhar cotações, indicadores, notícias e commodities. Ele não envia ordens, não guarda dinheiro e não tem ligação com corretoras.`,
    },
    {
        title: 'Dados de terceiros',
        body: 'Cotações e indicadores vêm do Yahoo Finance, os gráficos vêm do TradingView e as notícias vêm dos portais de origem. Os dados têm atraso, podem estar incompletos ou errados e podem sair do ar sem aviso.',
    },
    {
        title: 'Sem garantias',
        body: 'O serviço é oferecido como está, sem garantia de disponibilidade ou de exatidão. O uso das informações é por conta e risco de quem usa.',
    },
    {
        title: 'Sua conta',
        body: 'Para criar a conta pedimos nome, e-mail e senha. Guardamos também a sua lista de acompanhamento e as preferências que você informar. Esses dados servem só para o funcionamento do painel.',
    },
    {
        title: 'Uso aceitável',
        body: 'Não use robôs para extrair dados em volume, não tente derrubar ou invadir o serviço e não compartilhe o acesso da sua conta.',
    },
    {
        title: 'Código e licença',
        body: (
            <>
                O código é aberto, sob a licença AGPL-3.0, e está em{' '}
                <a href={SOURCE_URL} target="_blank" rel="noreferrer" className={linkClass}>{SOURCE_URL.replace('https://', '')}</a>. O projeto é baseado no{' '}
                <a href={UPSTREAM_URL} target="_blank" rel="noreferrer" className={linkClass}>{UPSTREAM_NAME}</a>.
            </>
        ),
    },
    {
        title: 'Dúvidas e mudanças',
        body: (
            <>
                Estes termos podem mudar; a data no topo mostra a última atualização. Dúvidas e problemas podem ser registrados em{' '}
                <a href={`${SOURCE_URL}/issues`} target="_blank" rel="noreferrer" className={linkClass}>{`${SOURCE_URL.replace('https://', '')}/issues`}</a>.
            </>
        ),
    },
];

export default function TermsPage() {
    return (
        <>
            <PageHero
                kicker="Termos · Atualizado em novembro de 2026"
                title="Termos de uso"
                sub="Regras curtas e diretas para usar o painel."
            />

            <section className="mx-auto mt-14 max-w-[1200px] px-5">
                <div className="hatch">
                    <div className="card flex gap-4 p-6 shadow-[inset_0_0_0_1px_oklch(0.76_0.119_70/0.35)]">
                        <AlertTriangle className="mt-0.5 size-5 flex-none text-warn" />
                        <div>
                            <h2 className="font-bold text-warn">Aviso sobre investimentos</h2>
                            <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
                                <strong className="text-foreground">O {APP_NAME} é uma ferramenta informativa e educacional.</strong>{' '}
                                Nada aqui é recomendação de investimento, análise de valores mobiliários ou oferta de compra ou venda de qualquer ativo.
                                Indicadores e ordenações são cálculos automáticos sobre dados públicos. As decisões são de quem investe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-14 flex max-w-[1200px] flex-col gap-8 px-5">
                {SECTIONS.map(({ title, body }) => (
                    <div key={title} className="max-w-3xl">
                        <h2 className="text-[18px] font-bold tracking-[-0.02em]">{title}</h2>
                        <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                ))}
            </section>
        </>
    );
}
