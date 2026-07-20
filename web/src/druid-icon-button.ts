/* <druid-icon-button> — the square .icon-btn from the classic apps.
   Set `icon` to a registered icon name for the common case, or slot your own
   svg (anything 18px-ish). Set label for the tooltip and screen readers. When
   href is set it renders a link instead. With `toggle`, a click flips
   `active` and emits "toggle-change" {active}. `circle` makes it round,
   `small` shrinks it to 28px (chat action size). `variant="soft"` /
   `"soft-danger"` gives the colored-wash-at-rest look (pair soft with a
   df-* color class to retint), matching druid-button.

   Themable from outside via custom properties (they inherit through slots):
     --df-icon-btn-color / --df-icon-btn-border / --df-icon-btn-hover-bg

   <druid-icon-button icon="log-out" label="Logout" href="/logout"></druid-icon-button>
   <druid-icon-button variant="soft" class="df-warn" icon="upload" label="Unload"></druid-icon-button>
   <druid-icon-button label="Resend" circle small><svg ...></svg></druid-icon-button> */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";
import "./druid-icon.js";

@customElement("druid-icon-button")
export class DruidIconButton extends LitElement {
    @property() variant: "default" | "soft" | "soft-danger" = "default";
    @property() label = "";
    @property() icon = "";
    @property() href = "";
    @property({ type: Boolean, reflect: true }) active = false;
    @property({ type: Boolean }) toggle = false;
    @property({ type: Boolean, reflect: true }) circle = false;
    @property({ type: Boolean, reflect: true }) small = false;

    static styles = css`
        :host {
            display: inline-flex;
        }

        button,
        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: var(--radius);
            border: 1px solid var(--df-icon-btn-border, var(--border));
            background: none;
            color: var(--df-icon-btn-color, var(--text-muted));
            cursor: pointer;
            font: inherit;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        ::slotted(svg),
        slot {
            width: 18px;
            height: 18px;
        }

        :host([circle]) button,
        :host([circle]) a {
            border-radius: 50%;
        }

        /* soft: colored icon on a translucent wash at rest, border on hover
           (mirrors druid-button's soft / soft-danger variants) */
        :host([variant="soft"]) button,
        :host([variant="soft"]) a {
            background: var(--df-accent-soft, var(--accent-soft));
            border-color: transparent;
            color: var(--df-accent, var(--accent));
        }

        :host([variant="soft"]) button:hover,
        :host([variant="soft"]) a:hover {
            background: var(--df-accent-soft, var(--accent-soft));
            border-color: var(--df-accent, var(--accent));
            color: var(--df-accent, var(--accent));
        }

        :host([variant="soft-danger"]) button,
        :host([variant="soft-danger"]) a {
            background: var(--danger-soft);
            border-color: transparent;
            color: var(--danger);
        }

        :host([variant="soft-danger"]) button:hover,
        :host([variant="soft-danger"]) a:hover {
            background: var(--danger-soft);
            border-color: var(--danger);
            color: var(--danger);
        }

        :host([small]) button,
        :host([small]) a {
            width: 28px;
            height: 28px;
        }

        :host([small]) ::slotted(svg),
        :host([small]) slot {
            width: 14px;
            height: 14px;
        }

        button:hover,
        a:hover {
            background: var(--df-icon-btn-hover-bg, var(--bg-hover));
            color: var(--df-icon-btn-hover-color, var(--text));
        }

        :host([active]) button,
        :host([active]) a {
            background: var(--accent-soft);
            border-color: var(--accent);
            color: var(--accent);
        }
    `;

    private onClick(): void {
        if (!this.toggle) return;
        this.active = !this.active;
        this.dispatchEvent(new CustomEvent("toggle-change", { detail: { active: this.active }, bubbles: true }));
    }

    render() {
        const inner = this.icon
            ? html`<druid-icon name=${this.icon} size=${this.small ? "14px" : "18px"}></druid-icon>`
            : html`<slot></slot>`;
        return this.href
            ? html`<a part="button" href=${this.href} title=${this.label} aria-label=${this.label}>${inner}</a>`
            : html`<button
                  part="button"
                  title=${this.label}
                  aria-label=${this.label}
                  aria-pressed=${this.toggle ? String(this.active) : nothing}
                  @click=${this.onClick}
              >
                  ${inner}
              </button>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-icon-button": DruidIconButton;
    }
}
