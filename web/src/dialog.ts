/* druids.confirm(message, opts?) -> Promise<boolean>       (false on cancel/dismiss)
   druids.prompt(message, opts?)  -> Promise<string | null> (null on cancel/dismiss)
   druids.form(message, opts)     -> Promise<Record<string, value> | null>

   Imperative, promise-returning modals built on the native
   <dialog class="df-dialog"> pattern — the same chrome the login card and
   toasts use. Each dialog is created on demand and removed from the DOM when
   it closes (no pile-up). Body text honors newlines; the prompt input is
   autofocused and Enter submits; `danger` styles the confirm button
   destructive. Reachable from classic scripts via window.druids.

   druids.confirm("Delete this model?", { danger: true }).then((ok) => { … });
   druids.prompt("Pin as:", { value: current }).then((name) => { … }); */

import "./druid-button.js";
import "./druid-select.js";
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

/* ---- form(): the multi-field prompt ----------------------------------- */

export interface FormField {
    /* key in the resolved object */
    name: string;
    label?: string;
    /* "select" renders a <druid-select>; "textarea" a plain <textarea>;
       "checkbox" a switchless checkbox row; anything else is passed through as
       an <input type="…"> (text, number, password, email, url, date, …) */
    type?: string;
    value?: string | number | boolean;
    placeholder?: string;
    /* help text under the control (.df-hint); doubles as the error slot */
    hint?: string;
    required?: boolean;
    /* enforced at submit (native constraint validation), not just presentational */
    min?: number;
    max?: number;
    step?: number;
    /* for type: "select" */
    options?: { value: string; label: string }[];
    /* return a message to hold the dialog open and flag the field */
    validate?: (value: FormValue, values: Record<string, FormValue>) => string | null | void;
}

/* a blank optional number resolves null — "left blank" stays
   distinguishable from a typed 0 */
export type FormValue = string | number | boolean | null;

