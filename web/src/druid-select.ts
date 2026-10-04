/* <druid-select> — framework-styled dropdown (native <select> popups are
   OS-rendered and can't match the design).

   Options are declared as light-DOM <option> children, same as a native
   select; they are read (and watched for changes, so JS-populated selects
   work) but never rendered directly:

   <druid-select name="model" placeholder="Select model...">
       <option value="a">Option A</option>
       <option value="b">Option B</option>
   </druid-select>

   Emits a bubbling "change" CustomEvent with detail {value, values}. When
   `name` is set, hidden inputs in light DOM keep classic form POSTs working.

   `filter` puts a filter box on top of the menu for long lists (prefix
   matches first, the rendered list capped); `free` additionally lets Enter
   commit typed text that matches no option. `multiple` collects several
   values as removable pills in pick order — a list, not a set: a pill can be
   dragged, or moved with Alt+arrows while it has focus (`min` holds a floor of
   them). `compact` is the tight trigger for a crowded bar.

   The menu opens in the top layer (native `popover`, placed by anchor()), so
   a scrolling ancestor — a table, a .df-dialog, a .df-card — cannot clip it,
   and it is out of layout when closed.
   Parts: trigger, menu, filter, item, pill, pill-remove. */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
import { customElement, property, query, state } from "./lit-vendor.js";
import { hostHidden } from "./host-hidden.js";
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
    @property({ type: Boolean }) multiple = false;
    @property({ type: Number }) min = 0;
    @property({ type: Boolean, reflect: true }) compact = false;

    @state() private open = false;
    @state() private options: SelectOption[] = [];
    @state() private query = "";
    @state() private active = -1;

    @query(".trigger") private trigger!: HTMLElement;
    @query(".menu") private menu!: HTMLElement;

    private observer: MutationObserver | undefined;
    private hiddenInputs: HTMLInputElement[] = [];
    private pin: AnchorHandle | undefined;
    /* the pill being dragged, and the pill to re-focus after a keyboard move
       (the pills are re-rendered, so the focused node is gone by then) */
    private dragFrom: number | undefined;
    private dragMoved = false;
    private refocus: number | undefined;

    /* `multiple` keeps its selection in `value` as a comma-separated list, so
       the attribute stays the single source of truth (and value="a,b" works as
       initial state); `values` is the array view of it */
    get values(): string[] {
        if (!this.multiple) return this.value ? [this.value] : [];
        return this.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
    }

    set values(list: string[]) {
        this.value = list.join(",");
    }

    static styles = [
        css`
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

            /* the trigger's density: df-shell-compact sets these for a panel-width
               host, [compact] for one crowded control on any page */
            :host([compact]) {
                --df-select-pad: 3px 6px;
                --df-select-chev: 11px;
            }

            .trigger {
                display: inline-flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                width: 100%;
                /* a floor when there is room, never a reason to overflow */
                min-width: min(130px, 100%);
                padding: var(--df-select-pad, 6px 10px);
                border-radius: var(--radius);
                border: 1px solid var(--border);
                /* match the light-DOM form controls (--bg), not the raised card */
                background: var(--df-select-bg, var(--bg));
                color: var(--text);
                font: inherit;
                font-size: 0.85rem;
                text-align: left;
                cursor: pointer;
                transition:
                    border-color var(--df-dur-fast, 0.15s) var(--df-ease, ease),
                    box-shadow var(--df-dur, 0.2s) var(--df-ease, ease);
            }

            :host([compact]) .trigger {
                gap: 4px;
                min-width: min(64px, 100%);
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
                width: var(--df-select-chev, 14px);
                height: var(--df-select-chev, 14px);
                flex-shrink: 0;
                color: var(--text-muted);
                transition: transform 0.15s;
            }

            .trigger.open .chev {
                transform: rotate(180deg);
            }

            /* multiple: the picks live in the trigger as removable pills, which
               wrap — the control grows downward instead of clipping the list */
            .pills {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                min-width: 0;
            }

            .pill {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                max-width: 100%;
                padding: 1px 4px 1px 7px;
                border-radius: 999px;
                background: var(--df-accent-soft, var(--accent-soft));
                color: var(--df-accent, var(--accent));
                font-size: 0.78rem;
                line-height: 1.5;
            }

            .pill:focus-visible {
                outline: none;
                box-shadow: var(--focus-ring);
            }

            .pill[draggable="true"] {
                cursor: grab;
            }

            .pill.dragging {
                opacity: 0.5;
            }

            .pill > span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .pill-remove {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: 14px;
                height: 14px;
                padding: 0;
                border: none;
                border-radius: 999px;
                background: none;
                color: inherit;
                font: inherit;
                cursor: pointer;
                opacity: 0.7;
            }

            .pill-remove:hover {
                opacity: 1;
                background: var(--bg-hover);
            }

            .pill-remove[disabled] {
                display: none;
            }

            .pill-remove svg {
                width: 10px;
                height: 10px;
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
        `,
        hostHidden,
    ];

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

    private labelFor(value: string): string {
        return this.options.find((opt) => opt.value === value)?.label ?? value;
    }

    /* the rows the menu shows: everything, or — with `filter` and a query —
       the matches, prefix matches first, capped at LIMIT. `multiple` drops
       what is already picked; the pills are that part of the list. */
    private visible(): { rows: SelectOption[]; more: number } {
        let rows = this.options;
        if (this.multiple) {
            const picked = new Set(this.values);
            rows = rows.filter((o) => !picked.has(o.value));
        }
        if (!this.filter) return { rows, more: 0 };
        const q = this.query.trim().toLowerCase();
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
            if (event.key === "ArrowDown" || (this.multiple && (event.key === "Enter" || event.key === " "))) {
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
        if (this.multiple) {
            const picked = this.values;
            /* a comma would split one pick into two on the way back out */
            const value = option.value.replace(/,/g, " ");
            if (!picked.includes(value)) this.values = [...picked, value];
            /* the menu stays open for the next pick; typing starts over */
            this.query = "";
            this.active = -1;
        } else {
            this.value = option.value;
            this.open = false;
        }
        this.syncHiddenInputs();
        this.commit();
    }

    /* remove one pick (`multiple`); `min` is a floor that cannot be crossed */
    private unpick(value: string): void {
        const picked = this.values;
        if (picked.length <= this.min) return;
        this.values = picked.filter((v) => v !== value);
        this.syncHiddenInputs();
        this.commit();
    }

    /* move a pick within the list — `multiple` keeps its order, so a consumer
       using it as an ordered list does not have to re-pick to reorder */
    private move(from: number, to: number): boolean {
        const picked = this.values;
        if (from === to || to < 0 || to >= picked.length) return false;
        const [value] = picked.splice(from, 1);
        picked.splice(to, 0, value!);
        this.values = picked;
        return true;
    }

    /* a focused pill: Alt+arrows move it, Delete/Backspace removes it */
    private onPillKeydown(event: KeyboardEvent, index: number): void {
        const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
        const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        if (event.altKey && (back || forward)) {
            event.preventDefault();
            event.stopPropagation();
            const to = index + (back ? -1 : 1);
            if (this.move(index, to)) {
                this.refocus = to;
                this.syncHiddenInputs();
                this.commit();
            }
        } else if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            event.stopPropagation();
            const picked = this.values;
            if (picked.length <= this.min) return;
            this.refocus = Math.min(index, picked.length - 2);
            this.unpick(picked[index]!);
        }
    }

    private commit(): void {
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: this.value, values: this.values },
                bubbles: true,
            })
        );
    }

    /* classic form POSTs need real inputs in light DOM — one per value, all
       under `name`, which is how a multi-valued field is posted */
    private syncHiddenInputs(): void {
        if (!this.name) return;
        const wanted = this.multiple ? this.values : [this.value];
        while (this.hiddenInputs.length > wanted.length) this.hiddenInputs.pop()?.remove();
        while (this.hiddenInputs.length < wanted.length) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = this.name;
            this.appendChild(input);
            this.hiddenInputs.push(input);
        }
        wanted.forEach((value, i) => (this.hiddenInputs[i]!.value = value));
    }

    protected willUpdate(changed: PropertyValues): void {
        /* every opening starts unfiltered, highlighting the current value */
        if (changed.has("open") && this.open) {
            this.query = "";
            this.active = this.multiple ? -1 : this.visible().rows.findIndex((o) => o.value === this.value);
        }
    }

    protected updated(changed: PropertyValues): void {
        this.syncHiddenInputs();
        if (changed.has("open")) {
            this.open ? this.showMenu() : this.hideMenu();
        } else if (this.open) {
            /* options or the filter changed under an open menu — it just resized */
            this.pin?.update();
        }
        if (this.open && changed.has("active")) {
            this.renderRoot.querySelector(".item.active")?.scrollIntoView({ block: "nearest" });
        }
        /* a moved or removed pill is a new node — put focus back on it, so a
           keyboard reorder is one Alt+arrow after another */
        if (this.refocus !== undefined) {
            const pills = this.renderRoot.querySelectorAll<HTMLElement>(".pill");
            pills[Math.max(0, Math.min(this.refocus, pills.length - 1))]?.focus();
            this.refocus = undefined;
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

    private chevron() {
        return html`<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>`;
    }

    /* the picked values, as pills, in pick order — a nested <button> is invalid
       inside the single-value trigger, so `multiple` renders a focusable div
       instead. A pill is draggable and takes focus, so the order can be
       changed without re-picking. */
    private pills() {
        const picked = this.values;
        if (!picked.length) return html`<span class="text placeholder">${this.placeholder}</span>`;
        const locked = picked.length <= this.min;
        const movable = picked.length > 1;
        return html`<span class="pills"
            >${picked.map(
                (value, i) => html`<span
                    part="pill"
                    class="pill ${this.dragFrom === i ? "dragging" : ""}"
                    tabindex="0"
                    draggable=${movable ? "true" : "false"}
                    aria-label=${movable
                        ? `${this.labelFor(value)}, ${i + 1} of ${picked.length}. Alt+arrow keys reorder.`
                        : this.labelFor(value)}
                    @keydown=${(event: KeyboardEvent) => this.onPillKeydown(event, i)}
                    @click=${(event: Event) => event.stopPropagation()}
                    @dragstart=${(event: DragEvent) => {
                        this.dragFrom = i;
                        this.dragMoved = false;
                        event.dataTransfer?.setData("text/plain", value);
                        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
                        this.requestUpdate();
                    }}
                    @dragover=${(event: DragEvent) => {
                        if (this.dragFrom === undefined) return;
                        event.preventDefault();
                        /* the list reorders under the pointer, so the drop is
                           just the end of it */
                        if (this.move(this.dragFrom, i)) {
                            this.dragFrom = i;
                            this.dragMoved = true;
                        }
                    }}
                    @dragend=${() => {
                        this.dragFrom = undefined;
                        if (this.dragMoved) {
                            this.dragMoved = false;
                            this.syncHiddenInputs();
                            this.commit();
                        }
                        this.requestUpdate();
                    }}
                    ><span title=${this.labelFor(value)}>${this.labelFor(value)}</span
                    ><button
                        type="button"
                        part="pill-remove"
                        class="pill-remove"
                        aria-label="Remove ${this.labelFor(value)}"
                        ?disabled=${locked}
                        @click=${(event: Event) => {
                            event.stopPropagation();
                            this.unpick(value);
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button></span
                >`
            )}</span
        >`;
    }

    render() {
        const current = this.options.find((opt) => opt.value === this.value);
        const shown = current?.label ?? (this.free ? this.value : "");
        const { rows, more } = this.visible();
        const typed = this.query.trim();
        const picked = new Set(this.values);
        return html`
            ${this.multiple
                ? html`<div
                      part="trigger"
                      class="trigger ${this.open ? "open" : ""}"
                      role="combobox"
                      tabindex="0"
                      aria-haspopup="listbox"
                      aria-expanded=${this.open}
                      aria-label=${this.label || this.placeholder}
                      @click=${() => (this.open = !this.open)}
                  >
                      ${this.pills()}${this.chevron()}
                  </div>`
                : html`<button
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
                          : html`<span class="text placeholder">${this.placeholder}</span>`}${this.chevron()}
                  </button>`}
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
                <div class="list" role="listbox" aria-multiselectable=${this.multiple ? "true" : "false"}>
                    ${rows.map(
                        (opt, i) => html`<button
                            type="button"
                            part="item"
                            class="item ${picked.has(opt.value) ? "selected" : ""} ${i === this.active ? "active" : ""}"
                            role="option"
                            aria-selected=${picked.has(opt.value)}
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
                    ${this.multiple && !rows.length && !typed
                        ? html`<div class="note">Nothing left to pick</div>`
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
