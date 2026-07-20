/* <druid-navbar> — the app header: leaf + brand, tabs region, actions region.
   The accent picker is built in; a logout button appears when logout-href is set.

   <druid-navbar brand="Myapp" logout-href="/logout">
       <druid-tabs>...</druid-tabs>                    (default slot)
       <druid-icon-button slot="actions" ...>...</druid-icon-button>
   </druid-navbar> */

import { css, html, LitElement, svg } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";
import { leafSvg } from "./leaf.js";
import "./druid-accent-picker.js";
import "./druid-icon-button.js";

@customElement("druid-navbar")
export class DruidNavbar extends LitElement {
    @property() brand = "";
    @property({ attribute: "logout-href" }) logoutHref = "";

    static styles = css`
        :host {
            display: block;
        }

        header {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 12px 22px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-raised);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .brand h1 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 650;
            letter-spacing: 0.02em;
        }

        /* brand leaf: accent fill, glow follows the shape */
        .brand-leaf {
            width: 28px;
            height: 28px;
            color: var(--accent);
            filter: drop-shadow(0 0 6px var(--accent));
            flex-shrink: 0;
        }

        .tabs-region {
            display: flex;
            gap: 4px;
            flex: 1;
        }

        .actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `;

    render() {
        const logoutIcon = svg`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
            </svg>`;

        return html`
            <header>
                <div class="brand">
                    ${leafSvg()}
                    <h1>${this.brand}</h1>
                </div>
                <nav class="tabs-region">
                    <slot></slot>
                </nav>
                <div class="actions">
                    <slot name="actions"></slot>
                    <druid-accent-picker></druid-accent-picker>
                    ${this.logoutHref
                        ? html`<druid-icon-button label="Logout" href=${this.logoutHref}>${logoutIcon}</druid-icon-button>`
                        : null}
                </div>
            </header>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-navbar": DruidNavbar;
    }
}
