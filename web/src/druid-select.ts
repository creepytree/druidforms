/* <druid-select> — framework-styled dropdown (native <select> popups are
   OS-rendered and can't match the design).

   Options are declared as light-DOM <option> children, same as a native
   select; they are read (and watched for changes, so JS-populated selects
   work) but never rendered directly:

   <druid-select name="model" placeholder="Select model...">
       <option value="a">Option A</option>
       <option value="b">Option B</option>
   </druid-select>

   Emits a bubbling "change" CustomEvent with detail {value}. When `name` is
   set, a hidden input in light DOM keeps classic form POSTs working.

   `filter` puts a filter box on top of the menu for long lists (prefix
   matches first, the rendered list capped); `free` additionally lets Enter
   commit typed text that matches no option.

   The menu opens in the top layer (native `popover`, placed by anchor()), so
   a scrolling ancestor — a table, a .df-dialog, a .df-card — cannot clip it,
   and it is out of layout when closed. Parts: trigger, menu, filter, item. */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
import { customElement, property, query, state } from "./lit-vendor.js";
import { anchor, type AnchorHandle } from "./anchor.js";

/* a filtered menu renders at most this many rows; typing narrows the rest */
const LIMIT = 100;

interface SelectOption {
    value: string;
    label: string;
}

@customElement("druid-select")
export class DruidSelect extends LitElement {
    @property() name = "";
    @property() value = "";
    @property() placeholder = "Select...";
    @property() label = "";
    @property({ type: Boolean }) filter = false;
    @property({ type: Boolean }) free = false;

    @state() private open = false;
    @state() private options: SelectOption[] = [];
    @state() private query = "";
    @state() private active = -1;

    @query(".trigger") private trigger!: HTMLElement;
    @query(".menu") private menu!: HTMLElement;

    private observer: MutationObserver | undefined;
    private hiddenInput: HTMLInputElement | undefined;
    private pin: AnchorHandle | undefined;

