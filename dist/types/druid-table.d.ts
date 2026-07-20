import { LitElement } from "./lit-vendor.js";
type Direction = "asc" | "desc";
export declare class DruidTable extends LitElement {
    heading: string;
    searchable: boolean;
    searchPlaceholder: string;
    filter: string;
    sortable: boolean;
    sort: string;
    direction: Direction;
    emptyText: string;
    boxed: boolean;
    private emptyVisible;
    private observer?;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected firstUpdated(): void;
    protected updated(changed: Map<string, unknown>): void;
    private observe;
    private get table();
    private get rows();
    private headers;
    private key;
    refresh(): void;
    setFilter(value: string): void;
    private onSearch;
    private onHeadClick;
    private cellValue;
    private apply;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-table": DruidTable;
    }
}
export {};
