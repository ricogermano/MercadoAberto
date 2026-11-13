'use client';
import { useEffect, useRef } from "react";
import { useResolvedTheme } from "@/hooks/useTheme";

// Widget configs are written for the dark theme; in the light theme the same config is repainted here,
// so every embed follows the app without each config knowing about themes.
const LIGHT_OVERRIDES: Record<string, unknown> = {
    colorTheme: 'light',
    theme: 'light',
    backgroundColor: '#ffffff',
    gridColor: 'rgba(0, 0, 0, 0.06)',
    scaleFontColor: '#5c5a52',
    plotLineColorGrowing: '#0f9e84',
    plotLineColorFalling: '#0f9e84',
    belowLineFillColorGrowing: 'rgba(15, 158, 132, 0.14)',
    belowLineFillColorFalling: 'rgba(15, 158, 132, 0.14)',
    belowLineFillColorGrowingBottom: 'rgba(15, 158, 132, 0)',
    belowLineFillColorFallingBottom: 'rgba(15, 158, 132, 0)',
    symbolActiveColor: 'rgba(15, 158, 132, 0.10)',
};

const forLight = (config: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(config).map(([key, value]) => [key, key in LIGHT_OVERRIDES ? LIGHT_OVERRIDES[key] : value]));

// Mounts a TradingView embed once per script + config. Size changes (e.g. fullscreen) must not
// re-run this: re-creating the embed wipes indicators the user added. A theme change does re-create it.
const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const theme = useResolvedTheme();
    const serializedConfig = JSON.stringify(theme === 'light' ? forLight(config) : config);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '<div class="tradingview-widget-container__widget" style="width: 100%; height: 100%;"></div>';

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = serializedConfig;
        container.appendChild(script);

        return () => {
            container.innerHTML = '';
        }
    }, [scriptUrl, serializedConfig])

    return containerRef;
}
export default useTradingViewWidget
