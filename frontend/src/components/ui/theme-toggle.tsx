"use client";

import { useSyncExternalStore, type ReactElement, type SVGProps } from "react";
import {
  applyTheme,
  getThemeServerSnapshot,
  readStoredTheme,
  subscribeToTheme,
  type Theme,
} from "@/lib/theme";

/*
 * Three tiny stroke icons, drawn inline like `provider-marks.tsx` — no icon
 * library for three glyphs. `currentColor` is what lets the icon inherit the
 * button's own text colour instead of needing a themed fill of its own.
 */
function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.36 3.64l-.99.99M4.63 11.37l-.99.99M12.36 12.36l-.99-.99M4.63 4.63l-.99-.99"
      />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.5 9.53A6 6 0 0 1 6.47 2.5a.5.5 0 0 0-.65-.62 6.5 6.5 0 1 0 8.3 8.3.5.5 0 0 0-.62-.65"
      />
    </svg>
  );
}

function SystemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M5.5 14h5M8 11v3" />
    </svg>
  );
}

const OPTIONS: { value: Theme; label: string; Icon: (props: SVGProps<SVGSVGElement>) => ReactElement }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: SystemIcon },
];

/**
 * Light / Dark / System, as a segmented control with a sliding highlight.
 *
 * The highlight is a separate absolutely-positioned span, not a background on
 * the active button — animating a background swap can only cross-fade, never
 * slide. It lives in its own unpadded wrapper so `w-1/3` resolves against the
 * same box the three equal-width buttons divide, and `translateX(n * 100%)`
 * then lands it exactly under button `n` with no measurement or JS layout
 * read required.
 */
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
  const activeIndex = OPTIONS.findIndex((option) => option.value === theme);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex rounded-sm border border-border bg-surface p-0.5"
    >
      <div className="relative grid grid-cols-3">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/3 rounded-xs bg-brand-500 shadow-sm transition-transform duration-200 ease-standard motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />

        {OPTIONS.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => applyTheme(option.value)}
              className={[
                "relative z-10 flex items-center justify-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-standard active:scale-95",
                active ? "font-semibold text-on-brand" : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              <option.Icon className="size-3.5 shrink-0" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
