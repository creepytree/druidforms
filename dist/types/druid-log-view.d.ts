import { LitElement } from "./lit-vendor.js";
import "./druid-icon-button.js";
import "./druid-select.js";
export interface LogEntry {
    time?: string;
    level?: string;
    source?: string;
    message: string;
}
export declare class DruidLogView extends LitElement {
    src: string;
    poll: number;
    boxed: boolean;
    heading: string;
    private entries;
    private level;
    private follow;
    private error;
    private timer;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private get visible();
    private onVisibilityHint;
    private start;
    private stop;
    refresh(): Promise<void>;
    protected updated(): void;
    private onFilter;
    private onFollowToggle;
    private renderLine;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "druid-log-view": DruidLogView;
    }
}
