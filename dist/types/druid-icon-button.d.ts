import { LitElement } from "./lit-vendor.js";
import "./druid-icon.js";
export declare class DruidIconButton extends LitElement {
    variant: "default" | "soft" | "soft-danger";
    label: string;
    icon: string;
    href: string;
    active: boolean;
    toggle: boolean;
    circle: boolean;
    small: boolean;
    loading: boolean;
    static styles: import("lit").CSSResult;
    private onClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-icon-button": DruidIconButton;
    }
}