export interface FormOptions {
    title?: string;
    fields: FormField[];
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

/* Promise-returning multi-field dialog — prompt() for more than one input.
   Resolves an object keyed by field `name`, or null on cancel/dismiss. A
   number field resolves a number (null when left blank, so an optional number
   stays distinguishable from a typed 0), a checkbox a boolean, everything else
   a string. `required`, the control's own constraints (min/max/step, type
   email/url) and a field's `validate` hold the dialog open and tint the
   field.

   druids.form("Pin this model:", {
       title: "Pin",
       fields: [
           { name: "num_ctx", label: "Context length", type: "number", min: 1 },
           { name: "kind", label: "Type", type: "select",
             options: [{ value: "", label: "Auto-detect" }] },
       ],
   }).then((values) => { if (values) pin(values.num_ctx, values.kind); }); */
export function form(message: string, opts: FormOptions): Promise<Record<string, FormValue> | null> {
    const { title = "Input", fields, confirmLabel = "OK", cancelLabel = "Cancel", danger = false } = opts;
    return new Promise((resolve) => {
        let result: Record<string, FormValue> | null = null;
        /* per field: its .df-field wrapper, its hint node, and a value reader */
        const rows: {
            field: FormField;
            wrap: HTMLElement;
            hint: HTMLElement | null;
            read: () => FormValue;
            /* native control, when there is one — its constraint validation
               (min/max/step/type) is what enforces those field options */
            control: HTMLInputElement | HTMLTextAreaElement | null;
        }[] = [];
        let first: HTMLElement | null = null;

        const dialog = openModal((d) => {
            const heading = document.createElement("h3");
            heading.textContent = title;
            d.append(heading);
            /* a title-only dialog should not carry a blank paragraph's margin */
            if (message) {
                const text = document.createElement("p");
                text.className = "df-dialog-text";
                text.textContent = message;
                d.append(text);
            }

            const stack = document.createElement("div");
            stack.className = "df-stack";

            for (const field of fields) {
                /* a <div>, never a <label>: <druid-select> is not labelable, so
                   a wrapping <label> would associate with nothing */
                const wrap = document.createElement("div");
                wrap.className = "df-field";
                const labelText = document.createElement("span");
                labelText.className = "df-label";
                labelText.textContent = field.label ?? field.name;
                wrap.append(labelText);

                let read: () => FormValue;
                let control: HTMLInputElement | HTMLTextAreaElement | null = null;
                if (field.type === "select") {
                    const select = document.createElement("druid-select");
                    select.setAttribute("name", field.name);
                    select.setAttribute("label", field.label ?? field.name);
                    if (field.placeholder) select.setAttribute("placeholder", field.placeholder);
                    for (const opt of field.options ?? []) {
                        const option = document.createElement("option");
                        option.value = opt.value;
                        option.textContent = opt.label;
                        select.append(option);
                    }
                    if (field.value !== undefined) select.setAttribute("value", String(field.value));
                    wrap.append(select);
                    read = () => (select as unknown as { value: string }).value ?? "";
                } else if (field.type === "textarea") {
                    const area = document.createElement("textarea");
                    if (field.placeholder) area.placeholder = field.placeholder;
                    area.value = field.value === undefined ? "" : String(field.value);
                    wrap.append(area);
                    control = area;
                    read = () => area.value;
                } else if (field.type === "checkbox") {
                    const box = document.createElement("input");
                    box.type = "checkbox";
                    box.checked = field.value === true;
                    /* control before the text for a checkbox row */
                    wrap.classList.add("df-field-row");
                    wrap.prepend(box);
                    control = box;
                    read = () => box.checked;
                } else {
                    const input = document.createElement("input");
                    input.type = field.type ?? "text";
                    if (field.placeholder) input.placeholder = field.placeholder;
                    if (field.min !== undefined) input.min = String(field.min);
                    if (field.max !== undefined) input.max = String(field.max);
                    if (field.step !== undefined) input.step = String(field.step);
                    input.value = field.value === undefined ? "" : String(field.value);
                    input.addEventListener("keydown", (event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            submit();
                        }
                    });
                    wrap.append(input);
                    control = input;
                    /* blank number -> null, so an optional numeric field can be
                       left empty without being read as a typed 0 */
                    read = () =>
                        field.type === "number"
                            ? input.value.trim() === ""
                                ? null
                                : Number(input.value)
                            : input.value;
                }
                if (!first) first = wrap.querySelector("input, textarea, druid-select");

                let hint: HTMLElement | null = null;
                if (field.hint) {
                    hint = document.createElement("span");
                    hint.className = "df-hint";
                    hint.textContent = field.hint;
                    wrap.append(hint);
                }
                rows.push({ field, wrap, hint, read, control });
                stack.append(wrap);
            }

            const submit = (): void => {
                const values: Record<string, FormValue> = {};
                for (const row of rows) values[row.field.name] = row.read();
                let ok = true;
                for (const row of rows) {
                    const value = values[row.field.name];
                    let error: string | null = null;
                    if (
                        row.field.required &&
                        (value === "" || value === null || value === false || Number.isNaN(value))
                    ) {
                        error = "Required.";
                    } else if (row.control && !row.control.checkValidity()) {
                        /* min / max / step / type=email|url — the dialog never
                           does a native submit, so run the check by hand */
                        error = row.control.validationMessage;
                    } else if (row.field.validate) {
                        error = row.field.validate(value, values) ?? null;
                    }
                    setError(row, error);
                    if (error) ok = false;
                }
                if (!ok) return;
                result = values;
                d.close();
            };

            const cancel = button(cancelLabel);
            cancel.addEventListener("click", () => d.close());
            const ok = button(confirmLabel, "primary");
            if (danger) ok.classList.add("df-danger");
            ok.addEventListener("click", submit);
            const actions = document.createElement("div");
            actions.className = "df-dialog-actions";
            actions.append(cancel, ok);
            d.append(stack, actions);
        });

        dialog.addEventListener("close", () => resolve(result), { once: true });
        requestAnimationFrame(() => first?.focus());
    });
}

/* flag (or clear) one field: .invalid on the wrapper, the message in the hint
   slot — a hint node is created on demand so a field without one can still
   report an error, and the original hint comes back when it validates */
function setError(
    row: { field: FormField; wrap: HTMLElement; hint: HTMLElement | null },
    error: string | null
): void {
    row.wrap.classList.toggle("invalid", Boolean(error));
    if (!error && !row.field.hint) {
        row.hint?.remove();
        row.hint = null;
        return;
    }
    if (!row.hint) {
        row.hint = document.createElement("span");
        row.hint.className = "df-hint";
        row.wrap.append(row.hint);
    }
    row.hint.textContent = error ?? row.field.hint ?? "";
}
