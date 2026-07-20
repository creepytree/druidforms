/* <druid-popover> — an anchored panel primitive: the trigger + light-dismiss +
   positioning that lived only inside <druid-select>, generalized to hold
   arbitrary content. Use it for menus, filter panels, "count" popups — anything
   that hangs off a control and must sit *above* scrolling/overflow-clipped
   ancestors.

   <druid-popover placement="bottom-end">
       <druid-button slot="trigger" variant="outline">Quants ▾</druid-button>
       <div>…any content…</div>
   </druid-popover>

   The panel renders in the top layer (native `popover`), so a scrollable table
   can't clip it. Light-dismiss (outside-click / Esc, NOT scroll), same-trigger
   toggle, and flip-when-short-on-space are built in. Emits a bubbling
   "popover-toggle" {open}. Placement is `<main>-<align>`:
   main = top | bottom | left | right, align = start | end (default bottom-start).

   Imperative control: .show() / .hide() / .toggle(). */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property, query, state } from "./lit-vendor.js";

const GAP = 6;

@customElement("druid-popover")
export class DruidPopover extends LitElement {
    @property() placement:
        | "bottom-start"
        | "bottom-end"
        | "top-start"
        | "top-end"
        | "left-start"
        | "right-start" = "bottom-start";

    @state() private open = false;

    @query(".anchor") private anchor!: HTMLElement;
    @query(".panel") private panel!: HTMLElement;

    static styles = css`
        :host {
            display: inline-flex;
            position: relative;
        }

        .anchor {
            display: inline-flex;
        }

        .panel {
            position: fixed;
            margin: 0;
            inset: auto;
            z-index: 60;
            min-width: 160px;
            max-height: min(70vh, 420px);
            overflow: auto;
            padding: 6px;
            background: var(--bg-raised);
            border: 1px solid var(--df-accent, var(--accent));
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            color: var(--text);
            opacity: 0;
            transform: translateY(-4px);
            transition: opacity 0.12s ease, transform 0.12s ease;
        }

        .panel:popover-open {
            opacity: 1;
            transform: none;
        }

        /* fallback for engines without :popover-open */
        .panel.open {
            opacity: 1;
            transform: none;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener("click", this.onOutsideClick);
        document.addEventListener("keydown", this.onKeydown);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("click", this.onOutsideClick);
        document.removeEventListener("keydown", this.onKeydown);
        window.removeEventListener("scroll", this.onReposition, true);
        window.removeEventListener("resize", this.onReposition);
    }

    show(): void {
        if (this.open) return;
        this.open = true;
        this.updateComplete.then(() => {
            /* manual popover → we own dismissal; it only buys us the top layer */
            try {
                this.panel.showPopover();
            } catch {
                /* already open or unsupported — CSS .open class covers the look */
            }
            this.position();
            /* the panel lives in the top layer (fixed to the viewport); without this
               it stays put while the trigger scrolls away. Follow the trigger instead
               of dismissing — scroll is explicitly not a dismiss trigger. capture:true
               catches scrolls in any ancestor scroll container, not just the window. */
            window.addEventListener("scroll", this.onReposition, true);
            window.addEventListener("resize", this.onReposition);
            this.dispatchEvent(new CustomEvent("popover-toggle", { detail: { open: true }, bubbles: true }));
        });
    }

    hide(): void {
        if (!this.open) return;
        this.open = false;
        window.removeEventListener("scroll", this.onReposition, true);
        window.removeEventListener("resize", this.onReposition);
        try {
            this.panel.hidePopover();
        } catch {
            /* not open / unsupported */
        }
        this.dispatchEvent(new CustomEvent("popover-toggle", { detail: { open: false }, bubbles: true }));
    }

    toggle(): void {
        this.open ? this.hide() : this.show();
    }

    private position(): void {
        const t = this.anchor.getBoundingClientRect();
        const p = this.panel.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const [main, align = "start"] = this.placement.split("-");

        let top = 0;
        let left = 0;

        if (main === "bottom" || main === "top") {
            top = main === "bottom" ? t.bottom + GAP : t.top - p.height - GAP;
            /* flip vertically when it would spill off-screen */
            if (main === "bottom" && top + p.height > vh && t.top - p.height - GAP > 0) {
                top = t.top - p.height - GAP;
            } else if (main === "top" && top < 0 && t.bottom + p.height + GAP < vh) {
                top = t.bottom + GAP;
            }
            left = align === "end" ? t.right - p.width : t.left;
        } else {
            /* left / right */
            left = main === "right" ? t.right + GAP : t.left - p.width - GAP;
            if (main === "right" && left + p.width > vw && t.left - p.width - GAP > 0) {
                left = t.left - p.width - GAP;
            } else if (main === "left" && left < 0 && t.right + p.width + GAP < vw) {
                left = t.right + GAP;
            }
            top = t.top;
        }

        /* keep inside the viewport on the cross axis */
        left = Math.max(GAP, Math.min(left, vw - p.width - GAP));
        top = Math.max(GAP, Math.min(top, vh - p.height - GAP));

        this.panel.style.left = `${left}px`;
        this.panel.style.top = `${top}px`;
    }

    private onReposition = (): void => {
        if (this.open) this.position();
    };

    private onOutsideClick = (event: MouseEvent): void => {
        if (this.open && !event.composedPath().includes(this)) this.hide();
    };

    private onKeydown = (event: KeyboardEvent): void => {
        if (this.open && event.key === "Escape") this.hide();
    };

    render() {
        return html`
            <span class="anchor" @click=${() => this.toggle()}>
                <slot name="trigger"></slot>
            </span>
            <div class="panel ${this.open ? "open" : ""}" popover="manual" role="dialog">
                <slot></slot>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-popover": DruidPopover;
    }
}
