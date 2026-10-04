/* Theming — two color axes and a theme, one palette (assets/palette.json):

     accent — the vivid hue of accent elements (hex; drives --accent*)
     flavor — the hue of the *neutral* surfaces (--flavor-hue / --flavor-on),
              a calm tint applied to background, border and text
     theme  — which end of the surface ladder is up: "dark", "light", or
              "auto" (follow the OS). Resolved here, never in CSS: the
              *resolved* value is written to <html data-theme> so druids.css
              defines the ladder once and light mode only restates its scalars.

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
    /* the palette hex this hue came from — the surfaces never paint it (they
       supply their own lightness/chroma), but the picker does, so the two
       swatch rows read as one palette in one order */
    hex: string;
}

/* the flavor axis is the accent palette seen from the other side: same names,
   same order, same colors in the picker — only the oklch hue is carried
   through to the surfaces */
export const FLAVOR_SWATCHES: FlavorSwatch[] = ACCENT_SWATCHES.map((swatch) => ({
    name: swatch.name,
    hue: swatch.hue,
    hex: swatch.hex,
}));
export const FLAVORS: string[] = FLAVOR_SWATCHES.map((swatch) => swatch.name);
/* the flavor an app opens with — the palette's default swatch, the same one the
   accent defaults to. druids.css carries its hue as --df-flavor-default-hue so the
   first paint is already right; gen-contracts.mjs fails the build if they drift. */
export const DEFAULT_FLAVOR: string = palette.default;
/* kept for apps that call applyFlavor("neutral"): it means "back to the default" */
export const NEUTRAL_FLAVOR = "neutral";

const RAINBOW_CYCLE_MS = 40000;
let rainbowTimer: ReturnType<typeof setInterval> | null = null;

function storageKey(axis: string): string {
    return `${document.body?.dataset.druidsSlug || "druids"}-${axis}`;
}

function hexToRgb(color: string): [number, number, number] {
    return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
}

function toHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* WCAG relative luminance */
function luminance(r: number, g: number, b: number): number {
    const channel = (value: number): number => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/* The palette is tuned to sit on a dark field; the same hex on a white one is
   too light to read as text or to hold white label text as a fill. Walk the
   color toward black — a straight line that keeps the hue — until it clears
   4.5:1 against white. Dark mode never calls this. */
const LIGHT_MAX_LUMINANCE = 1.05 / 4.5 - 0.05;

function darkenForLight(r: number, g: number, b: number): [number, number, number] {
    if (luminance(r, g, b) <= LIGHT_MAX_LUMINANCE) return [r, g, b];
    let low = 0;
    let high = 1;
    for (let i = 0; i < 18; i++) {
        const mid = (low + high) / 2;
        if (luminance(r * mid, g * mid, b * mid) > LIGHT_MAX_LUMINANCE) high = mid;
        else low = mid;
    }
    return [Math.round(r * low), Math.round(g * low), Math.round(b * low)];
}

function setAccentVars(r: number, g: number, b: number): string {
    const root = document.documentElement;
    /* the soft wash stays on the *given* color: as a 18% fill it is a tint of
       the surface, and darkening it would only muddy a light page */
    root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.18)`);
    const [ar, ag, ab] = resolved === "light" ? darkenForLight(r, g, b) : [r, g, b];
    root.style.setProperty("--accent", toHex(ar, ag, ab));
    root.style.setProperty("--accent-rgb", `${ar}, ${ag}, ${ab}`);
    return toHex(r, g, b);
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
    current = color;
    const [r, g, b] = hexToRgb(color);
    setAccentVars(r, g, b);
    /* the favicon sits on browser chrome, not on the page — it keeps the
       palette color whichever way the theme goes */
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

/* ---------- theme ---------- */

export type ThemeName = "auto" | "light" | "dark";
export const THEMES: ThemeName[] = ["auto", "light", "dark"];
export const DEFAULT_THEME: ThemeName = "auto";

/* what the user asked for, and what that currently resolves to. CSS only ever
   sees `resolved`; `preference` is what the toggle cycles and what is stored. */
let preference: ThemeName = DEFAULT_THEME;
let resolved: "light" | "dark" = "dark";
/* the accent hex as given, before any light-mode darkening */
let current = DEFAULT_ACCENT;
let themeMedia: MediaQueryList | null = null;

function systemTheme(): "light" | "dark" {
    return themeMedia?.matches ? "light" : "dark";
}

/* re-resolve on an OS change, but only while the app is actually on "auto" */
function onSystemThemeChange(): void {
    if (preference === "auto") applyTheme("auto");
}

/* The theme the page is painted in right now ("auto" already resolved). */
export function resolvedTheme(): "light" | "dark" {
    return resolved;
}

/* The theme the user picked — "auto" stays "auto" here. */
export function currentTheme(): ThemeName {
    return preference;
}

/* Paint the page dark, light, or whichever the OS asks for. Writes the
   *resolved* theme to <html data-theme>, and re-applies the accent, which is
   tuned per theme (see darkenForLight). */
export function applyTheme(name: ThemeName): void {
    preference = THEMES.includes(name) ? name : DEFAULT_THEME;
    if (preference === "auto" && !themeMedia) {
        themeMedia = window.matchMedia("(prefers-color-scheme: light)");
        themeMedia.addEventListener("change", onSystemThemeChange);
    }
    resolved = preference === "auto" ? systemTheme() : preference;
    document.documentElement.dataset.theme = resolved;
    /* the accent is a different hex on a light field, and rainbow mode writes
       its own frames — leave it running rather than snapping it back */
    if (!rainbowTimer) {
        const [r, g, b] = hexToRgb(current);
        setAccentVars(r, g, b);
    }
}

export function saveTheme(value: string): void {
    localStorage.setItem(storageKey("theme"), value);
}

/* the stored preference, or the default when nothing was ever picked */
export function storedTheme(): ThemeName {
    const stored = localStorage.getItem(storageKey("theme")) as ThemeName | null;
    return stored && THEMES.includes(stored) ? stored : DEFAULT_THEME;
}

/* ---------- flavor ---------- */

const FLAVOR_CYCLE_MS = 40000;
let flavorTimer: ReturnType<typeof setInterval> | null = null;

export function stopFlavorRainbow(): void {
    if (flavorTimer) {
        clearInterval(flavorTimer);
        flavorTimer = null;
    }
}

/* flavor rainbow: the surfaces walk slowly through the palette's hues, the same
   loop the accent has. The hues are unwrapped into one increasing run, so the walk
   always turns the same way round the wheel instead of doubling back at 360°. */
export function startFlavorRainbow(): void {
    stopFlavorRainbow();
    const hues: number[] = [];
    for (const swatch of FLAVOR_SWATCHES) {
        let hue = swatch.hue;
        while (hues.length && hue < hues[hues.length - 1]) hue += 360;
        hues.push(hue);
    }
    let back = hues[0];
    while (back <= hues[hues.length - 1]) back += 360;
    hues.push(back);
    const root = document.documentElement;
    root.style.setProperty("--flavor-on", "1");
    const start = performance.now();
    flavorTimer = setInterval(() => {
        const t = (((performance.now() - start) % FLAVOR_CYCLE_MS) / FLAVOR_CYCLE_MS) * (hues.length - 1);
        const step = Math.floor(t);
        const hue = hues[step] + (hues[step + 1] - hues[step]) * (t - step);
        root.style.setProperty("--flavor-hue", (hue % 360).toFixed(1));
    }, 120);
}

/* Tint the neutral surfaces with a palette hue. `name` is a swatch name;
   NEUTRAL_FLAVOR means the default tint (--df-flavor-default-hue). Anything else
   is ignored. Stops a running flavor rainbow. */
export function applyFlavor(name: string): void {
    const root = document.documentElement;
    if (name === NEUTRAL_FLAVOR) {
        clearFlavor();
        return;
    }
    const swatch = FLAVOR_SWATCHES.find((entry) => entry.name === name);
    if (!swatch) return;
    stopFlavorRainbow();
    root.style.setProperty("--flavor-hue", String(swatch.hue));
    root.style.setProperty("--flavor-on", "1");
}

/* back to the default tint: drop the overrides so druids.css owns the value */
export function clearFlavor(): void {
    stopFlavorRainbow();
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

/* the stored flavor name (or RAINBOW_VALUE), or null when the app is on the default tint */
export function storedFlavor(): string | null {
    const stored = localStorage.getItem(storageKey("flavor"));
    if (stored === NEUTRAL_FLAVOR || stored === RAINBOW_VALUE) return stored;
    return FLAVORS.includes(stored || "") ? (stored as string) : null;
}

function applyStoredFlavor(): void {
    const stored = storedFlavor();
    if (stored === RAINBOW_VALUE) startFlavorRainbow();
    else if (stored) applyFlavor(stored);
}

/* module side effect: restore the theme, accent and flavor as soon as the
   bundle loads. Theme goes first — it decides which field the accent is
   adjusted for, and applyStored() paints the accent right after. */
function restore(): void {
    applyTheme(storedTheme());
    applyStored();
    applyStoredFlavor();
}

publishLeafMark();
if (document.body) {
    restore();
} else {
    document.addEventListener("DOMContentLoaded", restore);
}
