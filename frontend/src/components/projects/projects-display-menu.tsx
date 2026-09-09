"use client";

import { useSyncExternalStore } from "react";
import {
  MenuAction,
  MenuChoice,
  MenuHeading,
} from "@/components/projects/menu-choice";
import { ToolbarMenu } from "@/components/projects/toolbar-menu";
import { SettingsIcon } from "@/components/ui/icons";
import {
  getPrefsServerSnapshot,
  prefsAreDefault,
  readStoredPrefs,
  resetStoredPrefs,
  setStoredPrefs,
  subscribeToPrefs,
} from "@/lib/project-prefs";
import {
  getSurfaceServerSnapshot,
  readStoredSurface,
  setStoredSurface,
  subscribeToSurface,
} from "@/lib/project-surface";

/**
 * The gear: every setting that is about THIS PERSON'S screen rather than about
 * which projects are on it.
 *
 * WHY THAT IS THE DIVIDING LINE. Everything that narrows the list lives in
 * Filter, Sort and Search, where it belongs in the URL and can be shared. What
 * is left is genuinely local — how tall a row is, what a long name does, what a
 * board card carries, where a form opens — and none of it should travel in a
 * pasted link. `project-prefs.ts` holds the four; `project-surface.ts` holds
 * the fifth, and stays separate because the create drawer reads it directly.
 *
 * EVERY ROW HERE DOES SOMETHING, which is the bar this menu had to clear
 * rather than a boast: it replaced a `LockedControl` whose whole content was a
 * tooltip explaining that it did not work. Row height and Project names are
 * two CSS rules over the tables; the three card toggles hide real elements on
 * the board; New project form moves the `<dialog>`. There is no row whose
 * effect is invisible.
 *
 * READ THROUGH `useSyncExternalStore`, NOT AN EFFECT. Both stores are also
 * written elsewhere — the surface by `SurfaceMenu` in the open drawer's header
 * — so this menu has to reflect a change it did not make. A subscription does
 * that; an effect reading storage on mount would show a stale value and trip
 * `react-hooks/set-state-in-effect` besides.
 *
 * THE MENU DOES NOT CLOSE ON A CHOICE, unlike Filter and Sort. Those navigate,
 * so the panel is over a changing list either way. These are toggles whose
 * effect is visible BEHIND the panel — flipping density and watching the rows
 * tighten is the point, and being thrown out to try the other option would be a
 * second trip for one decision.
 */
const PANEL_HEIGHT = 400;

export function ProjectsDisplayMenu() {
  const prefs = useSyncExternalStore(
    subscribeToPrefs,
    readStoredPrefs,
    getPrefsServerSnapshot,
  );
  const surface = useSyncExternalStore(
    subscribeToSurface,
    readStoredSurface,
    getSurfaceServerSnapshot,
  );

  const untouched = prefsAreDefault(prefs) && surface === "drawer";

  return (
    <ToolbarMenu
      icon={<SettingsIcon className="size-3.5" />}
      label="Project view settings"
      panelLabel="Project view settings"
      height={PANEL_HEIGHT}
      dot={!untouched}
    >
      <>
        <MenuHeading>Row height</MenuHeading>
        <MenuChoice
          label="Comfortable"
          selected={prefs.density === "comfortable"}
          onSelect={() => setStoredPrefs({ density: "comfortable" })}
        />
        <MenuChoice
          label="Compact"
          selected={prefs.density === "compact"}
          onSelect={() => setStoredPrefs({ density: "compact" })}
        />

        <MenuHeading>Long project names</MenuHeading>
        <MenuChoice
          label="Truncate to one line"
          selected={prefs.names === "truncate"}
          onSelect={() => setStoredPrefs({ names: "truncate" })}
        />
        <MenuChoice
          label="Wrap in full"
          selected={prefs.names === "wrap"}
          onSelect={() => setStoredPrefs({ names: "wrap" })}
        />

        <MenuHeading>Board cards</MenuHeading>
        <MenuChoice
          checkbox
          label="Status chip"
          selected={prefs.cardStatus}
          onSelect={() => setStoredPrefs({ cardStatus: !prefs.cardStatus })}
        />
        <MenuChoice
          checkbox
          label="Collaborators"
          selected={prefs.cardPeople}
          onSelect={() => setStoredPrefs({ cardPeople: !prefs.cardPeople })}
        />
        <MenuChoice
          checkbox
          label="Project key"
          selected={prefs.cardKey}
          onSelect={() => setStoredPrefs({ cardKey: !prefs.cardKey })}
        />

        <MenuHeading>New project form</MenuHeading>
        <MenuChoice
          label="Side panel"
          selected={surface === "drawer"}
          onSelect={() => setStoredSurface("drawer")}
        />
        <MenuChoice
          label="Centred"
          selected={surface === "modal"}
          onSelect={() => setStoredSurface("modal")}
        />

        <MenuAction
          label="Reset to defaults"
          disabled={untouched}
          onClick={() => {
            resetStoredPrefs();
            setStoredSurface("drawer");
          }}
        />
      </>
    </ToolbarMenu>
  );
}
