/* <druid-accent-picker> — palette icon button opening the accent popover.
   Swatches come from theme.ts; the chosen accent is stored per app slug.
   Dropped into <druid-navbar> automatically, but usable anywhere. */

import { css, html, LitElement, svg } from "./lit-vendor.js";
import { customElement, state } from "./lit-vendor.js";
import { ACCENT_SWATCHES, ACCENTS, applyAccent, RAINBOW_VALUE, saveAccent, startRainbow } from "./theme.js";

@customElement("druid-accent-picker")
export class DruidAccentPicker extends LitElement {
    @state() private open = false;

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
    `;

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener("click", this.onOutsideClick);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("click", this.onOutsideClick);
    }

    private onOutsideClick = (event: Event): void => {
        if (this.open && !event.composedPath().includes(this)) this.open = false;
    };

    private pick(color: string): void {
        applyAccent(color);
        saveAccent(color);
        this.open = false;
    }

    private pickRainbow(): void {
        startRainbow();
        saveAccent(RAINBOW_VALUE);
        this.open = false;
    }

    render() {
        const paletteIcon = svg`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>`;

        return html`
            <button class="trigger" title="Accent color" aria-label="Accent color" @click=${() => (this.open = !this.open)}>
                ${paletteIcon}
            </button>
            ${this.open
                ? html`
                      <div class="popover">
                          ${ACCENT_SWATCHES.map(
                              (swatch) => html`
                                  <button
                                      class="swatch"
                                      style="background: ${swatch.hex}"
                                      title=${swatch.name}
                                      @click=${() => this.pick(swatch.hex)}
                                  ></button>
                              `,
                          )}
                          <button
                              class="swatch"
                              title="rainbow"
                              style="background: conic-gradient(${[...ACCENTS, ACCENTS[0]].join(", ")})"
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
        "druid-accent-picker": DruidAccentPicker;
    }
}
