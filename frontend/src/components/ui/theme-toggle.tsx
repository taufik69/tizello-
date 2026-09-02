"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getThemeServerSnapshot,
  readStoredTheme,
  subscribeToTheme,
  type Theme,
} from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
  /*
   * localStorage is external state, so it is read through the store API rather
   * than an effect: the server renders "system", the client swaps in the real
   * preference during hydration, and React does not warn about the mismatch.
   */
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readStoredTheme,
    getThemeServerSnapshot,
  );

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex rounded-sm border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => applyTheme(option.value)}
            className={
              active
                ? "rounded-xs bg-brand-500 px-2.5 py-1 text-xs font-semibold text-on-brand"
                : "rounded-xs px-2.5 py-1 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
