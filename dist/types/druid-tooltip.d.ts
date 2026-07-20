import { LitElement } from "./lit-vendor.js";
export declare class DruidTooltip extends LitElement {
    text: string;
    placement: "top" | "bottom" | "left" | "right";
    disabled: boolean;
    private open;
    private bubble;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private show;
    private hide;
    private onKeydown;
    private position;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-tooltip": DruidTooltip;
    }
}
