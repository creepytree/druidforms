import { LitElement } from "./lit-vendor.js";
import "./druid-accent-picker.js";
import "./druid-flavor-picker.js";
import "./druid-icon-button.js";
export declare class DruidNavbar extends LitElement {
    brand: string;
    logoutHref: string;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-navbar": DruidNavbar;
    }
}
