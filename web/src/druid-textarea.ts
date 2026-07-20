/* <druid-textarea> — a textarea whose default height is set in line counts.

   rows      default height in lines (min height when autosizing)
   autosize  grow with content while typing

   Renders a native <textarea> into light DOM so it participates in forms
   (name/value POST like any input) and stays reachable for app JS via
   `el.value` or `el.textarea`. Base styling comes from druids.css.

   <druid-textarea name="description" rows="4"></druid-textarea>
   <druid-textarea rows="1" autosize></druid-textarea> */

import { html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-textarea")
export class DruidTextarea extends LitElement {
    @property() name = "";
    @property() placeholder = "";
    @property() value = "";
    @property({ type: Number }) rows = 3;
    @property({ type: Number }) maxlength = -1;
    @property({ type: Boolean, reflect: true }) autosize = false;
    @property({ type: Boolean }) disabled = false;
    @property({ type: Boolean }) required = false;

    /* light DOM: the native textarea must sit in the page for form submission */
    protected createRenderRoot() {
        return this;
    }

    get textarea(): HTMLTextAreaElement | null {
        return this.querySelector("textarea");
    }

    focus(): void {
        this.textarea?.focus();
    }

    private onInput(event: Event): void {
        this.value = (event.target as HTMLTextAreaElement).value;
        if (this.autosize) this.resize();
    }

    /* collapse to the rows-derived height, then grow to fit the content */
    private resize(): void {
        const ta = this.textarea;
        if (!ta) return;
        /* empty: fall back to the native rows height — scrollHeight would
           otherwise measure the (possibly wrapped) placeholder text */
        if (!ta.value) {
            ta.style.height = "";
            return;
        }
        ta.style.height = "auto";
        /* +2 for the border (border-box); rows keeps acting as the minimum
           because height:auto can never drop below the rows box */
        ta.style.height = `${ta.scrollHeight + 2}px`;
    }

    protected updated(changed: Map<string, unknown>): void {
        if (this.autosize && (changed.has("value") || changed.has("rows") || changed.has("autosize"))) {
            this.resize();
        }
    }

    render() {
        /* single-line template: light-DOM rendering turns template whitespace
           into real text nodes that produce phantom line boxes (e.g. inside
           table cells), so none is allowed around the textarea */
        // prettier-ignore
        return html`<textarea name=${this.name} rows=${this.rows} placeholder=${this.placeholder} maxlength=${this.maxlength} ?disabled=${this.disabled} ?required=${this.required} .value=${this.value} @input=${this.onInput}></textarea>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-textarea": DruidTextarea;
    }
}
