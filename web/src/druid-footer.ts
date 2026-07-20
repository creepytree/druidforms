/* <druid-footer> — version line with optional author link.

   <druid-footer brand="myapp" version="1.2.0" author="bitdruid"
                 github="https://github.com/bitdruid"></druid-footer> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-footer")
export class DruidFooter extends LitElement {
    @property() brand = "";
    @property() version = "";
    @property() author = "";
    @property() github = "";

    static styles = css`
        :host {
            display: block;
        }

        footer {
            padding: 12px 22px;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.8rem;
            border-top: 1px solid var(--border);
        }

        a {
            color: var(--accent);
            text-decoration: none;
        }
    `;

    render() {
        return html`
            <footer>
                <span>
                    ${this.brand}${this.version ? ` v${this.version}` : ""}
                    ${this.github
                        ? html`&middot; <a href=${this.github} target="_blank" rel="noopener">${this.author || this.github}</a>`
                        : this.author
                          ? html`&middot; ${this.author}`
                          : null}
                    <slot></slot>
                </span>
            </footer>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-footer": DruidFooter;
    }
}
