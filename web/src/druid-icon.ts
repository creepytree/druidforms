/* <druid-icon name="…"> — renders an icon the consuming app registered.

   The framework ships no icons: an app registers its own set once via
   druids.registerIcons({...}) (see icons.ts), then references them by name.
   This element just draws the registered <svg> — inheriting color from
   `currentColor` and sizing in `em` (1em by default; set `size` to any CSS
   length, or width/height via CSS). Unknown names render nothing.

   <druid-icon name="pin"></druid-icon>
   <druid-icon name="rocket" size="34px"></druid-icon>

   Also reachable straight from <druid-icon-button icon="pin">. */

import { css, html, LitElement, nothing } from "./lit-vendor.js";
import { customElement, property, state, unsafeHTML } from "./lit-vendor.js";
import type { PropertyValues } from "./lit-vendor.js";
import { getIcon, onIconsChanged } from "./icons.js";

@customElement("druid-icon")
export class DruidIcon extends LitElement {
    @property() name = "";
    @property() size = "";

    /* bumped when the registry changes, to re-pull a now-registered icon */
    @state() private rev = 0;

    private unsubscribe?: () => void;

    static styles = css`
        :host {
            display: inline-flex;
            width: 1em;
            height: 1em;
            line-height: 0;
            flex-shrink: 0;
        }

        /* override any width/height="24" on the registered svg (CSS beats attrs) */
        svg {
            width: 100%;
            height: 100%;
            display: block;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.unsubscribe = onIconsChanged(() => this.rev++);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unsubscribe?.();
    }

    protected willUpdate(changed: PropertyValues): void {
        if (changed.has("size")) {
            /* inline host style beats the :host 1em default */
            if (this.size) {
                this.style.width = this.size;
                this.style.height = this.size;
            } else {
                this.style.removeProperty("width");
                this.style.removeProperty("height");
            }
        }
    }

    render() {
        const svg = this.name ? getIcon(this.name) : undefined;
        return svg ? html`${unsafeHTML(svg)}` : nothing;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-icon": DruidIcon;
    }
}
