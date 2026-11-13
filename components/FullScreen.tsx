'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Full screen for our own panels (headlines, heatmap, quotes table). Like the TradingView frames, the same element is
// resized in place, so filters, sorting and scroll state stay as they were. Esc or a click outside closes it.
export function useFullScreen() {
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!expanded) return;
        // An open popover (column picker, indicator help) takes the Esc for itself
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[data-radix-popper-content-wrapper]') && setExpanded(false);
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [expanded]);
    return { expanded, toggle: () => setExpanded((v) => !v), close: () => setExpanded(false) };
}

// Classes of the expanded element; the caller adds its own layout (flex column, scrolling)
export const FULL_SCREEN_FRAME = 'fixed inset-3 z-50 rounded-xl bg-card shadow-[0_0_0_4px_var(--frame),0_24px_60px_oklch(0_0_0/0.6)]';

export function FullScreenBackdrop({ onClose }: { onClose: () => void }) {
    return <div className="fixed inset-0 z-50 bg-page/70 backdrop-blur-[3px]" onClick={onClose} />;
}

export function FullScreenButton({ expanded, onToggle, className }: { expanded: boolean; onToggle: () => void; className?: string }) {
    const t = useTranslations('TradingViewWidget');
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn('icon-btn', className)}
            aria-label={expanded ? t('exitFullScreen') : t('fullScreen')}
            title={expanded ? t('exitFullScreenHint') : t('fullScreen')}
        >
            {expanded ? <Minimize2 /> : <Maximize2 />}
        </button>
    );
}
