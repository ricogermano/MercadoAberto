import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/better-auth/auth";
import { getSignupStats, isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const t = await getTranslations('AdminPage');
    return { title: `${t('title')} | MercadoAberto`, robots: { index: false, follow: false } };
}

export default async function AdminPage() {
    const session = await getSession();
    // A 404, so the page does not reveal itself to other signed-in users
    if (!isAdmin(session?.user?.email)) notFound();

    const [t, locale, stats] = await Promise.all([getTranslations('AdminPage'), getLocale(), getSignupStats()]);
    const number = (value: number) => value.toLocaleString(locale);
    const when = (date: Date | null) =>
        date ? date.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }) : '—';

    const tiles = [
        { label: t('total'), value: stats.total },
        { label: t('verified'), value: stats.verified },
        { label: t('last24h'), value: stats.last24h },
        { label: t('last7d'), value: stats.last7d },
        { label: t('last30d'), value: stats.last30d },
    ];

    return (
        <>
            <header className="page-head">
                <div>
                    <h1 className="page-title">{t('title')}</h1>
                    <p className="page-sub">{t('sub')}</p>
                </div>
            </header>

            <div className="flex max-w-[980px] flex-col gap-3">
                <dl className="grid grid-cols-2 gap-[3px] sm:grid-cols-3 lg:grid-cols-5">
                    {tiles.map(({ label, value }) => (
                        <div key={label} className="card flex flex-col-reverse gap-1 p-4">
                            <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
                            <dd className="num text-[26px] font-bold tracking-[-0.03em] text-foreground">{number(value)}</dd>
                        </div>
                    ))}
                </dl>

                <section className="hatch">
                    <div className="section-head">
                        <h2 id="admin-countries" className="section-title">{t('byCountry')}</h2>
                    </div>
                    <div className="overflow-x-auto rounded-[14px]" tabIndex={0} role="region" aria-labelledby="admin-countries">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('country')}</th>
                                    <th className="is-num">{t('signups')}</th>
                                    <th className="is-num">{t('share')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.countries.map(({ country, count }) => (
                                    <tr key={country ?? ''}>
                                        <td>{country ?? t('noCountry')}</td>
                                        <td className="is-num num">{number(count)}</td>
                                        <td className="is-num num">
                                            {(count / stats.total).toLocaleString(locale, { style: 'percent', maximumFractionDigits: 1 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="hatch">
                    <div className="section-head">
                        <h2 id="admin-latest" className="section-title">{t('latest')}</h2>
                    </div>
                    <div className="overflow-x-auto rounded-[14px]" tabIndex={0} role="region" aria-labelledby="admin-latest">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('name')}</th>
                                    <th>{t('email')}</th>
                                    <th>{t('country')}</th>
                                    <th>{t('emailStatus')}</th>
                                    <th className="is-num">{t('signedUp')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.latest.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td dir="ltr">{user.email}</td>
                                        <td>{user.country ?? t('noCountry')}</td>
                                        <td>
                                            <span className={user.verified ? 'pill is-up' : 'pill'}>
                                                {user.verified ? t('confirmed') : t('pending')}
                                            </span>
                                        </td>
                                        <td className="is-num num whitespace-nowrap">{when(user.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}
