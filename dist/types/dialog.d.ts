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
export interface ModalAction {
    label: string;
    variant?: DruidButton["variant"];
    danger?: boolean;
    onClick?: (dialog: HTMLDialogElement) => void;
    close?: boolean;
}
export interface ModalOptions {
    title?: string;
    content?: string | Node;
    actions?: ModalAction[];
    dismissable?: boolean;
}
export declare function modal(opts?: ModalOptions): HTMLDialogElement;
export declare function confirm(message: string, opts?: ConfirmOptions): Promise<boolean>;
export declare function prompt(message: string, opts?: PromptOptions): Promise<string | null>;
export interface FormField {
    name: string;
    label?: string;
    type?: string;
    value?: string | number | boolean;
    placeholder?: string;
    hint?: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: {
        value: string;
        label: string;
    }[];
    validate?: (value: FormValue, values: Record<string, FormValue>) => string | null | void;
}
export type FormValue = string | number | boolean | null;
export interface FormOptions {
    title?: string;
    fields: FormField[];
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}
export declare function form(message: string, opts: FormOptions): Promise<Record<string, FormValue> | null>;
