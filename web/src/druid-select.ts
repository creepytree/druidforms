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
   set, a hidden input in light DOM keeps classic form POSTs working. */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property, state } from "./lit-vendor.js";

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

    @state() private open = false;
    @state() private options: SelectOption[] = [];

    private observer: MutationObserver | undefined;
    private hiddenInput: HTMLInputElement | undefined;

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
        }

        .trigger {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
            min-width: 130px;
            padding: 6px 10px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            /* match the light-DOM form controls (--bg), not the raised card */
            background: var(--df-select-bg, var(--bg));
            color: var(--text);
            font: inherit;
            font-size: 0.85rem;
            cursor: pointer;
            transition: border-color 0.15s;
        }

        .trigger:hover,
        .trigger:focus-visible,
        .trigger.open {
            outline: none;
            border-color: var(--df-accent, var(--accent));
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

        .menu {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            min-width: 100%;
            z-index: 60;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 4px;
            max-height: 260px;
            overflow-y: auto;
            background: var(--df-select-bg, var(--bg));
            border: 1px solid var(--df-accent, var(--accent));
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            opacity: 0;
            transform: translateY(-4px);
            pointer-events: none;
            transition: opacity 0.12s ease, transform 0.12s ease;
        }

        .menu.open {
            opacity: 1;
            transform: none;
            pointer-events: auto;
        }

        .item {
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
        }

        .item:hover {
            background: var(--bg-hover);
        }

        .item.selected {
            background: var(--df-accent-soft, var(--accent-soft));
            color: var(--df-accent, var(--accent));
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
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.observer?.disconnect();
        document.removeEventListener("click", this.onOutsideClick);
        document.removeEventListener("keydown", this.onKeydown);
    }

    private readOptions(): void {
        this.options = [...this.querySelectorAll("option")].map((opt) => ({
            value: opt.getAttribute("value") ?? opt.textContent?.trim() ?? "",
            label: opt.textContent?.trim() ?? "",
        }));
    }

    private onOutsideClick = (event: MouseEvent): void => {
        if (this.open && !event.composedPath().includes(this)) this.open = false;
    };

    private onKeydown = (event: KeyboardEvent): void => {
        if (this.open && event.key === "Escape") this.open = false;
    };

    private select(option: SelectOption): void {
        this.value = option.value;
        this.open = false;
        this.syncHiddenInput();
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

    protected updated(): void {
        this.syncHiddenInput();
    }

    render() {
        const current = this.options.find((opt) => opt.value === this.value);
        return html`
            <button
                type="button"
                class="trigger ${this.open ? "open" : ""}"
                aria-haspopup="listbox"
                aria-expanded=${this.open}
                aria-label=${this.label || this.placeholder}
                @click=${() => (this.open = !this.open)}
            >
                ${current
                    ? html`<span>${current.label}</span>`
                    : html`<span class="placeholder">${this.placeholder}</span>`}
                <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div class="menu ${this.open ? "open" : ""}" role="listbox">
                ${this.options.map(
                    (opt) => html`<button
                        type="button"
                        class="item ${opt.value === this.value ? "selected" : ""}"
                        role="option"
                        aria-selected=${opt.value === this.value}
                        @click=${() => this.select(opt)}
                    >
                        ${opt.label}
                    </button>`
                )}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-select": DruidSelect;
    }
}
