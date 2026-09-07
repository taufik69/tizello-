export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * A cookie, not `localStorage`, for one reason: the server can read it.
 *
 * With the preference in storage, only the browser knew it, so avoiding a
 * light first frame for someone who forced dark meant a blocking inline
 * <script> in <head> — and React 19 warns about every <script> rendered inside
 * a component ("Scripts inside React components are never executed when
 * rendering on the client"), `next/script` included, since that is itself a
 * Client Component. A cookie is sent with the document request, so the root
 * layout stamps `data-theme` server-side and the correct palette is in the
 * first byte of HTML. No script, no warning, no flash — and it still works
 * with JavaScript disabled.
 */
export const THEME_COOKIE = "tizello-theme";

/** A year. The preference is not a session thing. */
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Same-tab change signal. `storage` only fires in *other* tabs. */
const THEME_EVENT = "tizello:themechange";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Picks the theme out of a raw `Cookie` header value. Pure, so the root layout
 * can call it with `next/headers` output and the browser can call it with
 * `document.cookie` — one parser, no chance of the two disagreeing.
 */
export function themeFromCookies(header: string | undefined): Theme {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`));
  const value = match?.[1] && decodeURIComponent(match[1]);

  return isTheme(value) ? value : "system";
}

/** Reads the stored preference. "system" if unset or cookies are unavailable. */
export function readStoredTheme(): Theme {
  try {
    return themeFromCookies(document.cookie);
  } catch {
    return "system";
  }
}

/**
 * Applies a preference to <html>.
 * "system" removes the attribute, handing control back to the
 * `color-scheme: light dark` default in globals.css — which is what every
 * light-dark() token resolves against.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);

  try {
    /* "system" is the absence of a preference, so it clears the cookie rather
       than storing the word — the server then renders no attribute at all,
       which is what hands the decision back to `color-scheme: light dark`. */
    document.cookie =
      theme === "system"
        ? `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`
        : `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    /* cookies disabled — the attribute still applied for this page view */
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}

/* --- useSyncExternalStore plumbing -------------------------------------- */

export function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The neutral default for the SSR pass. The *palette* is already correct by
 * then — the root layout read the same cookie and stamped `data-theme` — this
 * is only the toggle's own highlight, which snaps into place on hydration.
 */
export function getThemeServerSnapshot(): Theme {
  return "system";
}
