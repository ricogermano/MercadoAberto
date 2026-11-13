'use client';

import { Moon, Sun, SunMoon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setPref, useThemePref } from "@/hooks/useTheme";
import type { ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type ThemeLabels = { label: string; auto: string; light: string; dark: string };

// Public pages have no intl provider, so they use the Portuguese text directly
export const THEME_LABELS_PT: ThemeLabels = { label: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Escuro' };

const ICONS = { auto: SunMoon, light: Sun, dark: Moon } as const;
const PREFS: ThemePref[] = ['auto', 'light', 'dark'];

// compact: icon-only button for page headers; otherwise a sidebar row like the language switcher
export default function ThemeSwitcher({ labels, compact = false, className }: { labels: ThemeLabels; compact?: boolean; className?: string }) {
    const pref = useThemePref();
    const Icon = ICONS[pref];

    return (
        <DropdownMenu>
            {compact ? (
                <DropdownMenuTrigger className={cn('icon-btn outline-none', className)} title={`${labels.label}: ${labels[pref]}`} aria-label={`${labels.label}: ${labels[pref]}`}>
                    <Icon />
                </DropdownMenuTrigger>
            ) : (
                <DropdownMenuTrigger className={cn('side-item h-8 w-full text-start outline-none', className)}>
                    <Icon />
                    <span className="flex-1">{labels.label}</span>
                    <span className="text-xs text-faint" suppressHydrationWarning>{labels[pref]}</span>
                </DropdownMenuTrigger>
            )}
            <DropdownMenuContent side={compact ? 'bottom' : 'top'} align={compact ? 'end' : 'start'} className={compact ? 'min-w-40' : 'w-(--radix-dropdown-menu-trigger-width)'}>
                <DropdownMenuRadioGroup value={pref} onValueChange={(next) => setPref(next as ThemePref)}>
                    {PREFS.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>{labels[option]}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
