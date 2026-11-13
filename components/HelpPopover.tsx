'use client';

import { CircleHelp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// A small "?" that opens a short explanation on click, so it works on touch and keyboard as well as with a mouse
export default function HelpPopover({ label, title, body }: { label: string; title: string; body: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" aria-label={label} className="text-faint opacity-60 hover:text-brand-ink hover:opacity-100">
                    <CircleHelp className="size-3.5" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-72 whitespace-normal p-3 text-start text-[12.5px] font-normal">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 leading-snug">{body}</p>
            </PopoverContent>
        </Popover>
    );
}
