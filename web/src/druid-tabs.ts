/* <druid-tabs> / <druid-tab> — the navbar tab strip.
   Each tab names a panel; the strip toggles .active on matching
   [data-tab-panel] sections in the page and emits "tab-change".

   <druid-tabs active="dashboard">
       <druid-tab panel="dashboard">Dashboard</druid-tab>
       <druid-tab panel="log">Log</druid-tab>
   </druid-tabs>
   ...
   <section data-tab-panel="dashboard" class="df-tab-panel">...</section> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-tab")
export class DruidTab extends LitElement {
    @property() panel = "";
    @property({ type: Boolean, reflect: true }) active = false;

    static styles = css`
        :host {
            display: inline-flex;
        }

        button {
            background: none;
            border: none;
            color: var(--text-muted);
            font: inherit;
            padding: 7px 14px;
            border-radius: var(--radius);
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }

        button:hover {
            background: var(--bg-hover);
            color: var(--text);
        }

        :host([active]) button {
            background: var(--accent-soft);
            color: var(--accent);
        }
    `;

    render() {
        return html`<button part="tab"><slot></slot></button>`;
    }
}

@customElement("druid-tabs")
export class DruidTabs extends LitElement {
    @property() active = "";

    static styles = css`
        :host {
            display: flex;
            gap: 4px;
            flex: 1;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener("click", this.onTabClick);
    }

    firstUpdated(): void {
        /* default to the first tab when nothing is preselected */
        if (!this.active) {
            const first = this.querySelector("druid-tab");
            if (first) this.active = first.panel;
        }
        this.sync();
    }

    updated(): void {
        this.sync();
    }

    private onTabClick = (event: Event): void => {
        const tab = (event.target as HTMLElement).closest("druid-tab");
        if (!tab || !tab.panel) return;
        this.active = tab.panel;
        this.dispatchEvent(new CustomEvent("tab-change", { detail: { panel: tab.panel }, bubbles: true }));
    };

    private sync(): void {
        for (const tab of this.querySelectorAll("druid-tab")) {
            tab.active = tab.panel === this.active;
        }
        /* panels live in the page, not in the component */
        for (const panel of document.querySelectorAll<HTMLElement>("[data-tab-panel]")) {
            panel.classList.toggle("active", panel.dataset.tabPanel === this.active);
        }
    }

    render() {
        return html`<slot></slot>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-tab": DruidTab;
        "druid-tabs": DruidTabs;
    }
}
