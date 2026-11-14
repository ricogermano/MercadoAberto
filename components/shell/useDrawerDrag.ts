import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent, type DragEvent as ReactDragEvent, type RefObject } from 'react';

const HYSTERESIS = 10; // px of movement before a touch counts as a drag (taps and vertical scrolls stay untouched)
const VELOCITY_WINDOW = 100; // ms of pointer history used for the release speed

// Where a flick would come to rest: exponential decay, the same curve as scroll deceleration
const project = (velocity: number, decelerationRate = 0.998) => (velocity / 1000) * decelerationRate / (1 - decelerationRate);
// Past the open edge the drawer follows less and less instead of stopping dead
const rubberband = (overshoot: number, dimension: number, constant = 0.55) =>
    (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

type Drag = { id: number; startX: number; startY: number; active: boolean; sign: 1 | -1; width: number; amount: number; history: { t: number; x: number }[] };

// The mobile menu follows the finger: drag it towards its edge to close. A slow drag closes past the halfway
// point; a flick closes from anywhere, because the decision uses where the movement would end, not where it stopped.
export function useDrawerDrag(open: boolean, onClose: () => void, drawerRef: RefObject<HTMLElement | null>, scrimRef: RefObject<HTMLElement | null>) {
    const drag = useRef<Drag | null>(null);
    const dragged = useRef(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const release = (durationMs?: number) => {
        const el = drawerRef.current;
        const scrim = scrimRef.current;
        if (el) {
            el.style.transform = '';
            el.style.transition = '';
            el.style.userSelect = '';
            // The settle starts from where the finger left it; a fast flick gets a shorter settle so the speed carries over
            if (durationMs) {
                el.style.transitionDuration = `${durationMs}ms`;
                el.addEventListener('transitionend', () => { el.style.transitionDuration = ''; }, { once: true });
            }
        }
        if (scrim) { scrim.style.opacity = ''; scrim.style.transition = ''; }
    };

    const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
        if (!open || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const el = drawerRef.current;
        if (!el) return;
        dragged.current = false;
        drag.current = {
            id: e.pointerId, startX: e.clientX, startY: e.clientY, active: false,
            // The drawer leaves towards its own edge: left normally, right in Arabic
            sign: getComputedStyle(el).direction === 'rtl' ? 1 : -1,
            width: el.offsetWidth, amount: 0, history: [{ t: e.timeStamp, x: e.clientX }],
        };
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current;
        const el = drawerRef.current;
        if (!d || !el || e.pointerId !== d.id) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (!d.active) {
            if (Math.abs(dy) > HYSTERESIS && Math.abs(dy) >= Math.abs(dx)) { drag.current = null; return; } // scrolling the list
            if (Math.abs(dx) < HYSTERESIS) return;
            d.active = true;
            dragged.current = true;
            d.startX = e.clientX; // start from here so the drawer does not jump by the threshold
            try { el.setPointerCapture(d.id); } catch { /* pointer already gone */ }
            el.style.transition = 'none';
            el.style.userSelect = 'none'; // a mouse drag must not select the menu text
            if (scrimRef.current) scrimRef.current.style.transition = 'none';
        }
        const towardsClosed = (e.clientX - d.startX) * d.sign;
        d.amount = towardsClosed >= 0 ? Math.min(towardsClosed, d.width) : -rubberband(-towardsClosed, d.width);
        el.style.transform = `translateX(${d.amount * d.sign}px)`;
        if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0, Math.min(1, 1 - d.amount / d.width)));
        d.history.push({ t: e.timeStamp, x: e.clientX });
        while (d.history.length > 2 && e.timeStamp - d.history[0].t > VELOCITY_WINDOW) d.history.shift();
    };

    const onPointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        drag.current = null;
        if (!d.active) return;
        const first = d.history[0];
        const last = d.history[d.history.length - 1];
        const elapsed = last.t - first.t;
        // px/s towards the closed side; a finger that paused before lifting has no speed left
        const velocity = elapsed > 0 && e.timeStamp - last.t < VELOCITY_WINDOW ? ((last.x - first.x) / elapsed) * 1000 * d.sign : 0;
        const closes = e.type === 'pointerup' && d.amount + project(velocity) > d.width / 2;
        const remaining = closes ? d.width - d.amount : Math.abs(d.amount);
        const speed = Math.abs(velocity);
        release(speed > 200 ? Math.max(120, Math.min(300, (remaining / speed) * 1000 * 2)) : undefined);
        if (closes) onClose();
    };

    // A drag that ends over a link must not open it
    const onClickCapture = (e: ReactMouseEvent<HTMLElement>) => {
        if (!dragged.current) return;
        dragged.current = false;
        e.preventDefault();
        e.stopPropagation();
    };

    // With a mouse, the browser would start dragging the link under the pointer and stop reporting movement
    const onDragStart = (e: ReactDragEvent<HTMLElement>) => { if (drag.current) e.preventDefault(); };

    // onLostPointerCapture: if the browser takes the pointer away without an up or a cancel, the drawer still settles
    return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onLostPointerCapture: onPointerEnd, onClickCapture, onDragStart };
}
