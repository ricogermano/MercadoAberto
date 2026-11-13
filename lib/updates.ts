// What the "Novidades" page (/updates) shows. Newest first: to announce a change, add an entry (or an item) at the top.
// Written in Brazilian Portuguese only, like the guide: the product's audience. Describe what the reader can now do,
// in plain words, never as investment advice (CVM Resolution 20/2021).

export type UpdateEntry = {
    /** ISO day, e.g. 2026-11-13 */
    date: string;
    title: string;
    items: string[];
};

export const UPDATES: UpdateEntry[] = [
    {
        date: '2026-11-13',
        title: 'Melhor no celular e no tema escuro',
        items: [
            'No iPhone, a tela não fica mais ampliada e cortada à direita depois de entrar.',
            'No tema escuro, os quadros do TradingView (Pulso, Líderes, Cotações, Notícias) deixam de aparecer com fundo branco e letra apagada.',
            'No celular, os quadros do Pulso ficam um por linha, com o nome inteiro.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Excluir a conta pelo Perfil',
        items: [
            'Na tela “Perfil” há agora o botão “Excluir minha conta”: ele apaga de vez o cadastro, as listas e os alertas.',
            'Para evitar acidentes, o painel pede a senha de novo antes de apagar.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Política de privacidade',
        items: [
            'Nova página “Privacidade”: quais dados o painel guarda, para que servem, com quem são compartilhados e como pedir a exclusão da conta.',
            'O link fica na barra lateral, no rodapé do site e na tela de cadastro.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Real na aba Câmbio',
        items: [
            'A aba Câmbio agora mostra o real contra dólar, euro, libra, iene, franco suíço, yuan e peso argentino.',
            'O dólar (USD / BRL) também aparece nos quadros do topo da aba.',
            'Novo quadro “Notícias do Brasil” na aba Câmbio: manchetes dos portais brasileiros sobre dólar, câmbio, juros e bancos centrais, ao lado das notícias internacionais.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Guia de uso e página de novidades',
        items: [
            'Nova página “Como usar”, com um passo a passo do aplicativo e um glossário dos indicadores e índices.',
            'Nova página “Novidades” (esta), com o histórico do que mudou.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Mais indicadores e visões da tabela',
        items: [
            'Seis indicadores novos: EV/EBITDA, margem líquida, dívida líquida/EBITDA, crescimento do lucro, payout e liquidez diária.',
            'Visões da tabela: Resumo, Preço, Rentabilidade, Dívida e liquidez e “Minha visão”, em que você escolhe as colunas no botão “Colunas”.',
            'Os critérios de ordenação aparecem como etiquetas acima da tabela; clique no “x” para tirar um deles.',
            'Abas do painel em nova ordem: Brasil, EUA, demais países, Commodities, Câmbio e Cripto.',
            'Tema claro, escuro ou automático, escolhido na barra lateral.',
            'Botão “Apoie o projeto”, com contribuição opcional via Pix.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'MercadoAberto',
        items: [
            'O aplicativo passa a se chamar MercadoAberto.',
            'Rodapé em todas as telas com o aviso de conteúdo informativo, o link do código-fonte e o crédito ao projeto original.',
            'Página inicial e termos de uso em português.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Mapa de calor, notícias e commodities',
        items: [
            'Mapa de calor do Brasil: cada empresa ocupa uma área proporcional ao seu valor de mercado.',
            'Notícias do Brasil reunidas de oito portais.',
            'Aba Commodities com 30 contratos futuros em cinco grupos: Energia, Metais, Grãos, Outros agrícolas e Pecuária.',
            'Lista de acompanhamento com ordenação pelo cabeçalho e os mesmos indicadores do painel.',
            'Estrela em cada linha da tabela para acompanhar uma ação com um clique.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Português, mais ações e ajuda nos indicadores',
        items: [
            'Interface em português do Brasil, escolhida no seletor de idioma da barra lateral.',
            'Lista do Brasil ampliada para 51 ações em seis setores.',
            'Balões “?” explicam cada indicador da tabela e cada índice da B3.',
            'Colunas DY e ROCE e ranking combinado: clique em mais de um cabeçalho para somar os critérios.',
        ],
    },
    {
        date: '2026-11-12',
        title: 'Mercado brasileiro',
        items: [
            'Brasil (B3) no painel, com cotações do Yahoo Finance.',
            'Tabela de cotações com ordenação pelo cabeçalho e as colunas P/L, P/VP e ROE.',
        ],
    },
];
