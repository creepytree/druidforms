/* druids.toast(message, type?) — stacked auto-dismissing notifications.

   Renders plain light-DOM divs (styled in druids.css as .df-toast) into a
   fixed bottom-right stack that is created on first use. Reachable from
   classic app scripts via the window.druids global:

   druids.toast("Saved", "ok");
   druids.toast("That failed", "danger", 5000); */

export type ToastType = "info" | "ok" | "warn" | "danger";

export function toast(message: string, type: ToastType = "info", duration = 3000): HTMLElement {
    let stack = document.querySelector<HTMLElement>(".df-toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "df-toast-stack";
        document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `df-toast ${type}`;
    el.setAttribute("role", "status");
    el.textContent = message;
    stack.appendChild(el);
    window.setTimeout(() => {
        el.classList.add("out");
        el.addEventListener("transitionend", () => el.remove(), { once: true });
        /* fallback removal in case transitions are disabled */
        window.setTimeout(() => el.remove(), 600);
    }, duration);
    return el;
}
