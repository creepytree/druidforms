/* <druid-flavor-picker> — droplet icon button opening the flavor popover.
   The flavor is the hue of the *neutral* surfaces (background, border, text),
   the calm counterpart to the vivid accent. Hues come from theme.ts; the
   choice is stored per app slug. Dropped into <druid-navbar> automatically,
   next to <druid-accent-picker>, but usable anywhere. */

import { css, html, LitElement, svg } from "./lit-vendor.js";
import { customElement, state } from "./lit-vendor.js";
import { applyFlavor, FLAVOR_SWATCHES, NEUTRAL_FLAVOR, saveFlavor, storedFlavor } from "./theme.js";

@customElement("druid-flavor-picker")
export class DruidFlavorPicker extends LitElement {
    @state() private open = false;
    @state() private current: string | null = null;

    static styles = css`
        :host {
            display: inline-flex;
            position: relative;
        }

        button.trigger {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: none;
            color: var(--text-muted);
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }

        button.trigger:hover {
            background: var(--bg-hover);
            color: var(--text);
        }

        button.trigger svg {
            width: 19px;
            height: 19px;
        }

        @keyframes pop-in {
            from {
                opacity: 0;
                transform: translateY(-6px) scale(0.95);
            }

            to {
                opacity: 1;
                transform: none;
            }
        }

        .popover {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            z-index: 60;
            display: grid;
            grid-template-columns: repeat(5, auto);
            gap: 10px;
            padding: 12px;
            background: var(--bg-raised);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            animation: pop-in 0.16s ease-out;
        }

        .swatch {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2px solid transparent;
            cursor: pointer;
            padding: 0;
            transition: transform 0.12s, border-color 0.15s;
        }

        .swatch:hover {
            transform: scale(1.15);
            border-color: var(--text);
        }

        /* the tint is subtle on the surfaces, so the popover marks the pick */
        .swatch.active {
            border-color: var(--accent);
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.current = storedFlavor();
        document.addEventListener("click", this.onOutsideClick);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("click", this.onOutsideClick);
    }

    private onOutsideClick = (event: Event): void => {
        if (this.open && !event.composedPath().includes(this)) this.open = false;
    };

    private pick(name: string): void {
        applyFlavor(name);
        saveFlavor(name);
        this.current = name;
        this.open = false;
    }

    render() {
        const dropletIcon = svg`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>`;

        /* swatches preview the hue muted, the way a flavor reads on a surface */
        const swatch = (name: string, fill: string) => html`
            <button
                class="swatch ${this.current === name ? "active" : ""}"
                style="background: ${fill}"
                title=${name}
                aria-label=${name}
                @click=${() => this.pick(name)}
            ></button>
        `;

        return html`
            <button class="trigger" title="Surface flavor" aria-label="Surface flavor" @click=${() => (this.open = !this.open)}>
                ${dropletIcon}
            </button>
            ${this.open
                ? html`
                      <div class="popover">
                          ${swatch(NEUTRAL_FLAVOR, "oklch(0.5 0 0)")}
                          ${FLAVOR_SWATCHES.map((entry) => swatch(entry.name, `oklch(0.5 0.1 ${entry.hue})`))}
                      </div>
                  `
                : null}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-flavor-picker": DruidFlavorPicker;
    }
}
