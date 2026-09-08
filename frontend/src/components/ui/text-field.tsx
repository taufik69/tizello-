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
  /* `date` renders the platform picker. It is here rather than in a separate
     component because the anatomy is identical — 12px/600 label, 36px control,
     11px message — and the validate-on-blur timing below applies unchanged to
     a date the user typed rather than picked. */
  type?: "text" | "email" | "password" | "date";
  autoComplete?: string;
  defaultValue?: string;
  /**
   * Makes the field CONTROLLED. Almost every caller wants `defaultValue` —
   * uncontrolled is what lets a form re-seed by remounting — but a value that
   * lives in a map keyed by id (a project's custom properties) has to be able
   * to change without a remount, and a `defaultValue` would ignore it.
   *
   * Pass one or the other, never both: React warns, and the field then decides
   * for itself which one it is.
   */
  value?: string;
  /** Hard cap, enforced by the platform — the right primitive for a length limit, so `transform` can stay a pure 1:1 map. */
  maxLength?: number;
  /**
   * A value that exists and cannot be edited — a project key in the edit form.
   * `disabled` rather than `readOnly` on purpose: read-only stays focusable and
   * tabbable, which walks a keyboard user into a field they cannot change and
   * gives them no signal why.
   */
  disabled?: boolean;
  placeholder?: string;
  helper?: string;
  /** From the Server Action. Outranks anything the browser worked out. */
  error?: string;
  validate?: (value: string) => string | null;
  /** Rendered inside the field, right-aligned — the show/hide toggle. */
  trailing?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  /**
   * Rewrites what the user typed, in place, before anything sees it — for a
   * field whose stored form is narrower than what a keyboard produces (a
   * project key is uppercase-only).
   *
   * This writes back to `event.target.value` rather than styling the input
   * with `uppercase`, because the field is UNCONTROLLED: a CSS transform is
   * display-only, so the form would still submit what was actually typed and
   * the two would silently disagree. Must be a 1:1 character map — a
   * transform that changes the string's LENGTH moves the caret to the end
   * mid-word, since there is no controlled value to restore a selection
   * against.
   */
  transform?: (value: string) => string;
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
  value,
  maxLength,
  disabled,
  placeholder,
  helper,
  error,
  validate,
  trailing,
  inputRef,
  onValueChange,
  transform,
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
          defaultValue={value === undefined ? defaultValue : undefined}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={message ? true : undefined}
          aria-describedby={message || helper ? messageId : undefined}
          onBlur={(event) => setLocal(validate?.(event.target.value) ?? null)}
          onChange={(event) => {
            let { value } = event.target;

            if (transform) {
              const next = transform(value);
              /* Only assign on a real change: writing the same string back
                 still resets the caret to the end in Safari, which turns
                 editing the middle of a value into a fight. */
              if (next !== value) event.target.value = next;
              value = next;
            }

            if (local) setLocal(validate?.(value) ?? null);
            onValueChange?.(value);
          }}
          onKeyDown={onKeyDown}
          className={[
            BASE,
            // An invalid field is already carrying its own signal (the red
            // border, plus the message below it) — layering the global brand
            // `:focus-visible` ring on top of that reads as two competing
            // borders. Suppressing the ring here, only while invalid, leaves
            // exactly one border on screen; it returns the moment `message`
            // clears, so a fixed field still gets the normal brand ring back.
            message ? "border-danger focus-visible:outline-none" : "border-border",
            disabled ? "cursor-not-allowed bg-surface-sunken text-text-muted" : "",
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
