import { LitElement } from "./lit-vendor.js";
import type { TemplateResult } from "./lit-vendor.js";
export declare class DruidDots extends LitElement {
    static styles: import("lit").CSSResult;
    /** fixed variant; empty picks one of the four at random per instance */
    variant: "flash" | "fade" | "wave" | "pulse" | "";
    /** smooth (text-sized, compositor-only) or classic (50px, box-shadow) */
    look: "smooth" | "classic";
    private readonly picked;
    render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-dots": DruidDots;
    }
}
