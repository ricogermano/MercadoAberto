import { describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn().mockResolvedValue({ messageId: 'msg-1' });
vi.mock('nodemailer', () => ({
    default: { createTransport: () => ({ sendMail, verify: () => {} }) },
}));

process.env.NODEMAILER_EMAIL = 'sender@example.com';
process.env.NODEMAILER_PASSWORD = 'secret';
const { sendWelcomeEmail } = await import('@/lib/nodemailer');

describe('sendWelcomeEmail', () => {
    it('escapes the name and keeps only text and <strong> from the AI intro', async () => {
        await sendWelcomeEmail({
            email: 'user@example.com',
            name: `<a href="https://evil.example">Click</a> $' $&`,
            intro: `<p style="x">Hi <strong>growth</strong> fan. <a href="https://evil.example">Verify your account</a><img src=x onerror=alert(1)><strong onclick="x">bold</strong> R&amp;D</p>`,
        });

        const { html } = sendMail.mock.calls[0][0];
        expect(html).not.toContain('evil.example">');
        expect(html).not.toContain('<a href="https://evil');
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('onclick');
        expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;Click&lt;/a&gt; $&#39; $&amp;');
        expect(html).toContain('Hi <strong>growth</strong> fan. Verify your account<strong>bold</strong> R&amp;D</p>');
    });

    it('links to this deployment, never to the upstream project', async () => {
        process.env.BETTER_AUTH_URL = 'https://painel.example/';
        await sendWelcomeEmail({ email: 'user@example.com', name: 'Ana', intro: 'Oi', locale: 'pt' });

        const { html } = sendMail.mock.calls.at(-1)![0];
        expect(html).toContain('href="https://painel.example"');
        expect(html).not.toMatch(/{{\w+}}/);
        expect(html).not.toMatch(/vercel\.app|openstock\.app|ibb\.co|href="#"/i);
        delete process.env.BETTER_AUTH_URL;
    });
});
