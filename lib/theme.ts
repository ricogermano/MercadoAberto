// Light by day, dark by night, unless the visitor picks one. The choice lives in localStorage (per browser).
export type ThemePref = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'ma-theme';
export const THEME_EVENT = 'ma-theme-change';
// "auto" is light from 6:00 to 17:59 on the visitor's clock
export const DAY_START = 6;
export const DAY_END = 18;

export const resolveTheme = (pref: ThemePref, hour: number): Theme =>
    pref === 'auto' ? (hour >= DAY_START && hour < DAY_END ? 'light' : 'dark') : pref;

// Runs before the first paint so the page never flashes the wrong theme. Keep in step with resolveTheme.
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_KEY}'),h=new Date().getHours(),t=p==='light'||p==='dark'?p:(h>=${DAY_START}&&h<${DAY_END}?'light':'dark'),e=document.documentElement;e.classList.remove('light','dark');e.classList.add(t);e.style.colorScheme=t}catch(e){}})()`;
