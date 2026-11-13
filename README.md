# MercadoAberto

Painel gratuito e de código aberto para acompanhar o mercado, com foco no Brasil: ações da B3, índices, commodities, câmbio e criptomoedas em um só lugar.

> [!NOTE]
> O MercadoAberto é uma ferramenta de consulta. Não é corretora, não envia ordens e nada aqui é recomendação de investimento. As cotações podem ter atraso e vêm de fontes de terceiros.

O MercadoAberto é uma versão modificada do [OpenStock](https://github.com/Open-Dev-Society/OpenStock), do Open Dev Society, distribuída sob a mesma licença (AGPL-3.0).

## O que tem

- **Brasil:** 51 ações da B3 em seis setores, com Ibovespa, IFIX, Small Caps e IDIV, mapa de calor por valor de mercado e manchetes de oito portais brasileiros.
- **Indicadores na tabela:** DY, P/L, P/VP, ROE, ROCE, EV/EBITDA, margem líquida, dívida líquida/EBITDA, crescimento do lucro, payout e liquidez diária, com ordenação por um ou mais critérios e visões prontas (Resumo, Preço, Rentabilidade, Dívida e liquidez, Minha visão).
- **Commodities:** 30 contratos futuros em cinco grupos (energia, metais, grãos, outros agrícolas e pecuária), com a unidade de cada preço.
- **Câmbio:** real contra dólar, euro, libra, iene, franco suíço, yuan e peso argentino, além dos principais pares internacionais e das notícias brasileiras sobre o tema.
- **Outros mercados:** Estados Unidos, Alemanha, Arábia Saudita, Austrália, Canadá, Índia, Polônia e criptomoedas.
- **Listas de acompanhamento**, página de cada ação, guia de uso e histórico de novidades.
- **Interface** em português, inglês, polonês e árabe, com tema claro, escuro ou automático.

## De onde vêm os dados

| Dado | Fonte |
| --- | --- |
| Cotações e indicadores do Brasil, Polônia, Arábia Saudita e commodities | Yahoo Finance (acesso não oficial, com atraso) |
| Gráficos, câmbio, criptomoedas e demais mercados | Quadros do TradingView |
| Cotações dos Estados Unidos e alertas | Finnhub |
| Manchetes do Brasil | RSS dos portais (só título e link; o texto abre no site original) |

Os indicadores são calculados a partir do que a fonte publica e podem divergir dos números divulgados pelas empresas.

## Como rodar no seu computador

Requisitos: Node.js 22 (a versão usada no Dockerfile do projeto) e um banco MongoDB (local, pelo Docker Compose deste repositório, ou no MongoDB Atlas).

```bash
git clone https://github.com/ricogermano/MercadoAberto.git
cd MercadoAberto
npm install
cp .env.example .env   # preencha as variáveis obrigatórias
npm run dev
```

Abra http://localhost:3000.

Variáveis obrigatórias no `.env` (as demais estão explicadas no `.env.example`):

| Variável | Para que serve |
| --- | --- |
| `MONGODB_URI` | Endereço do banco de dados |
| `BETTER_AUTH_SECRET` | Chave que assina as sessões de login (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | Endereço público do aplicativo |
| `FINNHUB_API_KEY` | Chave gratuita do finnhub.io |

Para conferir o `.env`: `node scripts/check-env.mjs`. Para rodar os testes: `npm test`.

## Licença e créditos

Código sob a licença [AGPL-3.0](LICENSE). Quem publicar uma versão modificada, inclusive como serviço na internet, precisa oferecer o código-fonte sob a mesma licença.

Baseado no [OpenStock](https://github.com/Open-Dev-Society/OpenStock), criado pelo Open Dev Society e seus colaboradores.
