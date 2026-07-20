/* Accent theming: palette definition, CSS-variable application, favicon sync
   and rainbow mode. Imported for its side effect — applying the stored accent
   as soon as the bundle loads — and used by <druid-accent-picker> for the UI.

   The localStorage key is namespaced per app via <body data-druids-slug="...">
   so every app remembers its own accent. */

import { LEAF_PATH } from "./leaf.js";
import palette from "../../assets/palette.json";

export interface AccentSwatch {
    name: string;
    hex: string;
}

/* the accent palette lives in assets/palette.json (single source of truth),
   ordered as a hue walk for the rainbow loop */
export const ACCENT_SWATCHES: AccentSwatch[] = palette.accents;
export const ACCENTS: string[] = ACCENT_SWATCHES.map((swatch) => swatch.hex);
export const DEFAULT_ACCENT =
    ACCENT_SWATCHES.find((swatch) => swatch.name === palette.default)?.hex ?? ACCENTS[0];
export const RAINBOW_VALUE = "rainbow";

const RAINBOW_CYCLE_MS = 40000;
let rainbowTimer: ReturnType<typeof setInterval> | null = null;

function accentKey(): string {
    return `${document.body?.dataset.druidsSlug || "druids"}-accent`;
}

function hexToRgb(color: string): [number, number, number] {
    return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
}

function setAccentVars(r: number, g: number, b: number): string {
    const root = document.documentElement;
    const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.18)`);
    return hex;
}

/* keep the favicon leaf in the same accent */
function updateFavicon(color: string): void {
    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!favicon) return;
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
        `<path fill="${color}" d="${LEAF_PATH}"/></svg>`;
    favicon.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

export function stopRainbow(): void {
    if (rainbowTimer) {
        clearInterval(rainbowTimer);
        rainbowTimer = null;
    }
}

/* rainbow mode: slow walk through the swatches */
export function startRainbow(): void {
    stopRainbow();
    const start = performance.now();
    let lastStep = -1;
    rainbowTimer = setInterval(() => {
        const t = (((performance.now() - start) % RAINBOW_CYCLE_MS) / RAINBOW_CYCLE_MS) * ACCENTS.length;
        const step = Math.floor(t);
        const frac = t - step;
        const from = hexToRgb(ACCENTS[step]);
        const to = hexToRgb(ACCENTS[(step + 1) % ACCENTS.length]);
        const hex = setAccentVars(
            Math.round(from[0] + (to[0] - from[0]) * frac),
            Math.round(from[1] + (to[1] - from[1]) * frac),
            Math.round(from[2] + (to[2] - from[2]) * frac),
        );
        /* favicon once per swatch, rebuilding the data url every tick is wasteful */
        if (step !== lastStep) {
            updateFavicon(hex);
            lastStep = step;
        }
    }, 120);
}

export function applyAccent(color: string): void {
    stopRainbow();
    const [r, g, b] = hexToRgb(color);
    setAccentVars(r, g, b);
    updateFavicon(color);
}

export function saveAccent(value: string): void {
    localStorage.setItem(accentKey(), value);
}

function applyStored(): void {
    const stored = localStorage.getItem(accentKey());
    if (stored === RAINBOW_VALUE) {
        startRainbow();
    } else {
        applyAccent(/^#[0-9a-f]{6}$/i.test(stored || "") ? (stored as string) : DEFAULT_ACCENT);
    }
}

/* module side effect: restore the accent as soon as the bundle loads */
if (document.body) {
    applyStored();
} else {
    document.addEventListener("DOMContentLoaded", applyStored);
}
