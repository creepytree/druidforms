/* <druid-chat-message> — one chat bubble.

   sender   "user" (accent wash, right-aligned) | "assistant" (raised, left)
   label    name line above the content (defaults to You / Assistant)

   The default slot takes the message content — plain text or app-rendered
   HTML (markdown etc. stays app-side). Slot name "actions" adds a small
   action row under the content (resend / delete buttons and the like) —
   sized for `small circle` icon-buttons.

   `streaming` marks a reply that is still arriving: it shows <druid-dots>
   (the large classic look while the bubble is empty, a calm inline pulse once
   text has come in) and holds the actions back until the turn is done.

   <druid-chat-message sender="user">Hello there</druid-chat-message>
   <druid-chat-message sender="assistant" label="llama3">…</druid-chat-message> */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
import { customElement, property, state } from "./lit-vendor.js";
import "./druid-dots.js";

@customElement("druid-chat-message")
export class DruidChatMessage extends LitElement {
    @property({ reflect: true }) sender: "user" | "assistant" = "assistant";
    @property() label = "";
    @property({ type: Boolean, reflect: true }) streaming = false;

    @state() private hasActions = false;
    @state() private empty = true;

    private observer: MutationObserver | undefined;

    static styles = css`
        :host {
            display: flex;
            margin: 0 0 10px;
        }

        :host([sender="user"]) {
            justify-content: flex-end;
        }

        .bubble {
            max-width: 80%;
            padding: 8px 14px 10px;
            border-radius: var(--radius);
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text);
            overflow-wrap: break-word;
        }

        :host([sender="user"]) .bubble {
            background: var(--accent-soft);
            border-color: var(--accent-soft);
        }

        .label {
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 2px;
            color: var(--text-muted);
        }

        :host([sender="user"]) .label {
            color: var(--accent);
        }

        .actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }

        /* accent-outlined action buttons on the tinted user bubble */
        :host([sender="user"]) .actions {
            --df-icon-btn-color: var(--accent);
            --df-icon-btn-border: color-mix(in srgb, var(--accent) 60%, var(--bg));
            --df-icon-btn-hover-bg: var(--accent-soft);
            --df-icon-btn-hover-color: var(--accent);
        }

        .actions[hidden] {
            display: none;
        }

        .wait {
            display: block;
            margin-top: 4px;
        }

        /* the classic look draws its dots 20px above its own box */
        .wait[look="classic"] {
            margin: 22px 0 4px;
        }
    `;

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unwatch();
    }

    protected willUpdate(changed: PropertyValues): void {
        if (!changed.has("streaming")) return;
        /* only a streaming bubble needs to know when its first text lands */
        if (this.streaming) {
            this.checkEmpty();
            this.observer = new MutationObserver(() => this.checkEmpty());
            this.observer.observe(this, { childList: true, subtree: true, characterData: true });
        } else {
            this.unwatch();
        }
    }

    private unwatch(): void {
        this.observer?.disconnect();
        this.observer = undefined;
    }

    /* content = anything in the default slot with text in it (actions excluded) */
    private checkEmpty(): void {
        this.empty = ![...this.childNodes].some(
            (node) =>
                !(node instanceof Element && node.slot === "actions") &&
                (node.textContent?.trim() || (node instanceof Element && node.querySelector("img, svg, video, canvas")))
        );
    }

    private onActionsSlotChange(event: Event): void {
        this.hasActions = (event.target as HTMLSlotElement).assignedElements().length > 0;
    }

    render() {
        const label = this.label || (this.sender === "user" ? "You" : "Assistant");
        return html`<div class="bubble">
            <div class="label">${label}</div>
            <slot></slot>
            ${this.streaming
                ? html`<druid-dots
                      class="wait"
                      look=${this.empty ? "classic" : "smooth"}
                      variant=${this.empty ? "" : "pulse"}
                  ></druid-dots>`
                : nothing}
            <div class="actions" ?hidden=${!this.hasActions || this.streaming}>
                <slot name="actions" @slotchange=${this.onActionsSlotChange}></slot>
            </div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-chat-message": DruidChatMessage;
    }
}
