/* Icon registry — the framework ships NO icons; the consuming app provides
   its own and registers them once, at startup. This keeps the design system
   icon-set-agnostic and weightless: an app copies in only the handful of SVGs
   it actually uses (Lucide, Heroicons, hand-drawn — anything), and references
   them by name everywhere via <druid-icon name="…">.

   Register the raw <svg> markup (currentColor + a 0 0 24 24-ish viewBox works
   best so it inherits color and scales):

   druids.registerIcons({
       pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ...>…</svg>',
       x:   '<svg …>…</svg>',
   });

   Then anywhere: <druid-icon name="pin"></druid-icon>
                  <druid-icon-button icon="x" label="Close"></druid-icon-button> */

const registry = new Map<string, string>();
const listeners = new Set<() => void>();

export function registerIcon(name: string, svg: string): void {
    registry.set(name, svg);
    for (const notify of listeners) notify();
}

export function registerIcons(icons: Record<string, string>): void {
    for (const [name, svg] of Object.entries(icons)) registry.set(name, svg);
    for (const notify of listeners) notify();
}

export function getIcon(name: string): string | undefined {
    return registry.get(name);
}

/* <druid-icon> subscribes so icons registered after it renders still appear */
export function onIconsChanged(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
