import Link from "next/link";
import { Database, LayoutDashboard, type LucideIcon, Search, Settings2, Sparkles, Star, Table2, Telescope } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('GuidePage');
    return { title: `${t('metaTitle')} | MercadoAberto` };
}

// The walkthrough is written in Brazilian Portuguese only (the product's audience). It describes how the screens work,
// never what to buy or sell (CVM Resolution 20/2021). The glossary below it reuses the help texts of the tables, which
// exist in every interface language.
type Section = { id: string; icon: LucideIcon; title: string; intro?: string; steps: string[] };

const SECTIONS: Section[] = [
    {
        id: 'o-que-e',
        icon: Telescope,
        title: 'O que é o MercadoAberto',
        intro: 'Um painel gratuito e sem anúncios para acompanhar a bolsa brasileira e outros mercados: cotações, indicadores das empresas, mapa de calor e notícias.',
        steps: [
            'O conteúdo é informativo e educacional. O aplicativo não recomenda compra nem venda de nenhum ativo.',
            'Você não envia ordens por aqui: o MercadoAberto não é corretora e não tem acesso à sua conta.',
            'O código é aberto (licença AGPL-3.0); o link fica no rodapé de todas as telas.',
        ],
    },
    {
        id: 'visao-geral',
        icon: LayoutDashboard,
        title: 'Visão geral: o painel',
        intro: 'É a primeira tela depois do login. Mostra um mercado por vez.',
        steps: [
            'Escolha o mercado nas abas do alto: Brasil, EUA, outros países, Commodities, Câmbio e Cripto. Um ponto indica se o mercado está aberto agora.',
            'Os quadros do topo trazem os principais índices. No Brasil: Ibovespa, IFIX, Small Cap e Dividendos. O “?” de cada quadro explica o índice.',
            'O mapa de calor do Brasil mostra cada empresa com área proporcional ao valor de mercado e cor conforme a variação do dia.',
            'Abaixo ficam a tabela de cotações, separada por setor, e as notícias do mercado escolhido.',
            'Na aba Commodities, a unidade de negociação aparece ao lado do nome de cada contrato.',
        ],
    },
    {
        id: 'tabela',
        icon: Table2,
        title: 'Tabela de cotações e indicadores',
        intro: 'A tabela tem onze indicadores. Para não ficar larga demais, ela mostra um grupo por vez.',
        steps: [
            'Troque de grupo nas visões acima da tabela: Resumo, Preço, Rentabilidade e Dívida e liquidez.',
            'Para montar o seu grupo, clique em “Colunas” e marque os indicadores. A escolha vira a “Minha visão” e fica guardada neste navegador.',
            'Clique no cabeçalho de uma coluna para ordenar por ela. Clique de novo para inverter a ordem.',
            'Clique em mais de um cabeçalho para um ranking combinado: as posições da empresa em cada coluna são somadas, e o menor total vem primeiro. Empresas sem algum dos valores ficam por último.',
            'Os critérios em uso aparecem como etiquetas acima da tabela. O “x” tira um critério; “Limpar ordenação” volta à ordem original.',
            'O “?” ao lado do nome da coluna explica o indicador e como ele é calculado.',
            'A estrela no começo da linha coloca a ação na sua lista de acompanhamento.',
        ],
    },
    {
        id: 'lista',
        icon: Star,
        title: 'Lista de acompanhamento',
        intro: 'Reúne as ações que você marcou com estrela, com os mesmos indicadores e a mesma ordenação do painel.',
        steps: [
            'Marque a estrela em qualquer tabela ou na página da ação. As ações marcadas também aparecem na barra lateral, em “Acompanhando”.',
            'Use “Adicionar símbolo” para buscar uma ação e incluí-la direto na lista.',
            'Em “Minhas listas” você agrupa ações em listas com nome (por exemplo, por setor ou por tema). Excluir uma lista não tira a estrela das ações.',
            'A área de notícias mostra o que saiu sobre as ações que você acompanha.',
            'Alertas de preço por e-mail ainda não estão disponíveis nesta versão.',
        ],
    },
    {
        id: 'acao',
        icon: Search,
        title: 'Buscar e abrir uma ação',
        steps: [
            'Clique em “Buscar ações” na barra lateral, ou use o atalho ⌘K (Ctrl+K no Windows), e digite o nome da empresa ou o código.',
            'Ações da B3 usam o código da bolsa, como PETR4 ou VALE3.',
            'A página da ação traz o gráfico, os dados da empresa e o botão para acompanhar.',
            'Cada página aberta vira uma aba no alto da tela, como num navegador. Feche no “x” da aba; “Visão geral” e “Lista de acompanhamento” ficam sempre abertas.',
        ],
    },
    {
        id: 'ajustes',
        icon: Settings2,
        title: 'Ajustes',
        steps: [
            'Tema: claro, escuro ou automático (segue o seu aparelho), na parte de baixo da barra lateral.',
            'Idioma: português, inglês, polonês ou árabe, no seletor logo abaixo do tema.',
            'Perfil: clique no seu nome, no rodapé da barra lateral, para alterar nome, senha e preferências.',
            'No celular, a barra lateral abre pelo botão de menu no canto superior.',
        ],
    },
    {
        id: 'dados',
        icon: Database,
        title: 'De onde vêm os dados e o que observar',
        intro: 'Vale conhecer os limites dos números antes de usá-los.',
        steps: [
            'Cotações do Brasil, de outros países e de commodities vêm do Yahoo Finance, com atraso de cerca de 15 minutos.',
            'Os indicadores usam os últimos doze meses divulgados pelas empresas e podem conter erros da fonte. Confira no relatório da empresa antes de tomar qualquer decisão.',
            'Units (como BPAC11, SANB11 e TAEE11) não têm P/L nem P/VP na fonte e aparecem com “—”.',
            'Bancos e seguradoras não têm EBITDA; por isso EV/EBITDA, dívida líquida/EBITDA e ROCE ficam vazios para eles.',
            'Ganhos ou perdas pontuais distorcem P/L, payout e margem. Em holdings, a margem líquida pode passar de 100%.',
            'O crescimento do lucro considera três anos, que é o histórico disponível na fonte.',
            'Resultados passados não indicam resultados futuros.',
        ],
    },
];

