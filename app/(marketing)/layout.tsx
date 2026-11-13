import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import LegalFooter from "@/components/LegalFooter";
import { APP_NAME } from "@/lib/constants";
import { DONATE_LABELS_PT } from "@/lib/donate";
import ThemeSwitcher, { THEME_LABELS_PT } from "@/components/ThemeSwitcher";

// Public pages are outside the translated app (no intl provider), so their text is Portuguese here.
const LEGAL_LABELS = {
    disclaimer: 'Conteúdo informativo e educacional. Não é recomendação de investimento nem oferta de compra ou venda de qualquer ativo. Cotações com atraso e sujeitas a erro.',
    sourceCode: 'Código-fonte (AGPL-3.0)',
    basedOn: 'Baseado no',
    donate: DONATE_LABELS_PT,
};

// No session read here: it made every public page (and every <Link> prefetch of one) a function call.
// The header always shows the signed-out buttons; /sign-in and /sign-up send a signed-in visitor to /dashboard.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-page">
            <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
                    <Link href="/" aria-label={`${APP_NAME}: página inicial`} className="shrink-0">
                        <BrandLogo />
                    </Link>
                    <nav className="hidden items-center gap-1 md:flex">
                        {[['/#recursos', 'Recursos'], ['/#dados', 'Dados'], ['/#codigo-aberto', 'Código aberto'], ['/terms', 'Termos']].map(([href, label]) => (
                            <Link key={href} href={href} className="side-item h-8 font-semibold">{label}</Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeSwitcher compact labels={THEME_LABELS_PT} />
                        <Link href="/sign-in" className="btn h-9 px-3 text-muted-foreground hover:text-foreground">Entrar</Link>
                        <Link href="/sign-up" className="btn btn-primary h-9">Criar conta</Link>
                    </div>
                </div>
            </header>

            <main>{children}</main>

            <div className="mx-auto mt-24 max-w-[1200px] px-5 pb-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <BrandLogo className="text-[18px]" />
                    <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-muted-foreground">
                        <Link href="/" className="transition-colors hover:text-foreground">Início</Link>
                        <Link href="/terms" className="transition-colors hover:text-foreground">Termos</Link>
                        <Link href="/sign-in" className="transition-colors hover:text-foreground">Entrar</Link>
                    </nav>
                </div>
                <LegalFooter labels={LEGAL_LABELS} />
            </div>
        </div>
    );
}
