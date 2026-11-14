import { escapeHtml } from "@/lib/utils";

// Brand colours as hex (email clients do not read the oklch tokens in app/globals.css; these are the light theme's values)
const C = {
    page: '#f1f0ec',
    card: '#ffffff',
    line: '#dedcd7',
    text: '#171612',
    muted: '#4a4841',
    faint: '#65635c',
    brand: '#1dbfa1',
    brandInk: '#005f4e',
    onBrand: '#001c15',
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

type ActionEmail = {
    lang: string;
    heading: string;
    greeting: string;
    body: string;
    cta: string;
    /** Already made safe with encodeUnsafeUrlChars; escaped here */
    url: string;
    linkFallback: string;
    ignore: string;
};

/**
 * The one layout for emails that ask for a single click (confirm the address, reset the password).
 * Tables and inline styles only, so it holds up in Gmail, Outlook and Apple Mail. All text is escaped here.
 */
export const renderActionEmail = ({ lang, heading, greeting, body, cta, url, linkFallback, ignore }: ActionEmail) => {
    const href = escapeHtml(url);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const start = dir === 'rtl' ? 'right' : 'left';

    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${escapeHtml(body)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${C.page};">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
<tr>
<td style="padding:0 4px 20px;font-family:${FONT};font-size:20px;font-weight:600;letter-spacing:-0.02em;color:${C.text};text-align:${start};">
Mercado<span style="color:${C.brandInk};">Aberto</span>
</td>
</tr>
<tr>
<td style="background:${C.card};border:1px solid ${C.line};border-top:4px solid ${C.brand};border-radius:12px;padding:36px 32px 32px;font-family:${FONT};text-align:${start};">
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;color:${C.text};">${escapeHtml(heading)}</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${C.text};">${escapeHtml(greeting)}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${C.muted};">${escapeHtml(body)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
<tr>
<td align="center" bgcolor="${C.brand}" style="border-radius:10px;">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:1.2;font-weight:700;color:${C.onBrand};text-decoration:none;border-radius:10px;">${escapeHtml(cta)}</a>
</td>
</tr>
</table>
<p style="margin:28px 0 6px;font-size:13px;line-height:1.6;color:${C.faint};">${escapeHtml(linkFallback)}</p>
<p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;direction:ltr;text-align:${start};"><a href="${href}" style="color:${C.brandInk};text-decoration:underline;">${href}</a></p>
</td>
</tr>
<tr>
<td style="padding:20px 4px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.faint};text-align:${start};">${escapeHtml(ignore)}</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};
