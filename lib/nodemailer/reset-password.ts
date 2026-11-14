import { transporter } from "@/lib/nodemailer";
import { renderActionEmail } from "@/lib/nodemailer/action-email";
import { getEmailTranslator } from "@/lib/nodemailer/i18n";


// Better Auth hands us an already-encoded URL (callbackURL=http%3A%2F%2F...).
// encodeURI would turn those % into %25 and the link fails with INVALID_CALLBACKURL,
// so only encode characters that are unsafe and leave existing escapes alone.
export const encodeUnsafeUrlChars = (url: string) =>
    url.replace(/[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/g, encodeURIComponent);

export const sendPasswordResetEmail = async (
    { email, name, resetUrl, locale }: { email: string; name?: string | null; resetUrl: string; locale?: string }
) => {
    try {
        if (!transporter || !process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
            throw new Error('Email credentials not configured');
        }

        const { lang, t } = await getEmailTranslator(locale);
        const firstName = name?.trim().split(' ')[0];
        const html = renderActionEmail({
            lang,
            heading: t('resetPassword.heading'),
            greeting: firstName ? t('resetPassword.greeting', { name: firstName }) : t('resetPassword.greetingNoName'),
            body: t('resetPassword.body'),
            cta: t('resetPassword.cta'),
            url: encodeUnsafeUrlChars(resetUrl),
            linkFallback: t('common.linkFallback'),
            ignore: t('resetPassword.ignore'),
        });

        const info = await transporter.sendMail({
            from: `"MercadoAberto" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: t('resetPassword.subject'),
            text: t('resetPassword.text', { url: encodeUnsafeUrlChars(resetUrl) }),
            html,
        });

        console.log('Password reset email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw error;
    }
};
