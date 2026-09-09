/*
 * How this person likes the Projects screens laid out.
 *
 * PREFERENCES, NOT PARAMS, and that is the line between this file and
 * `project-filters.ts`. A filter changes WHICH projects you are looking at, so
 * it belongs in the URL where it can be shared, bookmarked and stepped back
 * through. Everything here changes nothing about the result — it is a statement
 * about one person's eyes and one person's screen — and a pasted link that
 * silently reformatted the recipient's tables would be a bug, not a feature.
 *
 * ONE OBJECT, ONE KEY, ONE EVENT rather than a store per toggle. The first two
 * of these shipped as their own modules and the third would have been a third
 * copy of the same forty lines; a record also means adding a preference is a
 * field and a default rather than a new subscription for every reader to wire.
 *
 * `localStorage` for the reason `project-surface.ts` gives at length: the theme
 * earns a cookie because the wrong palette flashes before hydration, and none
 * of these can flash anything worth seeing — a row 4px taller for one frame is
 * not a flash.
 *
 * THE SNAPSHOT IS CACHED, AND THAT IS LOAD-BEARING. `useSyncExternalStore`
 * compares snapshots by identity, so a reader that parsed the JSON fresh on
 * every call would hand React a new object every render and spin forever. The
 * cache is cleared by the subscription, which is the only thing that knows the
 * stored value has actually changed.
 *
 * WHERE THE SURFACE PREFERENCE IS. `project-surface.ts`, still its own module,
 * because the create drawer reads it directly and switches it from its own
 * header — it is a preference about a PANEL rather than about these screens,
 * and folding it in here would couple the drawer to the projects list.
 */
export type ProjectPrefs = {
  /** Table row padding. */
  density: "comfortable" | "compact";
  /** What a long project name does in a table cell. */
  names: "truncate" | "wrap";
  /** Draw the status chip on board cards. */
  cardStatus: boolean;
  /** Draw the collaborator stack on board cards. */
  cardPeople: boolean;
  /** Draw the project key on board cards. */
  cardKey: boolean;
};

/** Frozen so it can also be the server snapshot — a stable identity React can compare. */
export const DEFAULT_PREFS: ProjectPrefs = Object.freeze({
  density: "comfortable",
  names: "truncate",
  cardStatus: true,
  cardPeople: true,
  cardKey: false,
});

const STORAGE_KEY = "tizello-project-prefs";

/** Same-tab change signal. `storage` only fires in *other* tabs. */
const PREFS_EVENT = "tizello:projectprefschange";

/**
 * Read field by field over the defaults, never trusted whole.
 *
 * This string was written by an older build of the app as often as by the
 * current one, so a stored object missing `names` — or carrying a `density` of
 * `"cosy"` from a renamed option — resolves to the default for that field
 * rather than putting an unknown value into a `data-` attribute no CSS matches.
 */
function parse(raw: string | null): ProjectPrefs {
  if (!raw) return DEFAULT_PREFS;

  try {
    const stored = JSON.parse(raw) as Partial<Record<keyof ProjectPrefs, unknown>>;
    if (!stored || typeof stored !== "object") return DEFAULT_PREFS;

    return {
      density: stored.density === "compact" ? "compact" : "comfortable",
      names: stored.names === "wrap" ? "wrap" : "truncate",
      cardStatus: stored.cardStatus !== false,
      cardPeople: stored.cardPeople !== false,
      cardKey: stored.cardKey === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

let cache: ProjectPrefs | null = null;

export function readStoredPrefs(): ProjectPrefs {
  if (cache) return cache;

  try {
    cache = parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    /* Storage throws outright in some privacy modes. */
    cache = DEFAULT_PREFS;
  }

  return cache;
}

/** Merges a patch into the stored object and tells every reader. */
export function setStoredPrefs(patch: Partial<ProjectPrefs>) {
  const next = { ...readStoredPrefs(), ...patch };
  cache = next;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Blocked or full. The change still applies for this page view — the
       event below is what actually re-renders the screens. */
  }

  window.dispatchEvent(new Event(PREFS_EVENT));
}

/** Back to the defaults, and the stored value removed rather than overwritten with them. */
export function resetStoredPrefs() {
  cache = DEFAULT_PREFS;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Same. Nothing to recover from — the value is already unreachable. */
  }

  window.dispatchEvent(new Event(PREFS_EVENT));
}

/** Whether anything has been changed from the defaults — what Reset is enabled by. */
export function prefsAreDefault(prefs: ProjectPrefs): boolean {
  return (Object.keys(DEFAULT_PREFS) as (keyof ProjectPrefs)[]).every(
    (field) => prefs[field] === DEFAULT_PREFS[field],
  );
}

/* --- useSyncExternalStore plumbing -------------------------------------- */

export function subscribeToPrefs(onChange: () => void) {
  /* The cache is dropped HERE rather than in the reader, because this is the
     only place that knows the stored value moved. */
  const handler = () => {
    cache = null;
    onChange();
  };

  window.addEventListener(PREFS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(PREFS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getPrefsServerSnapshot(): ProjectPrefs {
  return DEFAULT_PREFS;
}
