'use client';

import { useEffect, useState, type RefObject } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Floating "back to top" for long pages. It only shows once the page has been scrolled about a screen down,
// and sits in the bottom corner on the reading-end side, clear of the section index and the table headers.
export default function BackToTop({ target, label }: { target: RefObject<HTMLElement | null>; label: string }) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = target.current;
        if (!el) return;
        const onScroll = () => setShown(el.scrollTop > 500);
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [target]);

    return (
        <button
            type="button"
            onClick={() => target.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            tabIndex={shown ? 0 : -1}
            aria-hidden={!shown}
            className={cn(
                'fixed bottom-4 end-4 z-30 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-card px-3 text-[12.5px] font-semibold text-foreground shadow-[0_6px_18px_oklch(0_0_0/0.28)] transition-[opacity,visibility,transform,color] duration-200 hover:text-brand-ink lg:bottom-6 lg:end-8',
                shown ? 'opacity-100' : 'invisible translate-y-2 opacity-0',
            )}
        >
            <ArrowUp className="size-3.5" aria-hidden />
            {label}
        </button>
    );
}
