import { LitElement } from "./lit-vendor.js";
export declare class DruidLoginCard extends LitElement {
    brand: string;
    action: string;
    error: string;
    subtitle: string;
    protected createRenderRoot(): this;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-login-card": DruidLoginCard;
    }
}
