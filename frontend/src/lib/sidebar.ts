/*
 * The sidebar's two pieces of browser state, kept out of React so any leaf can
 * read or write them without a provider wrapping the shell. Same shape as
 * `theme.ts`: a read, a server snapshot, a writer and a subscribe — the four
 * things `useSyncExternalStore` needs.
 *
 * Reading storage this way rather than in an effect is deliberate: an effect
 * that calls setState trips `react-hooks/set-state-in-effect`, and it would
 * paint the wrong state first either way.
 */

export const SIDEBAR_STORAGE_KEY = "tizello-sidebar";
const COLLAPSED = "collapsed";

/** Same-tab change signals. `storage` only fires in *other* tabs. */
const COLLAPSE_EVENT = "tizello:sidebarcollapse";
const MOBILE_EVENT = "tizello:sidebarmobile";

/* --- desktop collapse: persisted ---------------------------------------- */

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === COLLAPSED;
  } catch {
    return false;
  }
}

/**
 * The server cannot know the preference, so it renders the sidebar expanded.
 * A user who collapsed it sees one expanded frame before hydration settles —
 * accepted rather than paid for with a second blocking inline script in
 * <head>, since unlike the theme this is layout, not colour, and it only
 * affects the two shell routes.
 */
export function getSidebarServerSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(collapsed: boolean) {
  try {
    if (collapsed) localStorage.setItem(SIDEBAR_STORAGE_KEY, COLLAPSED);
    else localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  } catch {
    /* private mode / storage disabled — the toggle still applies this session */
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

export function subscribeToSidebarCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/* --- mobile drawer: this session only, never persisted ------------------ */

let mobileOpen = false;

export function readMobileSidebarOpen(): boolean {
  return mobileOpen;
}

export function getMobileSidebarServerSnapshot(): boolean {
  return false;
}

export function setMobileSidebarOpen(open: boolean) {
  /* Guarded so a no-op close — navigating while the drawer is already shut —
     does not wake every subscriber. */
  if (mobileOpen === open) return;
  mobileOpen = open;
  window.dispatchEvent(new Event(MOBILE_EVENT));
}

export function subscribeToMobileSidebar(onChange: () => void) {
  window.addEventListener(MOBILE_EVENT, onChange);
  return () => window.removeEventListener(MOBILE_EVENT, onChange);
}
