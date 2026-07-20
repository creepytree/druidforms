/* druids.confirm(message, opts?) -> Promise<boolean>       (false on cancel/dismiss)
   druids.prompt(message, opts?)  -> Promise<string | null> (null on cancel/dismiss)

   Imperative, promise-returning modals built on the native
   <dialog class="df-dialog"> pattern — the same chrome the login card and
   toasts use. Each dialog is created on demand and removed from the DOM when
   it closes (no pile-up). Body text honors newlines; the prompt input is
   autofocused and Enter submits; `danger` styles the confirm button
   destructive. Reachable from classic scripts via window.druids.

   druids.confirm("Delete this model?", { danger: true }).then((ok) => { … });
   druids.prompt("Pin as:", { value: current }).then((name) => { … }); */

import "./druid-button.js";
import type { DruidButton } from "./druid-button.js";

export interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

export interface PromptOptions {
    title?: string;
    placeholder?: string;
    value?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

function button(label: string, variant?: string): DruidButton {
    const el = document.createElement("druid-button") as DruidButton;
    if (variant) el.setAttribute("variant", variant);
    el.textContent = label;
    return el;
}

function openModal(fill: (dialog: HTMLDialogElement) => void): HTMLDialogElement {
    const dialog = document.createElement("dialog");
    dialog.className = "df-dialog";
    fill(dialog);
    /* self-remove on close, however it closed (button, Enter, or Esc) */
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    return dialog;
}

export interface ModalAction {
    label: string;
    variant?: DruidButton["variant"];
    danger?: boolean;
    /* click handler; the dialog is passed so the handler decides when to close.
       When omitted the button just closes the dialog (unless close:false). */
    onClick?: (dialog: HTMLDialogElement) => void;
    close?: boolean;
}

export interface ModalOptions {
    title?: string;
    /* a plain string renders as body text; a Node is appended as-is (a table,
       a form, whatever the app builds) */
    content?: string | Node;
    actions?: ModalAction[];
    /* allow Esc to dismiss (default true); set false for a forced choice */
    dismissable?: boolean;
}

/* Open a modal with arbitrary content on the framework's .df-dialog chrome
   (native <dialog> → backdrop, focus-trap, Esc). Returns the <dialog> element,
   already shown and self-removing on close; call .close() to dismiss, or listen
   for its "close" event.

   druids.modal({
       title: "Quants",
       content: tableEl,
       actions: [{ label: "Close" }],
   }); */
export function modal(opts: ModalOptions = {}): HTMLDialogElement {
    const { title, content, actions = [], dismissable = true } = opts;
    const dialog = openModal((d) => {
        if (title) {
            const heading = document.createElement("h3");
            heading.textContent = title;
            d.append(heading);
        }
        if (typeof content === "string") {
            const text = document.createElement("p");
            text.className = "df-dialog-text";
            text.textContent = content;
            d.append(text);
        } else if (content) {
            d.append(content);
        }
        if (actions.length) {
            const row = document.createElement("div");
            row.className = "df-dialog-actions";
            for (const action of actions) {
                const btn = button(action.label, action.variant);
                if (action.danger) btn.classList.add("df-danger");
                btn.addEventListener("click", () => {
                    if (action.onClick) action.onClick(d);
                    else if (action.close !== false) d.close();
                });
                row.append(btn);
            }
            d.append(row);
        }
    });
    if (!dismissable) dialog.addEventListener("cancel", (event) => event.preventDefault());
    return dialog;
}

export function confirm(message: string, opts: ConfirmOptions = {}): Promise<boolean> {
    const { title = "Confirm", confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false } = opts;
    return new Promise((resolve) => {
        let result = false;
        const dialog = openModal((d) => {
            const heading = document.createElement("h3");
            heading.textContent = title;
            const text = document.createElement("p");
            text.className = "df-dialog-text";
            text.textContent = message;
            const cancel = button(cancelLabel);
            cancel.addEventListener("click", () => d.close());
            const ok = button(confirmLabel, "primary");
            if (danger) ok.classList.add("df-danger");
            ok.addEventListener("click", () => {
                result = true;
                d.close();
            });
            const actions = document.createElement("div");
            actions.className = "df-dialog-actions";
            actions.append(cancel, ok);
            d.append(heading, text, actions);
        });
        dialog.addEventListener("close", () => resolve(result), { once: true });
    });
}

export function prompt(message: string, opts: PromptOptions = {}): Promise<string | null> {
    const { title = "Input", placeholder = "", value = "", confirmLabel = "OK", cancelLabel = "Cancel" } = opts;
    return new Promise((resolve) => {
        let result: string | null = null;
        const input = document.createElement("input");
        const dialog = openModal((d) => {
            const heading = document.createElement("h3");
            heading.textContent = title;
            const text = document.createElement("p");
            text.className = "df-dialog-text";
            text.textContent = message;
            input.type = "text";
            input.className = "df-dialog-input";
            input.placeholder = placeholder;
            input.value = value;
            const submit = (): void => {
                result = input.value;
                d.close();
            };
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                }
            });
            const cancel = button(cancelLabel);
            cancel.addEventListener("click", () => d.close());
            const ok = button(confirmLabel, "primary");
            ok.addEventListener("click", submit);
            const actions = document.createElement("div");
            actions.className = "df-dialog-actions";
            actions.append(cancel, ok);
            d.append(heading, text, input, actions);
        });
        dialog.addEventListener("close", () => resolve(result), { once: true });
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    });
}
