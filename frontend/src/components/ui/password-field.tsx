"use client";

import { useState } from "react";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";

/**
 * A text field plus a show/hide toggle. The toggle is a `<button type="button">`
 * carrying `aria-pressed` — never something that can submit the form, and never
 * an icon without a label (spec §13).
 */
export function PasswordField(
  props: Omit<TextFieldProps, "type" | "trailing">,
) {
  const [shown, setShown] = useState(false);

  return (
    <TextField
      {...props}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
          className="rounded-sm px-2 py-1 text-2xs font-semibold text-text-muted transition-colors duration-100 ease-standard hover:text-text"
        >
          {shown ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
