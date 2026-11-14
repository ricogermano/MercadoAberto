'use client';

import { CircleHelp, TriangleAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// A small "?" that opens a short explanation on click, so it works on touch and keyboard as well as with a mouse
// `warn` swaps the "?" for a caution mark, for a note about one specific value rather than about a column
export default function HelpPopover({ label, title, body, warn = false }: { label: string; title: string; body: string; warn?: boolean }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" aria-label={label} className={`hit hover:opacity-100 ${warn ? 'text-warn opacity-90' : 'text-faint opacity-75 hover:text-brand-ink'}`}>
                    {warn ? <TriangleAlert className="size-3.5" aria-hidden /> : <CircleHelp className="size-3.5" aria-hidden />}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-72 whitespace-normal p-3 text-start text-[12.5px] font-normal">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 leading-snug">{body}</p>
            </PopoverContent>
        </Popover>
    );
}
