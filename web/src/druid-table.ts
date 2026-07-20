/* <druid-table> — sorting and live filtering for a plain light-DOM table.

   heading            title shown in the header bar
   searchable         render a filter box in the header bar
   search-placeholder placeholder for that box (default "Filter")
   filter             the active query (also settable from the app)
   sortable           click a <th> to sort by that column
   sort / direction   initial sort column key and "asc" | "desc"
   empty-text         message shown when the filter hides every row
   boxed              card chrome (lit header bar over the table well)

   The table stays the app's own markup — it is slotted, not rebuilt, so
   server-rendered rows, `.df-table` styling and any app JS holding on to a
   row keep working. Sorting reorders the existing <tr> nodes; filtering
   toggles their `hidden` flag. Rows swapped in later are picked up
   automatically (a MutationObserver re-applies the current sort + filter).

   The slotted table scrolls inside the component on both axes — give it
   `class="df-table wide"` so it has a width floor to scroll against, or it
   will squeeze its columns on a narrow viewport instead.

   Column key = the <th>'s `data-key`, else its text. Cell value = the
   <td>'s `data-value` if present, else its text; two values that both parse
   as numbers compare numerically. `<th data-sort="none">` opts a column out.

   <druid-table sortable searchable heading="Models" boxed>
     <table class="df-table">
       <thead><tr><th>Name</th><th class="num" data-key="size">Size</th></tr></thead>
       <tbody><tr><td>gemma</td><td class="num" data-value="8100">8.1 GB</td></tr></tbody>
     </table>
   </druid-table> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property, state } from "./lit-vendor.js";

type Direction = "asc" | "desc";

@customElement("druid-table")
export class DruidTable extends LitElement {
    @property() heading = "";
    @property({ type: Boolean }) searchable = false;
    @property({ attribute: "search-placeholder" }) searchPlaceholder = "Filter";
    @property() filter = "";
    @property({ type: Boolean }) sortable = false;
    @property() sort = "";
    @property() direction: Direction = "asc";
    @property({ attribute: "empty-text" }) emptyText = "Nothing matches that filter.";
    @property({ type: Boolean, reflect: true }) boxed = false;

    /* true while the filter hid every row — drives the empty message */
    @state() private emptyVisible = false;

    private observer?: MutationObserver;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .heading {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .spacer {
            flex: 1;
        }

        input {
            width: 180px;
            max-width: 40vw;
            padding: 5px 10px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm, 6px);
            background: var(--df-select-bg, var(--bg-dim));
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            transition:
                border-color var(--df-dur, 0.2s) var(--df-ease, ease),
                box-shadow var(--df-dur, 0.2s) var(--df-ease, ease);
        }

        input:focus {
            outline: none;
            border-color: var(--df-accent, var(--accent));
            box-shadow: var(--focus-ring);
        }

        input::placeholder {
            color: var(--text-muted);
        }

        .wrap {
            flex: 1;
            min-height: 0;
            overflow: auto;
        }

        .empty {
            padding: 18px;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.85rem;
        }

        /* boxed: the df-card look — a lit header bar over the table well */
        :host([boxed]) {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--df-panel-body-bg, var(--bg-dim));
            overflow: hidden;
        }

        :host([boxed]) header {
            margin-bottom: 0;
            padding: 6px 10px;
            border-bottom: 1px solid var(--border);
            background: var(--df-panel-header-bg, var(--bg-header));
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        /* rows the app renders or replaces later join the current view */
        this.observer = new MutationObserver(() => this.apply());
        this.observe();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.observer?.disconnect();
    }

    protected firstUpdated(): void {
        this.apply();
    }

    protected updated(changed: Map<string, unknown>): void {
        if (changed.has("filter") || changed.has("sort") || changed.has("direction") || changed.has("sortable")) {
            this.apply();
        }
    }

    private observe(): void {
        this.observer?.observe(this, { childList: true, subtree: true });
    }

    private get table(): HTMLTableElement | null {
        return this.querySelector("table");
    }

    private get rows(): HTMLTableRowElement[] {
        return [...(this.table?.tBodies[0]?.rows ?? [])];
    }

    private headers(): HTMLTableCellElement[] {
        return [...(this.table?.tHead?.rows[0]?.cells ?? [])] as HTMLTableCellElement[];
    }

    private key(th: HTMLTableCellElement): string {
        return th.dataset.key || (th.textContent ?? "").trim();
    }

    /* re-read the table and apply the current sort + filter */
    refresh(): void {
        this.apply();
    }

    setFilter(value: string): void {
        this.filter = value;
    }

    private onSearch(event: Event): void {
        this.filter = (event.target as HTMLInputElement).value;
        this.dispatchEvent(
            new CustomEvent("table-filter", {
                detail: { value: this.filter, visible: this.rows.filter((r) => !r.hidden).length },
                bubbles: true,
            }),
        );
    }

    private onHeadClick(event: Event): void {
        if (!this.sortable) return;
        const th = (event.target as HTMLElement).closest("th");
        if (!th || th.dataset.sort === "none" || !this.headers().includes(th as HTMLTableCellElement)) return;

        const key = this.key(th as HTMLTableCellElement);
        /* same column toggles direction, a new one starts ascending */
        this.direction = this.sort === key && this.direction === "asc" ? "desc" : "asc";
        this.sort = key;
        this.dispatchEvent(
            new CustomEvent("table-sort", { detail: { key, direction: this.direction }, bubbles: true }),
        );
    }

    private cellValue(row: HTMLTableRowElement, index: number): string {
        const cell = row.cells[index];
        return (cell?.dataset.value ?? cell?.textContent ?? "").trim();
    }

    private apply(): void {
        const table = this.table;
        if (!table) return;

        /* Reordering rows is itself a childList mutation, and observer
           callbacks run in a microtask — a plain re-entrancy flag would be
           back to false by then. Detach for the duration and drop whatever
           our own writes queued up before re-attaching. */
        this.observer?.disconnect();

        const heads = this.headers();
        for (const th of heads) {
            const sortableColumn = this.sortable && th.dataset.sort !== "none";
            /* data-sort is the styling hook druids.css hangs the caret on */
            if (sortableColumn && !th.hasAttribute("data-sort")) th.setAttribute("data-sort", "");
            if (!sortableColumn) th.removeAttribute("aria-sort");
            else if (this.key(th) === this.sort) {
                th.setAttribute("aria-sort", this.direction === "asc" ? "ascending" : "descending");
            } else th.removeAttribute("aria-sort");
        }

        const index = heads.findIndex((th) => this.key(th) === this.sort && th.dataset.sort !== "none");
        if (this.sortable && index !== -1) {
            const factor = this.direction === "desc" ? -1 : 1;
            const sorted = this.rows.sort((a, b) => {
                const left = this.cellValue(a, index);
                const right = this.cellValue(b, index);
                const ln = Number(left);
                const rn = Number(right);
                /* numeric when both sides are numbers, natural text otherwise */
                const cmp =
                    left !== "" && right !== "" && !Number.isNaN(ln) && !Number.isNaN(rn)
                        ? ln - rn
                        : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
                return cmp * factor;
            });
            const body = table.tBodies[0];
            for (const row of sorted) body.appendChild(row);
        }

        const needle = this.filter.trim().toLowerCase();
        let visible = 0;
        for (const row of this.rows) {
            const hit = !needle || (row.textContent ?? "").toLowerCase().includes(needle);
            row.hidden = !hit;
            if (hit) visible++;
        }

        this.observer?.takeRecords();
        this.observe();

        /* re-render for the empty message; the slotted table is untouched */
        this.emptyVisible = this.rows.length > 0 && visible === 0;
    }

    render() {
        const bar =
            this.heading || this.searchable
                ? html`<header>
                      ${this.heading ? html`<span class="heading">${this.heading}</span>` : ""}
                      <span class="spacer"></span>
                      ${this.searchable
                          ? html`<input
                                type="search"
                                .value=${this.filter}
                                placeholder=${this.searchPlaceholder}
                                aria-label=${this.searchPlaceholder}
                                @input=${this.onSearch}
                            />`
                          : ""}
                  </header>`
                : "";

        return html`${bar}
            <div class="wrap" @click=${this.onHeadClick}><slot></slot></div>
            ${this.emptyVisible ? html`<div class="empty">${this.emptyText}</div>` : ""}`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-table": DruidTable;
    }
}
