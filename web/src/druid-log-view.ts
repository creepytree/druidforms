/* <druid-log-view> — the application-log tab as one component: fetches
   entries, filters by level, follows the tail, refreshes on demand.

   src      endpoint returning [{time, level, source, message}, ...]
            (a bare array or wrapped as {entries: [...]})
   poll     refresh interval in seconds while the view is visible (0 = manual)
   boxed    df-card look: bordered box, controls move into a header line
   heading  header line title (boxed only, default "Log")

   Polling pauses automatically while the element is hidden (e.g. its
   df-tab-panel is inactive) and resumes on the next "tab-change".

   <druid-log-view src="/api/log" poll="5"></druid-log-view> */

import { css, html, LitElement } from "./lit-vendor.js";
import { customElement, property, state } from "./lit-vendor.js";
import "./druid-icon-button.js";
import "./druid-select.js";
import type { DruidIconButton } from "./druid-icon-button.js";

export interface LogEntry {
    time?: string;
    level?: string;
    source?: string;
    message: string;
}

const LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

@customElement("druid-log-view")
export class DruidLogView extends LitElement {
    @property() src = "";
    @property({ type: Number }) poll = 0;
    @property({ type: Boolean, reflect: true }) boxed = false;
    @property() heading = "Log";

    @state() private entries: LogEntry[] = [];
    @state() private level = "";
    @state() private follow = true;
    @state() private error = "";

    private timer: number | undefined;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            gap: 10px;
        }

        header {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .spacer {
            flex: 1;
        }

        .wrap {
            overflow: auto;
            flex: 1;
            min-height: 0;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--df-panel-body-bg, var(--bg-raised));
            font-family: ui-monospace, "Cascadia Code", monospace;
            font-size: 0.78rem;
        }

        .line {
            display: grid;
            grid-template-columns: auto auto auto 1fr;
            gap: 0 14px;
            padding: 5px 10px;
            border-bottom: 1px solid var(--border);
            white-space: pre-wrap;
            word-break: break-word;
        }

        .line.raw {
            grid-template-columns: 1fr;
        }

        .line:last-child {
            border-bottom: 0;
        }

        .time,
        .source {
            color: var(--text-muted);
            white-space: nowrap;
        }

        .level {
            font-weight: 700;
            white-space: nowrap;
        }

        .level.DEBUG { color: var(--text-muted); }
        .level.INFO { color: var(--accent); }
        .level.WARNING { color: var(--warn); }
        .level.ERROR, .level.CRITICAL { color: var(--danger); }

        .empty,
        .error {
            padding: 12px;
            color: var(--text-muted);
        }

        .error {
            color: var(--danger);
        }

        /* boxed: the df-card look with the controls in the header line —
           a raised header bar over a base-shade body, so the two stay
           distinct. Retarget with --df-panel-header-bg / --df-panel-body-bg. */
        :host([boxed]) {
            gap: 0;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--df-panel-header-bg, var(--bg-raised));
            overflow: hidden;
        }

        :host([boxed]) header {
            padding: 8px 14px;
            border-bottom: 1px solid var(--border);
            background: var(--df-panel-header-bg, var(--bg-raised));
        }

        .heading {
            font-weight: 600;
            font-size: 0.9rem;
        }

        :host([boxed]) .wrap {
            border: 0;
            border-radius: 0;
            background: var(--df-panel-body-bg, var(--bg));
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener("tab-change", this.onVisibilityHint);
        if (this.visible) this.start();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("tab-change", this.onVisibilityHint);
        this.stop();
    }

    private get visible(): boolean {
        return this.offsetParent !== null;
    }

    /* tabs toggle panel display; re-check after the switch applied */
    private onVisibilityHint = (): void => {
        requestAnimationFrame(() => (this.visible ? this.start() : this.stop()));
    };

    private start(): void {
        this.refresh();
        this.stop();
        if (this.poll > 0) {
            this.timer = window.setInterval(() => this.refresh(), this.poll * 1000);
        }
    }

    private stop(): void {
        if (this.timer !== undefined) {
            window.clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    async refresh(): Promise<void> {
        if (!this.src) return;
        try {
            const response = await fetch(this.src);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            const data = await response.json();
            this.entries = Array.isArray(data) ? data : (data.entries ?? []);
            this.error = "";
        } catch (err) {
            this.error = err instanceof Error ? err.message : String(err);
        }
    }

    protected updated(): void {
        if (!this.follow) return;
        const wrap = this.renderRoot.querySelector(".wrap");
        if (wrap) wrap.scrollTop = wrap.scrollHeight;
    }

    private onFilter(event: CustomEvent<{ value: string }>): void {
        this.level = event.detail.value;
    }

    private onFollowToggle(event: Event): void {
        this.follow = (event.target as DruidIconButton).active;
    }

    private renderLine(entry: LogEntry) {
        if (!entry.time && !entry.level && !entry.source) {
            return html`<div class="line raw"><span class="message">${entry.message}</span></div>`;
        }
        return html`<div class="line">
            <span class="time">${entry.time}</span>
            <span class="level ${entry.level ?? ""}">${entry.level}</span>
            <span class="source">${entry.source}</span>
            <span class="message">${entry.message}</span>
        </div>`;
    }

    render() {
        const shown = this.level ? this.entries.filter((entry) => entry.level === this.level) : this.entries;
        return html`
            <header>
                ${this.boxed ? html`<span class="heading">${this.heading}</span>` : null}
                <span class="spacer"></span>
                <druid-select label="Filter log level" .value=${this.level} @change=${this.onFilter}>
                    <option value="">All levels</option>
                    ${LEVELS.map((level) => html`<option value=${level}>${level}</option>`)}
                </druid-select>
                <druid-icon-button
                    toggle
                    ?active=${this.follow}
                    label="Follow tail"
                    @toggle-change=${this.onFollowToggle}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 9 12 15 18 9" /><line x1="5" y1="21" x2="19" y2="21" /></svg>
                </druid-icon-button>
                <druid-icon-button label="Refresh" @click=${this.refresh}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                </druid-icon-button>
            </header>
            <div class="wrap">
                ${this.error
                    ? html`<div class="error">Failed to load log: ${this.error}</div>`
                    : shown.length
                      ? shown.map((entry) => this.renderLine(entry))
                      : html`<div class="empty">No log entries.</div>`}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-log-view": DruidLogView;
    }
}
