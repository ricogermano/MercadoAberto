import { transporter } from "@/lib/nodemailer";
import { renderActionEmail } from "@/lib/nodemailer/action-email";
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
        const html = renderActionEmail({
            lang,
            heading: t('verifyEmail.heading'),
            greeting: firstName ? t('verifyEmail.greeting', { name: firstName }) : t('verifyEmail.greetingNoName'),
            body: t('verifyEmail.body'),
            cta: t('verifyEmail.cta'),
            url: encodeUnsafeUrlChars(verifyUrl),
            linkFallback: t('common.linkFallback'),
            ignore: t('verifyEmail.ignore'),
        });

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
