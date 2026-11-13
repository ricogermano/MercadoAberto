import { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/marketing/PageHero';
import { APP_NAME, SOURCE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: `Política de privacidade | ${APP_NAME}`,
    description: 'Quais dados pessoais o painel guarda, para que servem, com quem são compartilhados e como pedir a exclusão.',
};

// Read per request, so the contact address can be set in the host's settings without a new build
export const dynamic = 'force-dynamic';

const linkClass = 'font-semibold text-brand-ink hover:underline';

const List = ({ items }: { items: React.ReactNode[] }) => (
    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
        {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
);

export default function PrivacyPage() {
    // The address privacy requests go to (LGPD art. 18). Until it is set, requests go through the public issue tracker.
    const contactEmail = process.env.CONTACT_EMAIL?.trim();
    const contact = contactEmail
        ? <a href={`mailto:${contactEmail}`} className={linkClass}>{contactEmail}</a>
        : <a href={`${SOURCE_URL}/issues`} target="_blank" rel="noreferrer" className={linkClass}>{`${SOURCE_URL.replace('https://', '')}/issues`}</a>;

    const sections: { title: string; body: React.ReactNode }[] = [
        {
            title: 'Quais dados guardamos',
            body: (
                <>
                    Só o que é preciso para o painel funcionar:
                    <List items={[
                        'Cadastro: nome, e-mail e senha. A senha é guardada embaralhada; ninguém consegue lê-la, nem nós.',
                        'Preferências informadas no cadastro: país, objetivo de investimento, tolerância a risco e setor preferido.',
                        'O que você cria no painel: listas de acompanhamento e alertas de preço.',
                        'Registros de acesso: data do último acesso e, enquanto a sessão está aberta, o endereço IP e o tipo de navegador.',
                    ]} />
                    <span className="mt-2 block">Não pedimos CPF, dados bancários, dados de corretora nem a sua carteira de investimentos.</span>
                </>
            ),
        },
        {
            title: 'Para que usamos',
            body: (
                <>
                    <List items={[
                        'Criar e proteger a sua conta e manter você conectado.',
                        'Mostrar o painel do seu jeito: mercado padrão, idioma, listas e alertas.',
                        'Enviar e-mails do serviço: boas-vindas, redefinição de senha e os alertas que você criar.',
                    ]} />
                    <span className="mt-2 block">
                        Não vendemos dados, não exibimos publicidade e não montamos perfil para oferecer produtos.
                        O tratamento se apoia na execução do serviço que você pediu ao criar a conta e, nos registros de acesso, no interesse legítimo de manter o serviço seguro (Lei 13.709/2018, LGPD).
                    </span>
                </>
            ),
        },
        {
            title: 'Cookies e dados no navegador',
            body: 'Usamos só cookies necessários: o da sessão (para manter você conectado), o do idioma e o do mercado escolhido. O tema e as colunas das tabelas ficam guardados no seu próprio navegador. Não usamos cookies de publicidade.',
        },
        {
            title: 'Medição de acessos',
            body: 'Contamos visitas com o Vercel Analytics, que não usa cookies e entrega só números agregados (páginas vistas, país, tipo de aparelho), sem identificar quem visitou.',
        },
        {
            title: 'Com quem os dados são compartilhados',
            body: (
                <>
                    Só com os serviços que fazem o painel funcionar:
                    <List items={[
                        'Vercel: hospeda o site e processa os acessos.',
                        'MongoDB Atlas: guarda o banco de dados (cadastro, listas e alertas).',
                        'Serviço de e-mail (Gmail, do Google): entrega os e-mails do serviço e, para isso, recebe o seu endereço.',
                        'Serviço de inteligência artificial: escreve o parágrafo inicial do e-mail de boas-vindas a partir do país e das preferências do cadastro. Nome e e-mail não são enviados a ele.',
                        'TradingView: os gráficos e alguns quadros são carregados direto do TradingView pelo seu navegador. Por isso o TradingView recebe o seu endereço IP e pode usar cookies próprios, segundo a política dele.',
                    ]} />
                    <span className="mt-2 block">
                        As cotações (Yahoo Finance e Finnhub) e as notícias são buscadas pelo nosso servidor: essas fontes não recebem dados seus.
                        Parte desses serviços mantém servidores fora do Brasil; ao usar o painel, os dados podem ser guardados e processados no exterior.
                    </span>
                </>
            ),
        },
        {
            title: 'Por quanto tempo',
            body: 'Enquanto a conta existir. Quando você pede a exclusão, apagamos o cadastro, as listas e os alertas. Cópias de segurança e registros técnicos dos serviços acima podem levar mais alguns dias para sumir.',
        },
        {
            title: 'Seus direitos',
            body: (
                <>
                    Pela LGPD você pode, a qualquer momento:
                    <List items={[
                        'saber se guardamos dados seus e receber uma cópia;',
                        <>corrigir nome e preferências, direto na tela <Link href="/profile" className={linkClass}>Perfil</Link>;</>,
                        'pedir a exclusão da conta e dos dados;',
                        'pedir os dados em formato que possa ser levado a outro serviço;',
                        'retirar um consentimento ou se opor a um uso.',
                    ]} />
                    <span className="mt-2 block">
                        Para exercer qualquer um deles, escreva para {contact}. Respondemos em até 15 dias.
                        Se a resposta não resolver, você pode recorrer à Autoridade Nacional de Proteção de Dados (ANPD).
                    </span>
                </>
            ),
        },
        {
            title: 'Segurança',
            body: 'A conexão com o site é cifrada (HTTPS), as senhas são guardadas embaralhadas e as chaves de acesso ficam fora do código. Nenhum sistema é à prova de falhas: se houver um incidente que possa trazer risco a você, avisaremos por e-mail e comunicaremos a ANPD.',
        },
        {
            title: 'Menores de idade',
            body: 'O serviço é destinado a maiores de 18 anos. Não coletamos, de propósito, dados de crianças e adolescentes.',
        },
        {
            title: 'Mudanças nesta política',
            body: (
                <>
                    Esta política pode mudar; a data no topo mostra a última atualização, e mudanças importantes são avisadas no painel.
                    Ela vale junto com os <Link href="/terms" className={linkClass}>Termos de uso</Link>.
                </>
            ),
        },
    ];

    return (
        <>
            <PageHero
                kicker="Privacidade · Atualizado em novembro de 2026"
                title="Política de privacidade"
                sub="O que guardamos sobre você, para quê, e como pedir para apagar."
            />

            <section className="mx-auto mt-14 flex max-w-[1200px] flex-col gap-8 px-5">
                {sections.map(({ title, body }) => (
                    <div key={title} className="max-w-3xl">
                        <h2 className="text-[18px] font-bold tracking-[-0.02em]">{title}</h2>
                        <div className="mt-2 leading-relaxed text-muted-foreground">{body}</div>
                    </div>
                ))}
            </section>
        </>
    );
}
