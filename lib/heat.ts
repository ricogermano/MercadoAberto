// Heatmap colours, shared by the dashboard map (a client component) and the landing page preview (server-rendered)

// The colour scale is full at a 3% move either way, like TradingView's heatmaps
const FULL_SCALE = 3;

// Diverging scale: a neutral grey at 0%, then a saturated green for gains and red for losses that brightens with the
// move. The scale has its own endpoints (not --up/--down mixed into grey, which looked washed out); the brightest
// step stays dark enough for the white label text.
const HEAT = {
    up: ['oklch(0.43 0.13 150)', 'oklch(0.66 0.23 146)'],
    down: ['oklch(0.43 0.15 25)', 'oklch(0.60 0.245 27)'],
} as const;

export function heatColor(changePercent: number): string {
    const strength = Math.min(1, Math.abs(changePercent) / FULL_SCALE);
    if (!Number.isFinite(changePercent) || strength < 0.02) return 'oklch(0.32 0.008 95)';
    const [low, high] = HEAT[changePercent > 0 ? 'up' : 'down'];
    // Eased, so an ordinary 0.5%–1% day already shows clear colour instead of sitting near the dark end
    return `color-mix(in oklab, ${high} ${Math.round(strength ** 0.65 * 100)}%, ${low})`;
}
