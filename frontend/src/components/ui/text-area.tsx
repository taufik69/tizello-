"use client";

import { useId, useState } from "react";

/*
 * `TextField`'s anatomy with a multi-line control: same 12px/600 label, same
 * border and radius, same 11px message slot underneath, and the same timing
 * rule — validate on blur once touched, then on change so the error clears the
 * moment it is fixed.
 *
 * A separate file rather than a `multiline` prop on `TextField`: the element is
 * a different tag with a different `ref` type and no `type` / `autoComplete` /
 * `trailing`, and threading a union through that component to save one file
 * would make the common case harder to read.
 *
 * No `focus:` styles. The 2px ring is set once on `:focus-visible` in the base
 * layer, and one focus treatment is the house rule.
 */
const BASE =
  "w-full resize-y rounded-sm border bg-surface px-2.5 py-2 text-sm text-text transition-colors duration-100 ease-standard placeholder:text-text-subtle";

export function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  helper,
  error,
  rows = 3,
  maxLength,
  validate,
  onValueChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helper?: string;
  /** From the Server Action. Outranks anything the browser worked out. */
  error?: string;
  rows?: number;
  maxLength?: number;
  validate?: (value: string) => string | null;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const [local, setLocal] = useState<string | null>(null);
  const message = error ?? local;
  const messageId = `${id}-message`;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-muted">
        {label}
      </label>

      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={message ? true : undefined}
        aria-describedby={message || helper ? messageId : undefined}
        onBlur={(event) => setLocal(validate?.(event.target.value) ?? null)}
        onChange={(event) => {
          const { value } = event.target;
          if (local) setLocal(validate?.(value) ?? null);
          onValueChange?.(value);
        }}
        className={[
          "mt-1",
          BASE,
          /* One border on screen at a time: an invalid field already carries
             the red border and the message below it, so the global brand ring
             is suppressed until `message` clears. */
          message ? "border-danger focus-visible:outline-none" : "border-border",
        ].join(" ")}
      />

      {message ? (
        <p id={messageId} role="alert" className="mt-1 text-2xs text-danger">
          {message}
        </p>
      ) : helper ? (
        <p id={messageId} className="mt-1 text-2xs text-text-subtle">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
