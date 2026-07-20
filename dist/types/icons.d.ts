export declare function registerIcon(name: string, svg: string): void;
export declare function registerIcons(icons: Record<string, string>): void;
export declare function getIcon(name: string): string | undefined;
export declare function onIconsChanged(listener: () => void): () => void;
