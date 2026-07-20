import { LitElement } from "./lit-vendor.js";
export declare class DruidTab extends LitElement {
    panel: string;
    active: boolean;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DruidTabs extends LitElement {
    active: string;
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
        "druid-tab": DruidTab;
        "druid-tabs": DruidTabs;
    }
}
