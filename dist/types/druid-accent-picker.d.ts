import { LitElement } from "./lit-vendor.js";
export declare class DruidAccentPicker extends LitElement {
    private open;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private onOutsideClick;
    private pick;
    private pickRainbow;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-accent-picker": DruidAccentPicker;
    }
}
