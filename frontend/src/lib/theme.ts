export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "tizello-theme";

/** Same-tab change signal. `storage` only fires in *other* tabs. */
const THEME_EVENT = "tizello:themechange";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Reads the stored preference. "system" if unset or storage is unavailable. */
export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
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
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode / storage disabled — the attribute still applied */
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

/** The server cannot know the preference, so it renders the neutral default. */
export function getThemeServerSnapshot(): Theme {
  return "system";
}

/**
 * Runs before first paint, inlined into <head>. Without it the server-rendered
 * HTML has no data-theme, so a user who forced dark would see one light frame.
 * Kept dependency-free and tiny because it blocks rendering.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
