import { LitElement } from "./lit-vendor.js";
export declare class DruidFlavorPicker extends LitElement {
    private open;
    private current;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private onOutsideClick;
    private pick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-flavor-picker": DruidFlavorPicker;
    }
}
