import { LitElement } from "./lit-vendor.js";
export declare class DruidFooter extends LitElement {
    brand: string;
    version: string;
    author: string;
    github: string;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-footer": DruidFooter;
    }
}
