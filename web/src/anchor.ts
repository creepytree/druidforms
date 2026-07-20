/* anchor() — hang a panel off an anchor element: the placement that
   <druid-popover> and <druid-select> use, exposed so an app can build its own
   overlay control (a combobox, a context menu) that survives a clipping
   ancestor such as a .df-card (overflow: hidden) or a scrolling table.

   The panel is laid out position:fixed against the viewport, flips to the
   other side when short of room, is clamped (and width-capped) into the
   viewport, and follows the anchor on scroll/resize until released. A panel
   carrying the `popover` attribute is also lifted into the top layer, which
   is what escapes a transformed ancestor — position:fixed alone does not.

   const pin = druids.anchor(menu, input, { placement: "bottom-start", matchWidth: true });
   pin.update();   // after the panel's content changed size
   pin.release();  // on close: stops following, hides the popover it opened */

export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end" | "left-start" | "right-start";

export interface AnchorOptions {
    placement?: Placement;
    gap?: number;
    matchWidth?: boolean;
}

export interface AnchorHandle {
    update(): void;
    release(): void;
}

function place(panel: HTMLElement, target: Element, placement: Placement, gap: number, matchWidth: boolean): void {
    /* offsetWidth, not the rect: an ancestor mid-animation (a .df-dialog
       scaling open) transforms the rect and would size the panel short */
    if (matchWidth && target instanceof HTMLElement) panel.style.minWidth = `${target.offsetWidth}px`;
    const t = target.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const [main, align = "start"] = placement.split("-");

    let top = 0;
    let left = 0;

    if (main === "bottom" || main === "top") {
        top = main === "bottom" ? t.bottom + gap : t.top - p.height - gap;
        /* flip vertically when it would spill off-screen */
        if (main === "bottom" && top + p.height > vh - gap && t.top - p.height - gap > 0) {
            top = t.top - p.height - gap;
        } else if (main === "top" && top < 0 && t.bottom + p.height + gap < vh) {
            top = t.bottom + gap;
        }
        left = align === "end" ? t.right - p.width : t.left;
    } else {
        left = main === "right" ? t.right + gap : t.left - p.width - gap;
        if (main === "right" && left + p.width > vw && t.left - p.width - gap > 0) {
            left = t.left - p.width - gap;
        } else if (main === "left" && left < 0 && t.right + p.width + gap < vw) {
            left = t.right + gap;
        }
        top = t.top;
    }

    /* keep inside the viewport on both axes */
    left = Math.max(gap, Math.min(left, vw - p.width - gap));
    top = Math.max(gap, Math.min(top, vh - p.height - gap));

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

export function anchor(panel: HTMLElement, target: Element, opts: AnchorOptions = {}): AnchorHandle {
    const placement = opts.placement ?? "bottom-start";
    const gap = opts.gap ?? 6;
    const matchWidth = opts.matchWidth ?? false;

    Object.assign(panel.style, { position: "fixed", margin: "0", inset: "auto", maxWidth: `calc(100vw - ${2 * gap}px)` });

    let opened = false;
    if (panel.hasAttribute("popover")) {
        try {
            panel.showPopover();
            opened = true;
        } catch {
            /* already open or unsupported — fixed positioning still applies */
        }
    }

    const update = (): void => place(panel, target, placement, gap, matchWidth);
    /* capture: a scroll in any ancestor scroll container, not just the window */
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    update();

    return {
        update,
        release(): void {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
            if (opened) {
                try {
                    panel.hidePopover();
                } catch {
                    /* already closed */
                }
            }
        },
    };
}
