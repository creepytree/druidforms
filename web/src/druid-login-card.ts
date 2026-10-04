/* <druid-login-card> — the sign-in card. Renders into light DOM (no shadow
   root) so browser password managers and autofill keep working; its styles
   live in druids.css under .df-login-card. The form does a classic POST to
   `action`, which the druids auth routes handle server-side.

   <druid-login-card brand="Myapp" action="/login" error="{{ error }}"></druid-login-card> */

import { html, LitElement, render, svg } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";
import { LEAF_PATH } from "./leaf.js";

@customElement("druid-login-card")
export class DruidLoginCard extends LitElement {
    @property() brand = "";
    @property() action = "/login";
    @property() error = "";
    @property() subtitle = "Sign in to continue";

    /* light DOM: password managers ignore fields hidden in shadow roots */
    protected createRenderRoot() {
        return this;
    }

    render() {
        const leaf = svg`<svg class="brand-leaf" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false"><path d=${LEAF_PATH} /></svg>`;

        return html`
            <form class="df-login-card" method="post" action=${this.action}>
                <div class="df-login-brand">
                    ${leaf}
                    <h1>${this.brand}</h1>
                </div>
                <p class="df-login-subtitle">${this.subtitle}</p>
                ${this.error ? html`<p class="df-form-error">${this.error}</p>` : null}
                <label>
                    Username
                    <input type="text" name="username" required autofocus autocomplete="username" />
                </label>
                <label>
                    Password
                    <input type="password" name="password" required autocomplete="current-password" />
                </label>
                <button type="submit" class="df-login-submit">Sign in</button>
            </form>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-login-card": DruidLoginCard;
    }
}
