// Squarified treemap (Bruls, Huizing, van Wijk): splits a rectangle into one tile per item, each with an area
// proportional to its value, keeping tiles as close to square as it can. Pure, so the heatmap can lay itself out
// again whenever its box changes size.

export type Rect = { x: number; y: number; w: number; h: number };

export function squarify<T>(items: T[], value: (item: T) => number, rect: Rect): { item: T; rect: Rect }[] {
    const nodes = items
        .map((item) => ({ item, v: value(item) }))
        .filter((n) => Number.isFinite(n.v) && n.v > 0)
        .sort((a, b) => b.v - a.v);
    const total = nodes.reduce((sum, n) => sum + n.v, 0);
    let { x, y, w, h } = rect;
    if (total <= 0 || !(w > 0) || !(h > 0)) return [];

    const scale = (w * h) / total;
    const out: { item: T; rect: Rect }[] = [];
    let i = 0;
    while (i < nodes.length) {
        // Rows are laid along the shorter side; a tile joins the row only while it keeps the worst aspect ratio from growing
        const side = Math.min(w, h);
        let sum = 0;
        let max = 0;
        let min = Infinity;
        let worst = Infinity;
        let j = i;
        while (j < nodes.length) {
            const area = nodes[j].v * scale;
            const nextSum = sum + area;
            const nextMax = Math.max(max, area);
            const nextMin = Math.min(min, area);
            const nextWorst = Math.max((side * side * nextMax) / (nextSum * nextSum), (nextSum * nextSum) / (side * side * nextMin));
            if (j > i && nextWorst > worst) break;
            sum = nextSum;
            max = nextMax;
            min = nextMin;
            worst = nextWorst;
            j++;
        }
        const thick = sum / side;
        const wide = w >= h;
        let offset = 0;
        for (let k = i; k < j; k++) {
            const length = (nodes[k].v * scale) / thick;
            out.push({ item: nodes[k].item, rect: wide ? { x, y: y + offset, w: thick, h: length } : { x: x + offset, y, w: length, h: thick } });
            offset += length;
        }
        if (wide) {
            x += thick;
            w -= thick;
        } else {
            y += thick;
            h -= thick;
        }
        i = j;
    }
    return out;
}
