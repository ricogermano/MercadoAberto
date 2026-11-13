'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, GraduationCap, Heart, LayoutDashboard, LogOut, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { openSearch } from "@/components/SearchCommand";
import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DonateDialog from "@/components/DonateDialog";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { donateLabels } from "@/lib/donate";
import { signOut } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";

type SidebarProps = {
    user: User;
    watchlist: { symbol: string; company: string }[];
};

const RESOURCES = [
    { href: '/guide', label: 'guide', icon: GraduationCap },
    { href: '/updates', label: 'updates', icon: Sparkles },
    { href: '/terms', label: 'terms', icon: BookOpen },
    { href: '/privacy', label: 'privacy', icon: ShieldCheck },
] as const;

const Sidebar = ({ user, watchlist }: SidebarProps) => {
    const t = useTranslations('Sidebar');
    const donate = donateLabels(useTranslations('Donate'));
    const tTheme = useTranslations('Theme');
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/sign-in');
    };

    return (
        <aside className="sidebar">
            <Link href="/dashboard" className="px-2 pt-1 pb-2" aria-label={t('homeAria')}>
                <BrandLogo />
            </Link>

            <button type="button" onClick={openSearch} className="side-cta">
                <Search className="size-4" strokeWidth={2.5} />
                <span className="flex-1 text-start">{t('searchStocks')}</span>
                <kbd className="kbd bg-on-brand/10">⌘K</kbd>
            </button>

            <nav className="flex flex-col gap-0.5">
                <Link href="/dashboard" className={cn('side-item', pathname === '/dashboard' && 'is-active')}>
                    <LayoutDashboard /> {t('overview')}
                </Link>
                <Link href="/watchlist" className={cn('side-item', pathname === '/watchlist' && 'is-active')}>
                    <Star /> <span className="flex-1">{t('watchlist')}</span>
                    <span className="num text-xs text-faint">{watchlist.length}</span>
                </Link>
            </nav>

            <div className="flex min-h-0 flex-col gap-1">
                <p className="side-label shrink-0">{t('watching')}</p>
                {watchlist.length === 0 ? (
                    <p className="px-2.5 text-[12.5px] text-faint">{t('watchingEmpty')}</p>
                ) : (
                    <ul className="scrollbar-hide-default flex min-h-0 flex-col gap-0.5 overflow-y-auto">
                        {watchlist.map(({ symbol, company }) => (
                            <li key={symbol}>
                                <Link
                                    href={`/stocks/${symbol}`}
                                    title={company}
                                    className={cn('side-item h-8 font-medium', pathname === `/stocks/${symbol}` && 'is-active')}
                                >
                                    {/* B3 tickers drop the ".SA" exchange suffix here; the column grows with the ticker so it never runs into the name */}
                                    <span className="mono min-w-14 shrink-0 text-[12.5px] font-semibold text-foreground">{symbol.replace(/\.SA$/, '')}</span>
                                    {company !== symbol && <span className="truncate text-[12.5px] text-faint">{company}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-auto flex flex-col gap-0.5">
                {RESOURCES.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className={cn('side-item h-8', pathname === href && 'is-active')}>
                        <Icon /> {t(`resources.${label}`)}
                    </Link>
                ))}
                <DonateDialog labels={donate}>
                    <button type="button" className="side-item h-8 w-full text-start">
                        <Heart /> {donate.button}
                    </button>
                </DonateDialog>
                <ThemeSwitcher labels={{ label: tTheme('label'), auto: tTheme('auto'), light: tTheme('light'), dark: tTheme('dark') }} />
                <LanguageSwitcher />
            </div>

            <div className="flex items-center gap-2.5 border-t border-line pt-3 px-1">
                <Link href="/profile" className={cn('-m-1 flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] p-1 transition-colors hover:bg-foreground/5', pathname === '/profile' && 'bg-foreground/5')}>
                    <span className="grid size-8 flex-none place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand-ink">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-foreground">{user.name}</span>
                        <span className="block truncate text-[12px] text-faint">{user.email}</span>
                    </span>
                </Link>
                <button type="button" onClick={handleSignOut} className="icon-btn" title={t('signOut')} aria-label={t('signOut')}>
                    <LogOut />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
