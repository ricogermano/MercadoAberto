import { cn } from "@/lib/utils";

export type SectionLink = { id: string; label: string };

// Jump links to the sections of a long page. Plain anchors: the workspace scrolls to the target on its own,
// and the bar stays pinned so the way back is always one tap away.
export default function SectionIndex({ label, items, className }: { label: string; items: SectionLink[]; className?: string }) {
    return (
        <nav aria-label={label} className={cn('section-index', className)}>
            {items.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="section-index-link">{item.label}</a>
            ))}
        </nav>
    );
}
