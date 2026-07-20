import { LitElement } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
export declare class DruidSelect extends LitElement {
    name: string;
    value: string;
    placeholder: string;
    label: string;
    filter: boolean;
    free: boolean;
    private open;
    private options;
    private query;
    private active;
    private trigger;
    private menu;
    private observer;
    private hiddenInput;
    private pin;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private readOptions;
    private visible;
    private onOutsideClick;
    private onKeydown;
    private onOwnKeydown;
    private onFilterInput;
    private select;
    private syncHiddenInput;
    protected willUpdate(changed: PropertyValues): void;
    protected updated(changed: PropertyValues): void;
    private showMenu;
    private hideMenu;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-select": DruidSelect;
    }
}
