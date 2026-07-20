/* <druid-chat-message> — one chat bubble.

   sender   "user" (accent wash, right-aligned) | "assistant" (raised, left)
   label    name line above the content (defaults to You / Assistant)

   The default slot takes the message content — plain text or app-rendered
   HTML (markdown etc. stays app-side). Slot name "actions" adds a small
   action row under the content (resend / delete buttons and the like).

   <druid-chat-message sender="user">Hello there</druid-chat-message>
   <druid-chat-message sender="assistant" label="llama3">…</druid-chat-message> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property, state } from "./lit-vendor.js";

@customElement("druid-chat-message")
export class DruidChatMessage extends LitElement {
    @property({ reflect: true }) sender: "user" | "assistant" = "assistant";
    @property() label = "";

    @state() private hasActions = false;

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
    `;

    private onActionsSlotChange(event: Event): void {
        this.hasActions = (event.target as HTMLSlotElement).assignedElements().length > 0;
    }

    render() {
        const label = this.label || (this.sender === "user" ? "You" : "Assistant");
        return html`<div class="bubble">
            <div class="label">${label}</div>
            <slot></slot>
            <div class="actions" ?hidden=${!this.hasActions}>
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
