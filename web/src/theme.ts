/* Theming — two independent color axes, one palette (assets/palette.json):

     accent — the vivid hue of accent elements (hex; drives --accent*)
     flavor — the hue of the *neutral* surfaces (--flavor-hue / --flavor-on),
              a calm tint applied to background, border and text

   Holds the palette definition, CSS-variable application, favicon sync and
   rainbow mode. Imported for its side effect — applying the stored accent and
   flavor as soon as the bundle loads — and used by <druid-accent-picker> and
   <druid-flavor-picker> for the UI.

   The localStorage keys are namespaced per app via <body data-druids-slug="...">
   so every app remembers its own accent and flavor. */

import { LEAF_PATH } from "./leaf.js";
import palette from "../../assets/palette.json";

export interface AccentSwatch {
    name: string;
    hex: string;
    hue: number;
}

/* the accent palette lives in assets/palette.json (single source of truth),
   ordered as a hue walk for the rainbow loop */
export const ACCENT_SWATCHES: AccentSwatch[] = palette.accents;
export const ACCENTS: string[] = ACCENT_SWATCHES.map((swatch) => swatch.hex);
export const DEFAULT_ACCENT =
    ACCENT_SWATCHES.find((swatch) => swatch.name === palette.default)?.hex ?? ACCENTS[0];
export const RAINBOW_VALUE = "rainbow";

export interface FlavorSwatch {
    name: string;
    hue: number;
}

/* the flavor axis reuses the accent palette's names + order, but takes only
   each swatch's oklch hue — the surfaces supply their own lightness/chroma */
export const FLAVOR_SWATCHES: FlavorSwatch[] = ACCENT_SWATCHES.map((swatch) => ({
    name: swatch.name,
    hue: swatch.hue,
}));
export const FLAVORS: string[] = FLAVOR_SWATCHES.map((swatch) => swatch.name);
/* the one flavor that is not a hue: grey surfaces (chroma gated to 0) */
export const NEUTRAL_FLAVOR = "neutral";

const RAINBOW_CYCLE_MS = 40000;
let rainbowTimer: ReturnType<typeof setInterval> | null = null;

function storageKey(axis: string): string {
    return `${document.body?.dataset.druidsSlug || "druids"}-${axis}`;
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
    localStorage.setItem(storageKey("accent"), value);
}

function applyStored(): void {
    const stored = localStorage.getItem(storageKey("accent"));
    if (stored === RAINBOW_VALUE) {
        startRainbow();
    } else {
        applyAccent(/^#[0-9a-f]{6}$/i.test(stored || "") ? (stored as string) : DEFAULT_ACCENT);
    }
}

/* Publish the brand leaf as a CSS mask url so light-DOM styles can use it
   without a second copy of the vector (assets/leaf.svg stays the only source).
   .df-empty paints it as an accent-tinted watermark. */
function publishLeafMark(): void {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
        `<path fill="#000" d="${LEAF_PATH}"/></svg>`;
    document.documentElement.style.setProperty(
        "--df-empty-mark",
        `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    );
}

/* ---------- flavor ---------- */

/* Tint the neutral surfaces with a palette hue. `name` is a swatch name or
   NEUTRAL_FLAVOR for a grey (untinted) base; anything else is ignored. */
export function applyFlavor(name: string): void {
    const root = document.documentElement;
    if (name === NEUTRAL_FLAVOR) {
        root.style.setProperty("--flavor-on", "0");
        return;
    }
    const swatch = FLAVOR_SWATCHES.find((entry) => entry.name === name);
    if (!swatch) return;
    root.style.setProperty("--flavor-hue", String(swatch.hue));
    root.style.setProperty("--flavor-on", "1");
}

/* back to the stock tint: drop the overrides so druids.css owns the value */
export function clearFlavor(): void {
    const root = document.documentElement;
    root.style.removeProperty("--flavor-hue");
    root.style.removeProperty("--flavor-on");
}

export function saveFlavor(value: string): void {
    localStorage.setItem(storageKey("flavor"), value);
}

export function clearSavedFlavor(): void {
    localStorage.removeItem(storageKey("flavor"));
}

/* the stored flavor name, or null when the app is on the stock tint */
export function storedFlavor(): string | null {
    const stored = localStorage.getItem(storageKey("flavor"));
    if (stored === NEUTRAL_FLAVOR) return stored;
    return FLAVORS.includes(stored || "") ? (stored as string) : null;
}

function applyStoredFlavor(): void {
    const stored = storedFlavor();
    if (stored) applyFlavor(stored);
}

/* module side effect: restore the accent and flavor as soon as the bundle loads */
function restore(): void {
    applyStored();
    applyStoredFlavor();
}

publishLeafMark();
if (document.body) {
    restore();
} else {
    document.addEventListener("DOMContentLoaded", restore);
}
