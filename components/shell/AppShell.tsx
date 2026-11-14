'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/shell/Sidebar";
import TabBar from "@/components/shell/TabBar";
import { useDrawerDrag } from "@/components/shell/useDrawerDrag";
import SearchCommand from "@/components/SearchCommand";
import { cn } from "@/lib/utils";
import LegalFooter from "@/components/LegalFooter";
import { donateLabels } from "@/lib/donate";

type AppShellProps = {
    user: User;
    watchlist: { symbol: string; company: string }[];
    initialStocks: StockWithWatchlistStatus[];
    children: React.ReactNode;
};

const AppShell = ({ user, watchlist, initialStocks, children }: AppShellProps) => {
    const t = useTranslations('UpdateBanner');
    const tDonate = useTranslations('Donate');
    const pathname = usePathname();
    const [navOpen, setNavOpen] = useState(false);
    const workspaceRef = useRef<HTMLElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const scrimRef = useRef<HTMLDivElement>(null);
    const closeNav = useCallback(() => setNavOpen(false), []);
    const drawerDrag = useDrawerDrag(navOpen, closeNav, drawerRef, scrimRef);

    // The workspace is the scroll container, so reset it on navigation
    useEffect(() => {
        setNavOpen(false);
        workspaceRef.current?.scrollTo({ top: 0 });
    }, [pathname]);

    return (
        <div className="shell">
            <div
                ref={drawerRef}
                {...drawerDrag}
                className={cn(
                    // The drawer slides in from the reading side: the right in Arabic. Closed, it is also hidden from
                    // the keyboard and screen readers; visibility flips only once the slide has finished.
                    'min-h-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:rtl:left-auto max-lg:rtl:right-0 max-lg:z-50 max-lg:w-[272px] max-lg:touch-pan-y max-lg:transition-[transform,visibility] max-lg:duration-300 max-lg:[transition-timing-function:var(--tab-ease)]',
                    navOpen ? 'max-lg:translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full max-lg:rtl:translate-x-full',
                )}
            >
                <Sidebar user={user} watchlist={watchlist} />
            </div>
            {/* Always mounted so it fades both ways, and so it can follow the finger while the drawer is dragged */}
            <div
                ref={scrimRef}
                aria-hidden="true"
                className={cn(
                    'scrim fixed inset-0 z-40 bg-page/60 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 lg:hidden',
                    navOpen ? 'opacity-100' : 'invisible opacity-0',
                )}
                onClick={closeNav}
            />

            <div className="shell-container">
                <div className="app">
                    <TabBar onMenu={() => setNavOpen(true)} />
                    <main ref={workspaceRef} className={cn('workspace', pathname === '/dashboard' && 'is-first-tab')}>
                        <div className="workspace-inner">
                            {children}
                            <LegalFooter labels={{ disclaimer: t('disclaimer'), sourceCode: t('sourceCode'), basedOn: t('basedOn'), donate: donateLabels(tDonate) }} />
                        </div>
                    </main>
                </div>
            </div>

            <SearchCommand initialStocks={initialStocks} />
        </div>
    );
};

export default AppShell;
