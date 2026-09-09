"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { CreateProjectDrawer } from "@/components/projects/create-project-drawer";
import { STATUS_ADD } from "@/components/projects/project-tone";
import type { ProjectScope } from "@/components/projects/project-properties";
import { cn } from "@/lib/cn";
import type { ProjectStatus } from "@/types/project";

/*
 * The `+ New project` affordance that closes every group and every board
 * column.
 *
 * It works now — it opens the same drawer the toolbar's New button does, and
 * `status` is what makes the difference: adding from the "On hold" column
 * should produce an ON_HOLD project, not a PLANNING one somebody then has to
 * drag. That is the whole reason this is a separate trigger rather than five
 * copies of the toolbar button.
 *
 * `label` names the group it sits in, so five of these on one screen are five
 * distinct accessible names rather than five "New project"s.
 *
 * THE DOTTED OUTLINE IS THE POINT. This used to be borderless text that only
 * appeared on hover, which made the one control that creates anything the
 * quietest thing in a column — you had to already know it was there. A dotted
 * box is the standard "there is room for one more here" affordance (Trello's
 * add-a-card, Linear's, Notion's), and it says the same thing at rest that a
 * dashed drop target says mid-drag: this space is waiting for something.
 *
 * DOTTED, NOT DASHED, and that is a distinction this screen needs rather than
 * a taste call. `project-board-column.tsx` already spends dashed borders on
 * two live states — the empty column's placeholder and the lit drop target —
 * so a third dashed box directly beneath them would read as another one of
 * those. A dotted edge is recognisably a different kind of thing.
 *
 * THE EDGE CARRIES THE COLUMN'S OWN HUE, softly — `STATUS_ADD` in
 * `project-tone.ts` owns the six pairs and says why. It used to firm up to
 * `brand-500` on hover, one mint accent in every column regardless of which
 * column it was; a soft amber box under the On hold column says what it will
 * make, which is the thing this control was missing. Neutral is the fallback
 * for the timeline, which groups by phase and has no status to seed.
 *
 * CENTRED, unlike the left-aligned text it replaces. Once it has an edge it is
 * a box rather than a row, and a box's label sits in the middle of it — which
 * also holds at all three widths this lands in: the 272px board column, the
 * 256px table cap, and the 208px timeline lane.
 *
 * No `focus:` rule here. The 2px ring is set once on `:focus-visible` in the
 * base layer and one focus treatment is the house rule.
 */
const BASE =
  "group flex w-full items-center justify-center gap-1.5 rounded-md border border-dotted px-2 py-2 text-xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:text-text";

/** No status to seed — the timeline's lanes are phases. */
const NEUTRAL = "border-border hover:border-border-strong hover:bg-surface-hover";

/* `transition-transform` and not `transition-all`: the icon sits inside a box
   whose own border and background are already animating, and a blanket
   transition would put this element's layout properties on the clock too. The
   colour is inherited now that the box carries the column's hue. */
const ICON =
  "size-3.5 transition-transform duration-100 ease-standard group-hover:scale-110";

export function NewProjectTrigger({
  label,
  scope,
  status,
  className,
}: {
  label: string;
  scope: ProjectScope;
  /** Seeds the drawer's Status, so a project added to a column lands in it. */
  status?: ProjectStatus;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className={cn(BASE, status ? STATUS_ADD[status] : NEUTRAL, className)}
      >
        <PlusIcon className={ICON} />
        New project
      </button>

      <CreateProjectDrawer
        scope={scope}
        initialStatus={status}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
