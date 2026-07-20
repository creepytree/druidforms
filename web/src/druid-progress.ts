/* <druid-progress> — thin accent progress bar.

   value / max   determinate fill (0..max, default max 100)
   indeterminate sweeping animation while total is unknown

   <druid-progress value="35"></druid-progress>
   <druid-progress indeterminate></druid-progress> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

@customElement("druid-progress")
export class DruidProgress extends LitElement {
    @property({ type: Number }) value = 0;
    @property({ type: Number }) max = 100;
    @property({ type: Boolean, reflect: true }) indeterminate = false;

    static styles = css`
        :host {
            display: block;
        }

        .track {
            height: 6px;
            border-radius: 999px;
            background: var(--border);
            overflow: hidden;
        }

        .fill {
            height: 100%;
            border-radius: 999px;
            background: var(--accent);
            transition: width 0.2s ease;
        }

        :host([indeterminate]) .fill {
            width: 35%;
            animation: sweep 1.2s ease-in-out infinite;
        }

        @keyframes sweep {
            0% {
                transform: translateX(-100%);
            }
            100% {
                transform: translateX(300%);
            }
        }
    `;

    render() {
        const percent = this.max > 0 ? Math.min(100, Math.max(0, (this.value / this.max) * 100)) : 0;
        return html`<div
            class="track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax=${this.max}
            aria-valuenow=${this.indeterminate ? "" : this.value}
        >
            <div class="fill" style=${this.indeterminate ? "" : `width: ${percent}%`}></div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-progress": DruidProgress;
    }
}
