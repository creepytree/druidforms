import { LitElement } from "./lit-vendor.js";
export declare class DruidButton extends LitElement {
    variant: "default" | "primary" | "danger" | "soft" | "soft-danger" | "outline";
    type: "button" | "submit";
    disabled: boolean;
    active: boolean;
    toggle: boolean;
    loading: boolean;
    static styles: import("lit").CSSResult;
    private onClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-button": DruidButton;
    }
}