    static styles = css`
        /* the page's box-sizing reset does not pierce the shadow root; without
           this the menu's min-width:100% ends up wider than the trigger */
        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        :host {
            display: inline-flex;
            position: relative;
            /* a narrow host (a side panel, a toolbar) shrinks the select and
               ellipsizes its label instead of wrapping onto a second row */
            min-width: 0;
            max-width: 100%;
        }

        .trigger {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
            /* a floor when there is room, never a reason to overflow */
            min-width: min(130px, 100%);
            padding: 6px 10px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            /* match the light-DOM form controls (--bg), not the raised card */
            background: var(--df-select-bg, var(--bg));
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            cursor: pointer;
            transition:
                border-color var(--df-dur-fast, 0.15s) var(--df-ease, ease),
                box-shadow var(--df-dur, 0.2s) var(--df-ease, ease);
        }

        .trigger:hover,
        .trigger:focus-visible,
        .trigger.open {
            outline: none;
            border-color: var(--df-accent, var(--accent));
        }

        .trigger:focus-visible {
            box-shadow: var(--focus-ring);
        }

        .text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .trigger .placeholder {
            color: var(--text-muted);
        }

        .chev {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            color: var(--text-muted);
            transition: transform 0.15s;
        }

        .trigger.open .chev {
            transform: rotate(180deg);
        }

        /* the menu renders in the top layer (native popover) and is positioned
           against the viewport, so an overflow:auto ancestor — a scrolling
           table, a .df-dialog — can neither clip it nor inherit its height.
           display:none when closed keeps it out of layout entirely: an
           absolutely-laid-out closed menu used to inflate the scrollHeight of
           whatever contained it and paint a phantom scrollbar. anchor() caps
           its width at the viewport; long labels ellipsize. */
        .menu {
            position: fixed;
            margin: 0;
            inset: auto;
            z-index: 60;
            display: none;
            flex-direction: column;
            gap: 2px;
            padding: 4px;
            max-height: min(260px, 60vh);
            overflow: hidden;
            background: var(--df-select-bg, var(--bg));
            border: 1px solid var(--df-accent, var(--accent));
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }

        .menu.open {
            display: flex;
            opacity: 1;
            transform: none;
            transition: opacity 0.12s ease, transform 0.12s ease;
        }

        @starting-style {
            .menu.open {
                opacity: 0;
                transform: translateY(-4px);
            }
        }

        /* the filter box stays put; only the option list scrolls */
        .list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-height: 0;
            overflow-y: auto;
        }

        .filter {
            flex-shrink: 0;
            margin: 0 0 4px;
            padding: 5px 8px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm, 6px);
            background: var(--bg-dim);
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            outline: none;
        }

        .filter:focus {
            border-color: var(--df-accent, var(--accent));
        }

        .item {
            flex-shrink: 0;
            padding: 6px 10px;
            border: none;
            border-radius: calc(var(--radius) - 4px);
            background: none;
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            text-align: left;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .item:hover,
        .item.active {
            background: var(--bg-hover);
        }

        .item.selected {
            background: var(--df-accent-soft, var(--accent-soft));
            color: var(--df-accent, var(--accent));
        }

        .note {
            padding: 6px 10px;
            color: var(--text-muted);
            font-size: 0.8rem;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.readOptions();
        /* apps fill selects from JS (fetch results etc.) — stay in sync */
        this.observer = new MutationObserver(() => this.readOptions());
        this.observer.observe(this, { childList: true, subtree: true, characterData: true });
        document.addEventListener("click", this.onOutsideClick);
        document.addEventListener("keydown", this.onKeydown);
        this.addEventListener("keydown", this.onOwnKeydown);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.observer?.disconnect();
        document.removeEventListener("click", this.onOutsideClick);
        document.removeEventListener("keydown", this.onKeydown);
        this.removeEventListener("keydown", this.onOwnKeydown);
        this.pin?.release();
        this.pin = undefined;
    }

    private readOptions(): void {
        this.options = [...this.querySelectorAll("option")].map((opt) => ({
            value: opt.getAttribute("value") ?? opt.textContent?.trim() ?? "",
            label: opt.textContent?.trim() ?? "",
        }));
    }

    /* the rows the menu shows: everything, or — with `filter` and a query —
       the matches, prefix matches first, capped at LIMIT */
    private visible(): { rows: SelectOption[]; more: number } {
        if (!this.filter) return { rows: this.options, more: 0 };
        const q = this.query.trim().toLowerCase();
        let rows = this.options;
        if (q) {
            const hits = rows.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
            const prefix = (o: SelectOption): boolean =>
                o.label.toLowerCase().startsWith(q) || o.value.toLowerCase().startsWith(q);
            rows = [...hits.filter(prefix), ...hits.filter((o) => !prefix(o))];
        }
        return { rows: rows.slice(0, LIMIT), more: Math.max(0, rows.length - LIMIT) };
    }

    private onOutsideClick = (event: MouseEvent): void => {
        if (this.open && !event.composedPath().includes(this)) this.open = false;
    };

    private onKeydown = (event: KeyboardEvent): void => {
        if (this.open && event.key === "Escape") this.open = false;
    };

    /* arrows move the highlight, Enter picks it (or, with `free`, the typed
       text); ArrowDown on the closed trigger opens the menu */
    private onOwnKeydown = (event: KeyboardEvent): void => {
        if (!this.open) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.open = true;
            }
            return;
        }
        const { rows } = this.visible();
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!rows.length) return;
            const step = event.key === "ArrowDown" ? 1 : -1;
            this.active = (this.active + step + rows.length) % rows.length;
        } else if (event.key === "Enter") {
            const row = rows[this.active];
            const typed = this.query.trim();
            if (row) {
                event.preventDefault();
                this.select(row);
            } else if (this.free && typed) {
                event.preventDefault();
                this.select({ value: typed, label: typed });
            }
        } else if (event.key === "Tab") {
            this.open = false;
        }
    };

    private onFilterInput(event: Event): void {
        this.query = (event.target as HTMLInputElement).value;
        const typed = this.query.trim().toLowerCase();
        const { rows } = this.visible();
        /* highlight the best match — except that with `free` only an exact
           match is taken for granted, so Enter keeps the text as typed */
        this.active = !typed
            ? -1
            : this.free
              ? rows.findIndex((o) => o.label.toLowerCase() === typed || o.value.toLowerCase() === typed)
              : 0;
    }

    private select(option: SelectOption): void {
        this.value = option.value;
        this.open = false;
        this.syncHiddenInput();
        this.trigger.focus();
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value }, bubbles: true }));
    }

    /* classic form POSTs need a real input in light DOM */
    private syncHiddenInput(): void {
        if (!this.name) return;
        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name = this.name;
            this.appendChild(this.hiddenInput);
        }
        this.hiddenInput.value = this.value;
    }

    protected willUpdate(changed: PropertyValues): void {
        /* every opening starts unfiltered, highlighting the current value */
        if (changed.has("open") && this.open) {
            this.query = "";
            this.active = this.visible().rows.findIndex((o) => o.value === this.value);
        }
    }

    protected updated(changed: PropertyValues): void {
        this.syncHiddenInput();
        if (changed.has("open")) {
            this.open ? this.showMenu() : this.hideMenu();
        } else if (this.open) {
            /* options or the filter changed under an open menu — it just resized */
            this.pin?.update();
        }
        if (this.open && changed.has("active")) {
            this.renderRoot.querySelector(".item.active")?.scrollIntoView({ block: "nearest" });
        }
    }

    private showMenu(): void {
        /* manual popover → we own dismissal; anchor() lifts it into the top
           layer and makes it follow the trigger instead of dismissing when an
           ancestor scrolls */
        this.pin = anchor(this.menu, this.trigger, { matchWidth: true });
        if (this.filter) this.renderRoot.querySelector<HTMLInputElement>(".filter")?.focus();
    }

    private hideMenu(): void {
        this.pin?.release();
        this.pin = undefined;
    }

    render() {
        const current = this.options.find((opt) => opt.value === this.value);
        const shown = current?.label ?? (this.free ? this.value : "");
        const { rows, more } = this.visible();
        const typed = this.query.trim();
        return html`
            <button
                type="button"
                part="trigger"
                class="trigger ${this.open ? "open" : ""}"
                aria-haspopup="listbox"
                aria-expanded=${this.open}
                aria-label=${this.label || this.placeholder}
                @click=${() => (this.open = !this.open)}
            >
                ${shown
                    ? html`<span class="text" title=${shown}>${shown}</span>`
                    : html`<span class="text placeholder">${this.placeholder}</span>`}
                <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div part="menu" class="menu ${this.open ? "open" : ""}" popover="manual">
                ${this.filter
                    ? html`<input
                          part="filter"
                          class="filter"
                          type="text"
                          autocomplete="off"
                          spellcheck="false"
                          placeholder=${this.free ? "Filter or type a value…" : "Filter…"}
                          aria-label="Filter options"
                          .value=${this.query}
                          @input=${this.onFilterInput}
                      />`
                    : nothing}
                <div class="list" role="listbox">
                    ${rows.map(
                        (opt, i) => html`<button
                            type="button"
                            part="item"
                            class="item ${opt.value === this.value ? "selected" : ""} ${i === this.active ? "active" : ""}"
                            role="option"
                            aria-selected=${opt.value === this.value}
                            title=${opt.label}
                            @click=${() => this.select(opt)}
                        >
                            ${opt.label}
                        </button>`
                    )}
                    ${more ? html`<div class="note">${more} more — keep typing to narrow</div>` : nothing}
                    ${this.filter && typed && (this.free ? this.active < 0 : !rows.length)
                        ? html`<div class="note">${this.free ? `Enter uses “${typed}”` : "No match"}</div>`
                        : nothing}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-select": DruidSelect;
    }
}
