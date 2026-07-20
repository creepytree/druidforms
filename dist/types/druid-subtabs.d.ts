import { LitElement } from "./lit-vendor.js";
import "./druid-tabs.js";
export declare class DruidSubtabs extends LitElement {
    active: string;
    heading: string;
    boxed: boolean;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    firstUpdated(): void;
    updated(): void;
    private onTabClick;
    private sync;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-subtabs": DruidSubtabs;
    }
}
