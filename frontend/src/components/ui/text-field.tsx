"use client";

import { useId, useState, type ReactNode, type Ref } from "react";

/*
 * The shared field anatomy from spec §6: 12px/600 label, 36px input, 11px
 * helper or error underneath.
 *
 * Timing rule (§7): never validate on keystroke. A field validates on blur once
 * it has been touched, and thereafter on change — so the error clears the
 * moment it is fixed rather than waiting for another blur.
 *
 * No `focus:` styles here. The 2px ring is set once on `:focus-visible` in the
 * base layer, and one focus treatment is the house rule.
 */
export type TextFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  helper?: string;
  /** From the Server Action. Outranks anything the browser worked out. */
  error?: string;
  validate?: (value: string) => string | null;
  /** Rendered inside the field, right-aligned — the show/hide toggle. */
  trailing?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  required?: boolean;
};

const BASE =
  "h-9 w-full rounded-sm border bg-surface px-2.5 text-sm text-text transition-colors duration-100 ease-standard placeholder:text-text-subtle";

export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  placeholder,
  helper,
  error,
  validate,
  trailing,
  inputRef,
  onValueChange,
  onKeyDown,
  autoFocus,
  required = true,
}: TextFieldProps) {
  const id = useId();
  const [local, setLocal] = useState<string | null>(null);
  const message = error ?? local;
  const messageId = `${id}-message`;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-muted">
        {label}
      </label>

      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={type}
          ref={inputRef}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={message ? true : undefined}
          aria-describedby={message || helper ? messageId : undefined}
          onBlur={(event) => setLocal(validate?.(event.target.value) ?? null)}
          onChange={(event) => {
            const { value } = event.target;
            if (local) setLocal(validate?.(value) ?? null);
            onValueChange?.(value);
          }}
          onKeyDown={onKeyDown}
          className={[
            BASE,
            message ? "border-danger" : "border-border",
            trailing ? "pr-16" : "",
          ].join(" ")}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </span>
        )}
      </div>

      {message ? (
        <p id={messageId} role="alert" className="mt-1 text-2xs text-danger">
          {message}
        </p>
      ) : (
        helper && (
          <p id={messageId} className="mt-1 text-2xs text-text-subtle">
            {helper}
          </p>
        )
      )}
    </div>
  );
}
