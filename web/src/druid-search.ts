/* <druid-search> — search input with magnifier icon for live filtering.

   name / placeholder / value   forwarded to the native input
   debounce                     ms before the "search" event fires (default 150)

   Emits a bubbling "search" CustomEvent with detail {value} while typing,
   debounced so live filtering doesn't run on every keystroke. Renders a
   native <input type="search"> into light DOM (form participation, app JS
   reachable via el.value); styles live in druids.css under druid-search.

   <druid-search placeholder="Search models"></druid-search> */

import { html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-search")
export class DruidSearch extends LitElement {
    @property() name = "";
    @property() placeholder = "Search";
    @property() value = "";
    @property({ type: Number }) debounce = 150;

    private timer: number | undefined;

    /* light DOM: keep the input reachable for forms and app scripts */
    protected createRenderRoot() {
        return this;
    }

    get input(): HTMLInputElement | null {
        return this.querySelector("input");
    }

    focus(): void {
        this.input?.focus();
    }

    private onInput(event: Event): void {
        this.value = (event.target as HTMLInputElement).value;
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
            this.dispatchEvent(new CustomEvent("search", { detail: { value: this.value }, bubbles: true }));
        }, this.debounce);
    }

    render() {
        /* single-line template: light-DOM whitespace becomes real text nodes */
        // prettier-ignore
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input type="search" name=${this.name} placeholder=${this.placeholder} .value=${this.value} @input=${this.onInput} aria-label=${this.placeholder} />`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-search": DruidSearch;
    }
}
