'use client';

import { useEffect } from "react";
import { applyTheme } from "@/hooks/useTheme";

// Keeps "auto" honest while the app stays open: re-checks the clock every minute, when the tab comes back,
// and when another tab changes the choice.
export default function ThemeWatcher() {
    useEffect(() => {
        applyTheme();
        const timer = setInterval(applyTheme, 60_000);
        document.addEventListener('visibilitychange', applyTheme);
        window.addEventListener('storage', applyTheme);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', applyTheme);
            window.removeEventListener('storage', applyTheme);
        };
    }, []);
    return null;
}
