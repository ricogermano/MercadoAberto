import { SOURCE_URL, UPSTREAM_NAME, UPSTREAM_URL } from '@/lib/constants';

export type LegalFooterLabels = { disclaimer: string; sourceCode: string; basedOn: string };

// AGPL-3.0 asks for a link to this version's source and credit to the original authors;
// the disclaimer keeps the indicators and rankings from reading as investment advice.
const LegalFooter = ({ labels }: { labels: LegalFooterLabels }) => (
    <footer className="mt-6 flex flex-col gap-1.5 border-t border-border pt-4 pb-2 text-[12px] leading-relaxed text-faint">
        <p>{labels.disclaimer}</p>
        <p className="flex flex-wrap gap-x-2 gap-y-1">
            <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">{labels.sourceCode}</a>
            <span aria-hidden>·</span>
            <span>
                {labels.basedOn}{' '}
                <a href={UPSTREAM_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">{UPSTREAM_NAME}</a>
            </span>
        </p>
    </footer>
);

export default LegalFooter;
