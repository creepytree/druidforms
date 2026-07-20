import { LitElement } from "./lit-vendor.js";
export declare class DruidProgress extends LitElement {
    value: number;
    max: number;
    indeterminate: boolean;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-progress": DruidProgress;
    }
}
