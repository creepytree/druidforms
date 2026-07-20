export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end" | "left-start" | "right-start";
export interface AnchorOptions {
    placement?: Placement;
    gap?: number;
    matchWidth?: boolean;
}
export interface AnchorHandle {
    update(): void;
    release(): void;
}
export declare function anchor(panel: HTMLElement, target: Element, opts?: AnchorOptions): AnchorHandle;
