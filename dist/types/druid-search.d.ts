import { LitElement } from "./lit-vendor.js";
export declare class DruidSearch extends LitElement {
    name: string;
    placeholder: string;
    value: string;
    debounce: number;
    private timer;
    protected createRenderRoot(): this;
    get input(): HTMLInputElement | null;
    focus(): void;
    private onInput;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-search": DruidSearch;
    }
}
