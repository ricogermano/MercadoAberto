'use client';

import React from 'react';
import { toast } from 'sonner';
import { MailWarning } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resendVerificationEmail } from '@/lib/actions/auth.actions';

// Shown in place of the sign-up or sign-in form while the account waits for its confirmation link
const VerifyEmailNotice = ({ email, onBack }: { email: string; onBack: () => void }) => {
    const t = useTranslations('VerifyEmail');
    const [sending, setSending] = React.useState(false);

    const resend = async () => {
        setSending(true);
        try {
            const result = await resendVerificationEmail({ email });
            if (result.success) toast.success(t('resent'));
            else toast.error(t('resendFailed'), { description: result.error });
        } catch {
            toast.error(t('resendFailed'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div role="status">
            <h1 className="form-title mb-2">{t('title')}</h1>
            <p className="mb-3 leading-relaxed text-foreground/85">
                {t('bodyBefore')} <strong className="text-foreground [overflow-wrap:anywhere]">{email}</strong>{t('bodyAfter')}
            </p>
            {/* The confirmation often lands in spam, so this is a boxed notice and not small print */}
            <p className="mb-3 flex items-start gap-2.5 rounded-[11px] border border-warn/45 bg-warn/10 px-3.5 py-3 text-sm leading-relaxed text-foreground">
                <MailWarning aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-warn" />
                <span>{t('spam')}</span>
            </p>
            <p className="mb-8 text-[13px] leading-relaxed text-faint">{t('hint')}</p>
            <div className="flex flex-col gap-4">
                <Button type="button" onClick={resend} disabled={sending} className="yellow-btn w-full">
                    {sending ? t('resending') : t('resend')}
                </Button>
                <button type="button" onClick={onBack} className="footer-link mx-auto text-sm">
                    {t('back')}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmailNotice;
