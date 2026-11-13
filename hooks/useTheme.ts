'use client';

import { useSyncExternalStore } from "react";
import { THEME_EVENT, THEME_KEY, resolveTheme, type Theme, type ThemePref } from "@/lib/theme";

export const readPref = (): ThemePref => {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return stored === 'light' || stored === 'dark' ? stored : 'auto';
    } catch {
        return 'auto';
    }
};

// Puts the resolved theme on <html>; the CSS tokens and Tailwind's dark: variant both key off that class
export const applyTheme = () => {
    const theme = resolveTheme(readPref(), new Date().getHours());
    const root = document.documentElement;
    if (!root.classList.contains(theme)) {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.style.colorScheme = theme;
    }
};

export const setPref = (pref: ThemePref) => {
    try {
        if (pref === 'auto') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, pref);
    } catch {
        // Storage blocked: the choice lasts until the next reload
    }
    applyTheme();
    window.dispatchEvent(new Event(THEME_EVENT));
};

const subscribePref = (notify: () => void) => {
    window.addEventListener(THEME_EVENT, notify);
    window.addEventListener('storage', notify);
    return () => {
        window.removeEventListener(THEME_EVENT, notify);
        window.removeEventListener('storage', notify);
    };
};

const subscribeTheme = (notify: () => void) => {
    const observer = new MutationObserver(notify);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
};

export const useThemePref = (): ThemePref => useSyncExternalStore(subscribePref, readPref, () => 'auto');

// The theme on screen right now. The server render assumes dark; the head script corrects it before paint.
export const useResolvedTheme = (): Theme =>
    useSyncExternalStore(
        subscribeTheme,
        () => (document.documentElement.classList.contains('light') ? 'light' : 'dark'),
        () => 'dark',
    );
