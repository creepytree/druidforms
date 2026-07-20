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
}
export declare const FLAVOR_SWATCHES: FlavorSwatch[];
export declare const FLAVORS: string[];
export declare const NEUTRAL_FLAVOR = "neutral";
export declare function stopRainbow(): void;
export declare function startRainbow(): void;
export declare function applyAccent(color: string): void;
export declare function saveAccent(value: string): void;
export declare function applyFlavor(name: string): void;
export declare function clearFlavor(): void;
export declare function saveFlavor(value: string): void;
export declare function clearSavedFlavor(): void;
export declare function storedFlavor(): string | null;
