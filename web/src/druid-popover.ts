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
import { anchor, type AnchorHandle } from "./anchor.js";

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

    private pin: AnchorHandle | undefined;

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
        this.pin?.release();
    }

    show(): void {
        if (this.open) return;
        this.open = true;
        this.updateComplete.then(() => {
            /* manual popover → we own dismissal; it only buys us the top layer.
               The panel follows the trigger on scroll rather than dismissing —
               scroll is explicitly not a dismiss trigger. */
            this.pin = anchor(this.panel, this.anchor, { placement: this.placement });
            this.dispatchEvent(new CustomEvent("popover-toggle", { detail: { open: true }, bubbles: true }));
        });
    }

    hide(): void {
        if (!this.open) return;
        this.open = false;
        this.pin?.release();
        this.pin = undefined;
        this.dispatchEvent(new CustomEvent("popover-toggle", { detail: { open: false }, bubbles: true }));
    }

    toggle(): void {
        this.open ? this.hide() : this.show();
    }

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