const INDICATORS = ['dy', 'pe', 'pb', 'evEbitda', 'payout', 'roe', 'roce', 'netMargin', 'profitGrowth', 'netDebtEbitda', 'liquidity'] as const;
const INDEXES = ['IBOV', 'IFIX', 'SMLL', 'IDIV'] as const;

const Glossary = ({ id, title, sub, terms }: { id: string; title: string; sub: string; terms: { title: string; body: string }[] }) => (
    <section id={id} className="hatch scroll-mt-3">
        <div className="section-head">
            <div className="min-w-0">
                <h2 className="section-title">{title}</h2>
                <p className="section-sub">{sub}</p>
            </div>
        </div>
        <dl className="card divide-y divide-line px-5">
            {terms.map((term) => (
                <div key={term.title} className="py-3.5">
                    <dt className="text-[14px] font-bold text-foreground">{term.title}</dt>
                    <dd className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{term.body}</dd>
                </div>
            ))}
        </dl>
    </section>
);

export default async function GuidePage() {
    const [t, tHelp, tIndex, locale] = await Promise.all([
        getTranslations('GuidePage'),
        getTranslations('YahooQuotes.help'),
        getTranslations('IndexHelp.items'),
        getLocale(),
    ]);

    const contents = [
        ...SECTIONS.map(({ id, title }) => ({ id, title })),
        { id: 'indicadores', title: t('glossaryTitle') },
        { id: 'indices', title: t('indexesTitle') },
    ];

    return (
        <>
            <header className="page-head">
                <div>
                    <h1 className="page-title">{t('title')}</h1>
                    <p className="page-sub">{t('sub')}</p>
                    {locale !== 'pt' && <p className="page-sub">{t('onlyPortuguese')}</p>}
                </div>
                <Link href="/updates" className="btn btn-ghost">
                    <Sparkles className="size-4" /> {t('seeUpdates')}
                </Link>
            </header>

            <div className="flex max-w-[860px] flex-col gap-3">
                <nav aria-label={t('contents')} className="flex flex-wrap gap-1.5 px-1">
                    {contents.map(({ id, title }) => (
                        <a key={id} href={`#${id}`} className="pill h-7 px-3 transition-colors hover:text-foreground">{title}</a>
                    ))}
                </nav>

                {/* The walkthrough is Portuguese whatever the interface language */}
                <div className="flex flex-col gap-3" lang="pt-BR" dir="ltr">
                    {SECTIONS.map(({ id, icon: Icon, title, intro, steps }) => (
                        <section key={id} id={id} className="hatch scroll-mt-3">
                            <div className="section-head">
                                <h2 className="section-title flex items-center gap-2"><Icon className="size-4 text-brand-ink" /> {title}</h2>
                            </div>
                            <div className="card p-5 text-[14px] leading-relaxed">
                                {intro && <p className="mb-3 text-foreground">{intro}</p>}
                                <ul className="flex list-disc flex-col gap-1.5 ps-5 text-muted-foreground marker:text-faint">
                                    {steps.map((step) => <li key={step}>{step}</li>)}
                                </ul>
                            </div>
                        </section>
                    ))}
                </div>

                <Glossary
                    id="indicadores"
                    title={t('glossaryTitle')}
                    sub={t('glossarySub')}
                    terms={INDICATORS.map((key) => ({ title: tHelp(`${key}.title`), body: tHelp(`${key}.body`) }))}
                />
                <Glossary
                    id="indices"
                    title={t('indexesTitle')}
                    sub={t('indexesSub')}
                    terms={INDEXES.map((key) => ({ title: tIndex(`${key}.title`), body: tIndex(`${key}.body`) }))}
                />
            </div>
        </>
    );
}
