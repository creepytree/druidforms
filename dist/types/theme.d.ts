export interface AccentSwatch {
    name: string;
    hex: string;
    hue: number;
}
export declare const ACCENT_SWATCHES: AccentSwatch[];
export declare const ACCENTS: string[];
export declare const DEFAULT_ACCENT: string;
export declare const RAINBOW_VALUE = "rainbow";
export interface FlavorSwatch {
    name: string;
    hue: number;
    hex: string;
}
export declare const FLAVOR_SWATCHES: FlavorSwatch[];
export declare const FLAVORS: string[];
export declare const DEFAULT_FLAVOR: string;
export declare const NEUTRAL_FLAVOR = "neutral";
export declare function stopRainbow(): void;
export declare function startRainbow(): void;
export declare function applyAccent(color: string): void;
export declare function saveAccent(value: string): void;
export type ThemeName = "auto" | "light" | "dark";
export declare const THEMES: ThemeName[];
export declare const DEFAULT_THEME: ThemeName;
export declare function resolvedTheme(): "light" | "dark";
export declare function currentTheme(): ThemeName;
export declare function applyTheme(name: ThemeName): void;
export declare function saveTheme(value: string): void;
export declare function storedTheme(): ThemeName;
export declare function stopFlavorRainbow(): void;
export declare function startFlavorRainbow(): void;
export declare function applyFlavor(name: string): void;
export declare function clearFlavor(): void;
export declare function saveFlavor(value: string): void;
export declare function clearSavedFlavor(): void;
export declare function storedFlavor(): string | null;
