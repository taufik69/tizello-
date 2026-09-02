"use client";

import { useId, useState, type Ref } from "react";
import { CODE_LENGTH } from "@/lib/validation/auth";

/*
 * The 6-digit login code.
 *
 * ONE <input>, rendered as six boxes — not six inputs. Six inputs break paste,
 * break screen-reader navigation, and fight the platform's one-time-code
 * autofill. Here the real field is a single transparent input stretched over
 * the boxes, so paste, autofill, arrow keys and select-all all behave the way
 * the platform intends, and the boxes are pure decoration (`aria-hidden`).
 *
 * The input carries no visible focus ring of its own, so the active box is the
 * replacement indicator — never `outline-none` without one.
 */
const BOXES = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const BOX =
  "flex h-11 flex-1 items-center justify-center rounded-sm border bg-surface text-lg font-semibold tabular-nums text-text transition-colors duration-100 ease-standard";

export function CodeInput({
  name = "code",
  label,
  error,
  inputRef,
}: {
  name?: string;
  label: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, CODE_LENGTH - 1);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-muted">
        {label}
      </label>

      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          ref={inputRef}
          value={value}
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={CODE_LENGTH}
          autoComplete="one-time-code"
          autoFocus
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const form = event.currentTarget.form;
            const digits = event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
            setValue(digits);
            /* Auto-submit only on a complete value — never a partial one.
               A pasted 6-digit string lands here in one change, so paste
               fills and submits in the same gesture. */
            if (digits.length === CODE_LENGTH) form?.requestSubmit();
          }}
          className="absolute inset-0 z-10 size-full cursor-text opacity-0"
        />

        <div className="flex gap-2" aria-hidden="true">
          {BOXES.map((index) => (
            <span
              key={index}
              className={[
                BOX,
                index === 2 ? "mr-2" : "",
                focused && index === active
                  ? "border-focus ring-2 ring-focus"
                  : error
                    ? "border-danger"
                    : "border-border",
              ].join(" ")}
            >
              {value[index] ?? ""}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p id={messageId} role="alert" className="mt-1 text-2xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
