/* <druid-button> — the .small-btn of the classic apps as a component.

   Attributes:
     variant="default|primary|danger|soft|soft-danger|outline"
     type="button|submit"  (submit reaches the closest light-DOM form)
     toggle  (click flips `active` and emits "toggle-change" {active})
     loading (spinner in place of the label; the button goes inert)
     disabled, active

   Color: primary/soft/active draw from --df-accent / --df-accent-soft
   (default: the app accent). The df-ok / df-warn / df-danger utility
   classes in druids.css re-point them to another token pair:

   <druid-button variant="primary" type="submit">Save</druid-button>
   <druid-button variant="soft" class="df-ok">Approve</druid-button>
   <druid-button toggle>Follow</druid-button> */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-button")
export class DruidButton extends LitElement {
    @property() variant: "default" | "primary" | "danger" | "soft" | "soft-danger" | "outline" = "default";
    @property() type: "button" | "submit" = "button";
    @property({ type: Boolean, reflect: true }) disabled = false;
    @property({ type: Boolean, reflect: true }) active = false;
    @property({ type: Boolean }) toggle = false;
    @property({ type: Boolean, reflect: true }) loading = false;

    static styles = css`
        :host {
            display: inline-flex;
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: var(--bg-raised);
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            cursor: pointer;
            transition:
                background var(--df-dur-fast, 0.15s) var(--df-ease, ease),
                border-color var(--df-dur-fast, 0.15s) var(--df-ease, ease),
                box-shadow var(--df-dur, 0.2s) var(--df-ease, ease);
        }

        button:focus-visible {
            outline: none;
            box-shadow: var(--focus-ring);
        }

        button:hover {
            background: var(--bg-hover);
            border-color: var(--df-accent, var(--accent));
        }

        :host([active]) button {
            background: var(--df-accent-soft, var(--accent-soft));
            border-color: var(--df-accent, var(--accent));
            color: var(--df-accent, var(--accent));
        }

        /* dark text, pastel accents give no contrast for white */
        :host([variant="primary"]) button {
            background: var(--df-accent, var(--accent));
            border-color: var(--df-accent, var(--accent));
            color: var(--bg);
            font-weight: 600;
        }

        :host([variant="primary"]) button:hover {
            filter: brightness(1.12);
        }

        :host([variant="danger"]) button:hover {
            border-color: var(--danger);
            color: var(--danger);
        }

        /* soft: colored text on translucent wash, border shows on hover */
        :host([variant="soft"]) button {
            background: var(--df-accent-soft, var(--accent-soft));
            border-color: transparent;
            color: var(--df-accent, var(--accent));
        }

        :host([variant="soft"]) button:hover {
            background: var(--df-accent-soft, var(--accent-soft));
            border-color: var(--df-accent, var(--accent));
        }

        :host([variant="soft-danger"]) button {
            background: var(--danger-soft);
            border-color: transparent;
            color: var(--danger);
        }

        :host([variant="soft-danger"]) button:hover {
            background: var(--danger-soft);
            border-color: var(--danger);
        }

        /* outline: the dropdown-trigger look — base bg, accent border at rest */
        :host([variant="outline"]) button {
            background: var(--df-select-bg, var(--bg));
            border-color: var(--df-accent, var(--accent));
        }

        :host([variant="outline"]) button:hover {
            background: var(--bg-hover);
            border-color: var(--df-accent, var(--accent));
        }

        :host([disabled]) button {
            opacity: 0.45;
            cursor: default;
            pointer-events: none;
        }

        /* loading: the label stays (so the button keeps its width and the page
           does not jump) but fades out behind a centered spinner */
        :host([loading]) button {
            cursor: default;
            pointer-events: none;
            position: relative;
        }

        .label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: opacity var(--df-dur, 0.2s) var(--df-ease, ease);
        }

        :host([loading]) .label {
            opacity: 0.25;
        }

        .spinner {
            position: absolute;
            width: 13px;
            height: 13px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-right-color: currentColor;
            border-radius: 50%;
            animation: df-btn-spin 0.7s linear infinite;
        }

        @keyframes df-btn-spin {
            to {
                transform: rotate(360deg);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .spinner {
                animation-duration: 2.4s;
            }
        }
    `;

    private onClick(event: Event): void {
        if (this.loading) return;
        if (this.toggle) {
            this.active = !this.active;
            this.dispatchEvent(
                new CustomEvent("toggle-change", { detail: { active: this.active }, bubbles: true })
            );
            return;
        }
        if (this.type !== "submit") return;
        /* shadow buttons are invisible to light-DOM forms; forward the submit */
        const form = this.closest("form");
        if (form) {
            event.preventDefault();
            form.requestSubmit();
        }
    }

    render() {
        return html`
            <button
                part="button"
                ?disabled=${this.disabled}
                aria-pressed=${this.toggle ? String(this.active) : nothing}
                aria-busy=${this.loading ? "true" : nothing}
                @click=${this.onClick}
            >
                <span class="label"><slot></slot></span>
                ${this.loading ? html`<span class="spinner" aria-hidden="true"></span>` : nothing}
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-button": DruidButton;
    }
}
