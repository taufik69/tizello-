/**
 * Where the New project form opens: the right-hand drawer, or a centred modal.
 *
 * A preference, not a prop. The drawer is the default because the list behind
 * it is context — on a board you are adding to a column you can still see —
 * but that argument is weaker on a narrow screen and weaker still for someone
 * who wants the form to be the only thing on screen. Both are one `<dialog>`
 * in two positions (`ui/drawer.tsx`), so the choice costs a class string.
 *
 * `localStorage`, not a cookie, and that is the difference from `lib/theme.ts`
 * next door. The theme has to be in the first byte of HTML or the page flashes
 * the wrong palette, which is what makes it worth a cookie on every request.
 * This decides the shape of a panel that is closed on arrival and cannot flash
 * anything, so it stays in the browser where it belongs.
 *
 * Read through `useSyncExternalStore` with `getSurfaceServerSnapshot` as the
 * server value — the same plumbing `ThemeToggle` uses, and for the same
 * reason: reading storage in an effect and calling `setState` trips
 * `react-hooks/set-state-in-effect`, and reading it during render is a
 * hydration mismatch.
 */
export const PROJECT_SURFACES = ["drawer", "modal"] as const;
export type ProjectSurface = (typeof PROJECT_SURFACES)[number];

const STORAGE_KEY = "tizello-project-surface";

/** Same-tab change signal. `storage` only fires in *other* tabs. */
const SURFACE_EVENT = "tizello:projectsurfacechange";

export function isProjectSurface(value: unknown): value is ProjectSurface {
  return (
    typeof value === "string" &&
    (PROJECT_SURFACES as readonly string[]).includes(value)
  );
}

/** The stored preference, or the drawer. Storage throws outright in some privacy modes. */
export function readStoredSurface(): ProjectSurface {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isProjectSurface(stored) ? stored : "drawer";
  } catch {
    return "drawer";
  }
}

export function setStoredSurface(surface: ProjectSurface) {
  try {
    localStorage.setItem(STORAGE_KEY, surface);
  } catch {
    /* Blocked or full. The switch still applies for this page view — the event
       below is what actually re-renders the panel. */
  }

  window.dispatchEvent(new Event(SURFACE_EVENT));
}

/* --- useSyncExternalStore plumbing -------------------------------------- */

export function subscribeToSurface(onChange: () => void) {
  window.addEventListener(SURFACE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SURFACE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The server pass has no storage to read, and nothing is visible either way:
 * the panel is closed, so the class string it would have carried was never
 * painted. It reconciles on hydration, long before anyone opens it.
 */
export function getSurfaceServerSnapshot(): ProjectSurface {
  return "drawer";
}
