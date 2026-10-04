/* <druid-theme-toggle> — the third theming control, next to the accent and
   flavor pickers. One button that cycles the preference auto → light → dark,
   rather than a popover: there are only three states and the icon names the
   one you are in, so a menu would cost a click for nothing.

   "auto" follows the OS and is the default, so an app that ships no theme UI
   at all still lands on the user's system setting. The choice is stored per
   app slug, like the accent and the flavor. */

import { css, html, LitElement, svg } from "./lit-vendor.js";
import { customElement, state } from "./lit-vendor.js";
import { hostHidden } from "./host-hidden.js";
import { applyTheme, currentTheme, resolvedTheme, saveTheme, storedTheme, THEMES, type ThemeName } from "./theme.js";

/* what each state says when hovered — the resolved half matters on "auto",
   where the icon alone cannot say which way the OS went */
const LABELS: Record<ThemeName, string> = {
    auto: "Theme: follow system",
    light: "Theme: light",
    dark: "Theme: dark",
};

@customElement("druid-theme-toggle")
export class DruidThemeToggle extends LitElement {
    @state() private theme: ThemeName = "auto";
    @state() private resolved: "light" | "dark" = "dark";

    static styles = [
        css`
            :host {
                display: inline-flex;
            }

            button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: var(--radius);
                border: 1px solid var(--border);
                background: none;
                color: var(--text-muted);
                cursor: pointer;
                transition:
                    background var(--df-dur-fast) var(--df-ease),
                    color var(--df-dur-fast) var(--df-ease);
            }

            button:hover {
                background: var(--bg-hover);
                color: var(--text);
            }

            button:focus-visible {
                outline: none;
                box-shadow: var(--focus-ring);
            }

            svg {
                width: 19px;
                height: 19px;
            }

            /* the icon turns as the state does, so the cycle reads as one control
               rather than three unrelated glyphs */
            svg {
                transition: transform var(--df-dur) var(--df-ease);
            }

            button:hover svg {
                transform: rotate(18deg);
            }
        `,
        hostHidden,
    ];

    connectedCallback(): void {
        super.connectedCallback();
        this.theme = storedTheme();
        this.resolved = resolvedTheme();
        /* on "auto" the OS can change under us; theme.ts re-resolves and we
           only need to catch up with the icon */
        this.media.addEventListener("change", this.onSystemChange);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.media.removeEventListener("change", this.onSystemChange);
    }

    private media = window.matchMedia("(prefers-color-scheme: light)");

    private onSystemChange = (): void => {
        this.resolved = resolvedTheme();
    };

    private cycle(): void {
        const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
        applyTheme(next);
        saveTheme(next);
        this.theme = next;
        this.resolved = resolvedTheme();
        this.dispatchEvent(
            new CustomEvent("theme-change", {
                detail: { theme: next, resolved: this.resolved },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        const sun = svg`
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />`;
        const moon = svg`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />`;
        /* auto: the same disc, half of it filled — "whichever the system says" */
        const auto = svg`
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />`;
        const glyph = this.theme === "auto" ? auto : this.theme === "light" ? sun : moon;
        const label = LABELS[this.theme] + (this.theme === "auto" ? ` (${this.resolved})` : "");

        return html`
            <button title=${label} aria-label=${label} @click=${() => this.cycle()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${glyph}
                </svg>
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-theme-toggle": DruidThemeToggle;
    }
}
