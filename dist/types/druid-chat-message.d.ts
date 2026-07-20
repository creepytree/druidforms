import { LitElement } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
import "./druid-dots.js";
export declare class DruidChatMessage extends LitElement {
    sender: "user" | "assistant";
    label: string;
    streaming: boolean;
    private hasActions;
    private empty;
    private observer;
    static styles: import("lit").CSSResult;
    disconnectedCallback(): void;
    protected willUpdate(changed: PropertyValues): void;
    private unwatch;
    private checkEmpty;
    private onActionsSlotChange;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-chat-message": DruidChatMessage;
    }
}
