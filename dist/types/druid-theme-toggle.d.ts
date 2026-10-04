import { LitElement } from "./lit-vendor.js";
export declare class DruidThemeToggle extends LitElement {
    private theme;
    private resolved;
    static styles: import("lit").CSSResult[];
    connectedCallback(): void;
    disconnectedCallback(): void;
    private media;
    private onSystemChange;
    private cycle;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-theme-toggle": DruidThemeToggle;
    }
}
