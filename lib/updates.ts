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
        title: 'Mais de cem ações na aba Brasil',
        items: [
            'A lista do Brasil passou de 51 para 106 ações, com as mais negociadas da B3: entraram, por exemplo, Eneva, Copasa, Sanepar, JBS, Minerva, SLC Agrícola, Cury, Direcional, Fleury, Hypera, Smart Fit e Banrisul.',
            'Os setores foram reorganizados em nove: Bancos e seguros; Petróleo e gás; Materiais básicos (mineração, siderurgia, papel e química); Utilidade pública; Indústria; Agronegócio e alimentos; Consumo; Saúde e educação; Imobiliário.',
            'O mapa de calor, as maiores variações do dia e a tabela de cotações e indicadores já usam a lista nova.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Números no padrão brasileiro e telas mais fáceis de ler e tocar',
        items: [
            'Preços, variações e indicadores aparecem no padrão brasileiro: vírgula nos centavos e ponto no milhar (172.457,77). Valores grandes vêm abreviados como “mi”, “bi” e “tri”. Em inglês o app segue o padrão americano.',
            'Os textos pequenos (cabeçalhos das tabelas, notas e legendas) ficaram um pouco maiores.',
            'No celular, os botões pequenos (estrela, ajuda “?”, fechar aba, tela cheia) respondem a uma área maior de toque.',
            'Quem navega pelo teclado vê sempre um contorno verde no item selecionado.',
            'Nos quadros de índice, a variação em pontos aparece inteira (“+1.133,45 no dia”), sem ser cortada.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Mapa de calor e cotações em tela cheia',
        items: [
            'O mapa de calor do Brasil e a tabela de cotações ganharam o botão de tela cheia, no canto superior direito (Esc ou o mesmo botão fecham). A visão escolhida, a ordenação e as estrelas continuam como estavam.',
            'Em tela cheia, o cabeçalho da tabela fica parado enquanto você rola a lista.',
            'O quadro “Cotações” passou a se chamar “Cotações e indicadores” nos mercados que mostram os indicadores ao lado dos preços.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Notícias do Brasil e do mundo juntas, e manchetes em tela cheia',
        items: [
            'Na lista de acompanhamento, as notícias do mundo e as manchetes dos portais brasileiros aparecem numa lista só, da mais recente para a mais antiga. Os botões “Brasil”, “Mundo” e “Só da minha lista” filtram; “Limpar filtros” volta ao início.',
            'A etiqueta fica destacada quando a notícia cita uma ação que você acompanha.',
            'Nas notícias do Brasil do painel, o botão no canto direito abre as manchetes em tela cheia (Esc fecha). A lista agora guarda até 150 manchetes dos últimos três dias, em vez de 60.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Mediana histórica ao lado de cada indicador',
        items: [
            'Nas tabelas de cotações e da lista de acompanhamento, cada indicador ganhou ao lado a coluna “Med.”: a mediana da própria empresa nos últimos quatro exercícios (no DY, em até dez anos).',
            'O número de hoje fica verde ou vermelho conforme o lado da própria mediana em que está. É só uma comparação com o passado, não uma recomendação.',
            'Para esconder as medianas, abra “Colunas” e desmarque “Mostrar medianas”.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Painel do Brasil começa pelo mapa de calor',
        items: [
            'Na aba Brasil, o mapa de calor vem primeiro, com as maiores variações do dia ao lado.',
            'A tabela de cotações passa a ocupar a largura toda da tela, e as notícias ficam logo abaixo.',
        ],
    },
    {
        date: '2026-11-13',
        title: 'Melhor no celular e no tema escuro',
        items: [
            'No iPhone, a tela não fica mais ampliada e cortada à direita depois de entrar.',
            'No tema escuro, os quadros do TradingView (Pulso, Líderes, Cotações, Notícias) deixam de aparecer com fundo branco e letra apagada.',
            'No celular, os quadros do Pulso ficam um por linha, com o nome inteiro.',
            'No tema escuro, os textos cinza (subtítulos e explicações pequenas) ficaram mais claros e fáceis de ler.',
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
