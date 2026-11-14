import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/nodemailer', () => ({
    transporter: {
        sendMail: vi.fn(),
    },
}));

import { transporter } from '@/lib/nodemailer';
import { sendVerificationEmail } from '@/lib/nodemailer/verify-email';

describe('sendVerificationEmail', () => {
    const originalEnv = { ...process.env };
    const sendMailMock = vi.mocked(transporter!.sendMail);

    beforeEach(() => {
        process.env = { ...originalEnv, NODEMAILER_EMAIL: 'sender@example.com', NODEMAILER_PASSWORD: 'secret' };
        sendMailMock.mockReset();
        sendMailMock.mockResolvedValue({ messageId: 'msg-123' } as never);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('sends the confirmation link in the chosen language, with the callbackURL left intact', async () => {
        const verifyUrl = 'https://example.com/api/auth/verify-email?token=abc.def&callbackURL=%2Fsign-in';
        await sendVerificationEmail({ email: 'user@example.com', name: 'Ana Souza', verifyUrl, locale: 'pt' });

        const [mail] = sendMailMock.mock.calls[0];
        expect(mail.to).toBe('user@example.com');
        expect(mail.subject).toBe('Confirme seu e-mail no MercadoAberto');
        expect(mail.html).toContain('Olá, Ana,');
        expect(mail.html).toContain('href="https://example.com/api/auth/verify-email?token=abc.def&amp;callbackURL=%2Fsign-in"');
        expect(mail.html).not.toContain('%252F');
        expect(mail.text).toContain(verifyUrl);
    });

    it('escapes the name before it goes into the HTML', async () => {
        await sendVerificationEmail({ email: 'user@example.com', name: '<b>x</b>', verifyUrl: 'https://example.com/v', locale: 'en' });
        const [mail] = sendMailMock.mock.calls[0];
        expect(mail.html).toContain('Hi &lt;b&gt;x&lt;/b&gt;,');
        expect(mail.html).not.toContain('<b>x</b>');
    });

    it('throws when the mailbox is not configured', async () => {
        delete process.env.NODEMAILER_EMAIL;
        await expect(sendVerificationEmail({ email: 'user@example.com', verifyUrl: 'https://example.com/v' })).rejects.toThrow();
        expect(sendMailMock).not.toHaveBeenCalled();
    });
});
