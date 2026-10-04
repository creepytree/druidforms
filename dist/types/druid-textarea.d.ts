import { LitElement } from "./lit-vendor.js";
export declare class DruidTextarea extends LitElement {
    name: string;
    placeholder: string;
    value: string;
    rows: number;
    maxlength: number;
    autosize: boolean;
    disabled: boolean;
    required: boolean;
    protected createRenderRoot(): this;
    get textarea(): HTMLTextAreaElement | null;
    focus(): void;
    private onInput;
    private resize;
    protected updated(changed: Map<string, unknown>): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-textarea": DruidTextarea;
    }
}
