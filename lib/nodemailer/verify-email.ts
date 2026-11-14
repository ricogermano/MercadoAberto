import { transporter } from "@/lib/nodemailer";
import { escapeHtml } from "@/lib/utils";
import { getEmailTranslator } from "@/lib/nodemailer/i18n";
import { encodeUnsafeUrlChars } from "@/lib/nodemailer/reset-password";

// The link a new account has to open before it can sign in (see emailVerification in lib/better-auth/auth.ts)
export const sendVerificationEmail = async (
    { email, name, verifyUrl, locale }: { email: string; name?: string | null; verifyUrl: string; locale?: string }
) => {
    try {
        if (!transporter || !process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
            throw new Error('Email credentials not configured');
        }

        const { lang, t } = await getEmailTranslator(locale);
        const firstName = name?.trim().split(' ')[0];
        const greeting = escapeHtml(firstName ? t('verifyEmail.greeting', { name: firstName }) : t('verifyEmail.greetingNoName'));
        const escapedUrl = escapeHtml(encodeUnsafeUrlChars(verifyUrl));
        const html = `
            <div lang="${lang}" style="background:#000;padding:32px;font-family:Arial,sans-serif;color:#fff;">
                <div style="max-width:560px;margin:0 auto;border:1px solid #333;border-radius:12px;padding:32px;background:#111;">
                    <h1 style="margin:0 0 16px;font-size:28px;">${escapeHtml(t('verifyEmail.heading'))}</h1>
                    <p style="margin:0 0 16px;color:#d4d4d8;">${greeting}</p>
                    <p style="margin:0 0 24px;color:#d4d4d8;line-height:1.6;">
                        ${escapeHtml(t('verifyEmail.body'))}
                    </p>
                    <a
                        href="${escapedUrl}"
                        style="display:inline-block;background:#facc15;color:#111827;padding:12px 20px;border-radius:9999px;text-decoration:none;font-weight:700;"
                    >
                        ${escapeHtml(t('verifyEmail.cta'))}
                    </a>
                    <p style="margin:24px 0 0;color:#a1a1aa;line-height:1.6;">
                        ${escapeHtml(t('verifyEmail.ignore'))}
                    </p>
                </div>
            </div>
        `;

        const info = await transporter.sendMail({
            from: `"MercadoAberto" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: t('verifyEmail.subject'),
            text: t('verifyEmail.text', { url: encodeUnsafeUrlChars(verifyUrl) }),
            html,
        });

        console.log('Verification email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw error;
    }
};
