/* <druid-flavor-picker> — droplet icon button opening the flavor popover.
   The flavor is the hue of the *neutral* surfaces (background, border, text),
   the calm counterpart to the vivid accent. Hues come from theme.ts; the
   choice is stored per app slug. Dropped into <druid-navbar> automatically,
   next to <druid-accent-picker>, but usable anywhere. */

import { css, html, LitElement, svg } from "./lit-vendor.js";
import { customElement, state } from "./lit-vendor.js";
import { hostHidden } from "./host-hidden.js";
import {
    applyFlavor,
    DEFAULT_FLAVOR,
    FLAVOR_SWATCHES,
    NEUTRAL_FLAVOR,
    RAINBOW_VALUE,
    saveFlavor,
    startFlavorRainbow,
    storedFlavor,
} from "./theme.js";

@customElement("druid-flavor-picker")
export class DruidFlavorPicker extends LitElement {
    @state() private open = false;
    @state() private current: string | null = null;

    static styles = [
        css`
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
                border-color: var(--df-accent, var(--accent));
            }

        `,
        hostHidden,
    ];

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

    private pickRainbow(): void {
        startFlavorRainbow();
        saveFlavor(RAINBOW_VALUE);
        this.current = RAINBOW_VALUE;
        this.open = false;
    }

    /* nothing saved (or a legacy "neutral") is the default flavor */
    private isActive(name: string): boolean {
        const current = !this.current || this.current === NEUTRAL_FLAVOR ? DEFAULT_FLAVOR : this.current;
        return current === name;
    }

    render() {
        const dropletIcon = svg`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>`;

        /* The swatches paint the palette hex, not the muted surface tint they
           produce: the flavor row and the accent row are the same nine colors
           in the same order, so the two pickers read as one palette. What a
           flavor actually does to a surface is far too subtle to put in a
           26px circle anyway — the page itself is the preview. */
        const swatch = (name: string, fill: string) => html`
            <button
                class="swatch ${this.isActive(name) ? "active" : ""}"
                style="background: ${fill}"
                title=${name}
                aria-label=${name}
                @click=${() => this.pick(name)}
            ></button>
        `;
        const hexes = FLAVOR_SWATCHES.map((entry) => entry.hex);

        return html`
            <button class="trigger" title="Surface flavor" aria-label="Surface flavor" @click=${() => (this.open = !this.open)}>
                ${dropletIcon}
            </button>
            ${this.open
                ? html`
                      <div class="popover">
                          ${FLAVOR_SWATCHES.map((entry) => swatch(entry.name, entry.hex))}
                          <!-- the same loop the accent picker ends on: the surfaces walk
                               slowly through the palette's hues -->
                          <button
                              class="swatch ${this.isActive(RAINBOW_VALUE) ? "active" : ""}"
                              title="rainbow"
                              aria-label="rainbow"
                              style="background: conic-gradient(${[...hexes, hexes[0]].join(", ")})"
                              @click=${() => this.pickRainbow()}
                          ></button>
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
