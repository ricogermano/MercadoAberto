import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { UPDATES } from "@/lib/updates";

export async function generateMetadata() {
    const t = await getTranslations('UpdatesPage');
    return { title: `${t('metaTitle')} | MercadoAberto` };
}

// Entries of the same day share one dated block
const byDay = () => {
    const days = new Map<string, typeof UPDATES>();
    for (const entry of UPDATES) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
    return [...days.entries()];
};

export default async function UpdatesPage() {
    const [t, locale] = await Promise.all([getTranslations('UpdatesPage'), getLocale()]);
    // Noon, so the day does not shift with the server's time zone
    const formatDay = (day: string) =>
        new Date(`${day}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            <header className="page-head">
                <div>
                    <h1 className="page-title">{t('title')}</h1>
                    <p className="page-sub">{t('sub')}</p>
                    {locale !== 'pt' && <p className="page-sub">{t('onlyPortuguese')}</p>}
                </div>
                <Link href="/guide" className="btn btn-ghost">
                    <GraduationCap className="size-4" /> {t('seeGuide')}
                </Link>
            </header>

            {/* The content is Portuguese whatever the interface language */}
            <div className="flex max-w-[860px] flex-col gap-3" lang="pt-BR" dir="ltr">
                {byDay().map(([day, entries], index) => (
                    <section key={day} className="hatch">
                        <div className="section-head">
                            <h2 className="section-title">{formatDay(day)}</h2>
                            {index === 0 && <span className="pill">{t('latest')}</span>}
                        </div>
                        <div className="flex flex-col gap-[3px]">
                            {entries.map((entry) => (
                                <article key={entry.title} className="card p-5">
                                    <h3 className="text-[15px] font-bold tracking-[-0.02em] text-foreground">{entry.title}</h3>
                                    <ul className="mt-2.5 flex list-disc flex-col gap-1.5 ps-5 text-[14px] leading-relaxed text-muted-foreground marker:text-faint">
                                        {entry.items.map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </>
    );
}
