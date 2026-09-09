"use client";

import { useSyncExternalStore } from "react";
import {
  getPrefsServerSnapshot,
  readStoredPrefs,
  subscribeToPrefs,
} from "@/lib/project-prefs";

/**
 * Stamps every layout preference onto one wrapper, so the views inside can
 * stay server-rendered.
 *
 * THE PREFERENCES ARE CLIENT-ONLY AND THE ROWS ARE NOT. They live in
 * `localStorage` (`project-prefs.ts` says why), which only a Client Component
 * can read — but the table rows are `<tr>`s built on the server from server
 * data, and converting five views' worth of them into client components to
 * change a padding would ship the whole table to the browser for 4px.
 *
 * So this leaf reads the preferences and writes ATTRIBUTES; the layout itself
 * is a handful of CSS rules in `globals.css` keyed on them. The rows stay
 * server-rendered and know nothing about it, and `children` crosses the
 * boundary untouched — a Client Component can render server-rendered children
 * it never sees the source of.
 *
 * BOOLEANS ARE WRITTEN AS `"on"` / `"off"`, not as the attribute's presence.
 * `data-card-status={false}` renders nothing at all in React, so an "off"
 * preference and a wrapper that never got the prop would look identical in the
 * DOM — and the CSS has to match the OFF state, which is the one that hides
 * something. Every attribute is always present and always says which mode it
 * is in.
 */
export function ProjectsPrefsScope({ children }: { children: React.ReactNode }) {
  const prefs = useSyncExternalStore(
    subscribeToPrefs,
    readStoredPrefs,
    getPrefsServerSnapshot,
  );

  return (
    <div
      data-density={prefs.density}
      data-names={prefs.names}
      data-card-status={prefs.cardStatus ? "on" : "off"}
      data-card-people={prefs.cardPeople ? "on" : "off"}
      data-card-key={prefs.cardKey ? "on" : "off"}
    >
      {children}
    </div>
  );
}
