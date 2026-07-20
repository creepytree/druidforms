export type ToastType = "info" | "ok" | "warn" | "danger";
export declare function toast(message: string, type?: ToastType, duration?: number): HTMLElement;
