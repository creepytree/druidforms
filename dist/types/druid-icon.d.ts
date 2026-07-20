import { LitElement, nothing } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
export declare class DruidIcon extends LitElement {
    name: string;
    size: string;
    private rev;
    private unsubscribe?;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected willUpdate(changed: PropertyValues): void;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-icon": DruidIcon;
    }
}
