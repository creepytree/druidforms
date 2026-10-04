import { LitElement } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
export declare class DruidSelect extends LitElement {
    name: string;
    value: string;
    placeholder: string;
    label: string;
    filter: boolean;
    free: boolean;
    multiple: boolean;
    min: number;
    compact: boolean;
    private open;
    private options;
    private query;
    private active;
    private trigger;
    private menu;
    private observer;
    private hiddenInputs;
    private pin;
    private dragFrom;
    private dragMoved;
    private refocus;
    get values(): string[];
    set values(list: string[]);
    static styles: import("lit").CSSResult[];
    connectedCallback(): void;
    disconnectedCallback(): void;
    private readOptions;
    private labelFor;
    private visible;
    private onOutsideClick;
    private onKeydown;
    private onOwnKeydown;
    private onFilterInput;
    private select;
    private unpick;
    private move;
    private onPillKeydown;
    private commit;
    private syncHiddenInputs;
    protected willUpdate(changed: PropertyValues): void;
    protected updated(changed: PropertyValues): void;
    private showMenu;
    private hideMenu;
    private chevron;
    private pills;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-select": DruidSelect;
    }
}
