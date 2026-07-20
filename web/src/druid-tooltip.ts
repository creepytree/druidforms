/* <druid-tooltip> — a themed hover/focus bubble that wraps the element it
   describes. Because the wrapper owns the hover, it works over a *disabled*
   control (where the native `title` attribute is unreliable) — the original use
   case: explaining why an input is locked.

   <druid-tooltip text="Locked while a model is pinned">
       <druid-textarea disabled></druid-textarea>
   </druid-tooltip>

   The bubble renders in the top layer (native `popover`) so it escapes
   overflow/scroll clipping, and is positioned with a viewport-aware flip so it
   never falls off-screen. `placement` picks the side (top | bottom | left |
   right). The bubble carries role="tooltip"; the target stays in the default
   slot. */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import { customElement, property, query, state } from "./lit-vendor.js";

const GAP = 6;

@customElement("druid-tooltip")
export class DruidTooltip extends LitElement {
    @property() text = "";
    @property({ reflect: true }) placement: "top" | "bottom" | "left" | "right" = "top";
    /* suppress the bubble without unwrapping the target */
    @property({ type: Boolean }) disabled = false;

    @state() private open = false;
    @query(".bubble") private bubble: HTMLElement | null | undefined;

    static styles = css`
        :host {
            position: relative;
            display: inline-flex;
        }

        .bubble {
            position: fixed;
            margin: 0;
            inset: auto;
            z-index: 70;
            max-width: 240px;
            width: max-content;
            padding: 5px 9px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: var(--bg-raised);
            color: var(--text);
            box-shadow: var(--shadow);
            font-size: 0.78rem;
            line-height: 1.35;
            text-align: left;
            white-space: normal;
            opacity: 0;
            transition: opacity 0.12s ease;
        }

        .bubble.open {
            opacity: 1;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener("mouseenter", this.show);
        this.addEventListener("mouseleave", this.hide);
        this.addEventListener("focusin", this.show);
        this.addEventListener("focusout", this.hide);
        this.addEventListener("keydown", this.onKeydown);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener("mouseenter", this.show);
        this.removeEventListener("mouseleave", this.hide);
        this.removeEventListener("focusin", this.show);
        this.removeEventListener("focusout", this.hide);
        this.removeEventListener("keydown", this.onKeydown);
    }

    private show = (): void => {
        if (this.open || !this.text || this.disabled) return;
        this.open = true;
        this.updateComplete.then(() => {
            const bubble = this.bubble;
            if (!bubble) return;
            try {
                bubble.showPopover();
            } catch {
                /* already open / unsupported — .open class still shows it */
            }
            this.position();
        });
    };

    private hide = (): void => {
        if (!this.open) return;
        this.open = false;
        try {
            this.bubble?.hidePopover();
        } catch {
            /* not open / unsupported */
        }
    };

    private onKeydown = (event: KeyboardEvent): void => {
        if (this.open && event.key === "Escape") this.hide();
    };

    private position(): void {
        const bubble = this.bubble;
        if (!bubble) return;
        const t = this.getBoundingClientRect();
        const b = bubble.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = 0;
        let left = 0;
        if (this.placement === "top" || this.placement === "bottom") {
            top = this.placement === "top" ? t.top - b.height - GAP : t.bottom + GAP;
            if (this.placement === "top" && top < 0) top = t.bottom + GAP;
            else if (this.placement === "bottom" && top + b.height > vh) top = t.top - b.height - GAP;
            left = t.left + t.width / 2 - b.width / 2;
        } else {
            left = this.placement === "left" ? t.left - b.width - GAP : t.right + GAP;
            if (this.placement === "left" && left < 0) left = t.right + GAP;
            else if (this.placement === "right" && left + b.width > vw) left = t.left - b.width - GAP;
            top = t.top + t.height / 2 - b.height / 2;
        }

        left = Math.max(GAP, Math.min(left, vw - b.width - GAP));
        top = Math.max(GAP, Math.min(top, vh - b.height - GAP));
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
    }

    render() {
        return html`
            <slot></slot>
            ${this.text && !this.disabled
                ? html`<span class="bubble ${this.open ? "open" : ""}" popover="manual" role="tooltip">${this.text}</span>`
                : nothing}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-tooltip": DruidTooltip;
    }
}
