import { LitElement } from "./lit-vendor.js";
export declare class DruidPopover extends LitElement {
    placement: "bottom-start" | "bottom-end" | "top-start" | "top-end" | "left-start" | "right-start";
    private open;
    private anchor;
    private panel;
    private pin;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    show(): void;
    hide(): void;
    toggle(): void;
    private onOutsideClick;
    private onKeydown;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-popover": DruidPopover;
    }
}
