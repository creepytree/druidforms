/* <druid-subtabs> — a self-contained, boxed sub-tab layout: a bordered card
   whose header is a strip of <druid-tab> pills and whose body shows one
   [data-subtab-panel] at a time.

   Unlike <druid-tabs> (the page-level navbar strip that drives document-wide
   [data-tab-panel] sections), <druid-subtabs> is SCOPED to its own subtree, so
   it nests inside a page tab panel — the "tab content" widget.

   Two looks, like <druid-log-view>: by default the heading + tab strip float
   bare above the content, which sits in its own bordered box; `boxed` merges
   both into one card with the header divided from the body.

   <druid-subtabs active="models" heading="Ollama" boxed>
       <druid-tab slot="tab" panel="models">Models</druid-tab>
       <druid-tab slot="tab" panel="prompt">Prompt</druid-tab>
       <druid-tab slot="tab" panel="log">Log</druid-tab>

       <div data-subtab-panel="models">…</div>
       <div data-subtab-panel="prompt">…</div>
       <div data-subtab-panel="log">…</div>
   </druid-subtabs>

   Switching emits "subtab-change" (detail: {panel}) on the element and a
   bubbling "tab-change", so visibility-aware children like <druid-log-view>
   resume/pause together with the sub-tab. */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";
import "./druid-tabs.js";

@customElement("druid-subtabs")
export class DruidSubtabs extends LitElement {
    @property() active = "";
    @property() heading = "";
    @property({ type: Boolean, reflect: true }) boxed = false;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }

        header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .heading {
            font-weight: 600;
            font-size: 0.9rem;
            /* accent by default; retarget with --df-subtabs-heading-color */
            color: var(--df-subtabs-heading-color, var(--df-accent, var(--accent)));
        }

        .strip {
            display: flex;
            gap: 4px;
            flex: 1;
            flex-wrap: wrap;
        }

        /* default: bare header above, content in its own bordered box */
        .body {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--df-panel-body-bg, var(--bg-raised));
            overflow: hidden;
        }

        /* boxed: header and body merge into one card, split by a divider —
           a raised header bar over a base-shade body so the two stay distinct.
           Retarget with --df-panel-header-bg / --df-panel-body-bg. */
        :host([boxed]) {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--df-panel-header-bg, var(--bg-raised));
            overflow: hidden;
        }

        :host([boxed]) header {
            margin-bottom: 0;
            padding: 8px 10px;
            border-bottom: 1px solid var(--border);
            background: var(--df-panel-header-bg, var(--bg-raised));
        }

        :host([boxed]) .heading {
            padding-left: 4px;
        }

        :host([boxed]) .body {
            border: 0;
            border-radius: 0;
            background: var(--df-panel-body-bg, var(--bg));
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener("click", this.onTabClick);
    }

    firstUpdated(): void {
        /* default to the first sub-tab when nothing is preselected */
        if (!this.active) {
            const first = this.querySelector(":scope > druid-tab");
            if (first) this.active = (first as HTMLElement & { panel: string }).panel;
        }
        this.sync();
    }

    updated(): void {
        this.sync();
    }

    private onTabClick = (event: Event): void => {
        const tab = (event.target as HTMLElement).closest("druid-tab");
        /* ignore clicks bubbling up from a nested <druid-subtabs> */
        if (!tab || tab.parentElement !== this || !tab.panel) return;
        if (tab.panel === this.active) return;
        this.active = tab.panel;
        this.dispatchEvent(new CustomEvent("subtab-change", { detail: { panel: tab.panel } }));
        /* let visibility-aware children (e.g. <druid-log-view>) re-check */
        this.dispatchEvent(new CustomEvent("tab-change", { detail: { panel: tab.panel }, bubbles: true }));
    };

    private sync(): void {
        /* scope to direct children so nested subtabs stay independent */
        for (const tab of this.querySelectorAll<HTMLElement & { active: boolean; panel: string }>(":scope > druid-tab")) {
            tab.active = tab.panel === this.active;
        }
        for (const panel of this.querySelectorAll<HTMLElement>(":scope > [data-subtab-panel]")) {
            panel.classList.toggle("active", panel.dataset.subtabPanel === this.active);
        }
    }

    render() {
        return html`
            <header>
                ${this.heading ? html`<span class="heading">${this.heading}</span>` : null}
                <div class="strip"><slot name="tab"></slot></div>
            </header>
            <div class="body"><slot></slot></div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-subtabs": DruidSubtabs;
    }
}
