// Pix donation to the fork's maintainer. The payload is the bank-issued static BR Code ("copia e cola");
// public/pix-qr.svg is the same payload as a QR code, so regenerate both together if the key changes.
export const PIX_PAYLOAD = '00020126580014BR.GOV.BCB.PIX01367e624ffe-11c9-4064-99fa-b79abb53d6f95204000053039865802BR5925Ricardo Augusto Germano F6009SAO PAULO62140510znxLJWpmz0630465A6';
export const PIX_RECIPIENT = 'Ricardo Augusto Germano Ferreira';

const KEYS = ['button', 'title', 'body', 'scan', 'copy', 'copied', 'recipient'] as const;
export type DonateLabels = Record<(typeof KEYS)[number], string>;

// Builds the labels from a next-intl translator of the "Donate" namespace (server or client)
export const donateLabels = (t: (key: (typeof KEYS)[number]) => string): DonateLabels =>
    Object.fromEntries(KEYS.map((key) => [key, t(key)])) as DonateLabels;

// Public pages have no intl provider, so they use the Portuguese text directly
export const DONATE_LABELS_PT: DonateLabels = {
    button: 'Apoie o projeto',
    title: 'Apoie o MercadoAberto',
    body: 'O MercadoAberto é gratuito e sem anúncios. Se ele é útil para você, uma contribuição de qualquer valor via Pix ajuda a pagar servidor e dados. É opcional e não libera nenhum recurso extra.',
    scan: 'Abra o app do seu banco, escolha Pix e aponte a câmera para o código.',
    copy: 'Copiar código Pix',
    copied: 'Código copiado',
    recipient: 'Recebedor',
};
