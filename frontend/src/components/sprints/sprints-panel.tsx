"use client";

import { useState } from "react";
import { DeleteSprintDialog } from "@/components/sprints/delete-sprint-dialog";
import { SprintDialog } from "@/components/sprints/sprint-dialog";
import { SprintGroup } from "@/components/sprints/sprint-group";
import {
  SprintTransitionDialog,
  type SprintTransition,
} from "@/components/sprints/sprint-transition-dialog";
import { SprintsEmpty } from "@/components/sprints/sprints-empty";
import { SprintsToolbar } from "@/components/sprints/sprints-toolbar";
import {
  completeSprint,
  emptyDraft,
  removeSprint,
  sprintFromDraft,
  startSprint,
  upsertSprint,
} from "@/lib/sprint-edit";
import {
  activeSprint,
  groupByState,
  nextSprintId,
  nextSprintName,
} from "@/lib/sprint-groups";
import type { SprintDraft, SprintRecord } from "@/types/sprint";

/*
 * The interactive half of the sprints screen. The page above stays a Server
 * Component and hands the fetched list down as props; this leaf owns what a
 * static tree cannot: the list as edited, and which sprint each dialog is open
 * on.
 *
 * NOTHING PERSISTS. There is no API and no Server Action behind any of this —
 * every change lives in `useState` and is gone on refresh. When the real
 * endpoints land, each handler becomes an action call plus a revalidate;
 * `lib/sprint-edit.ts` is already the payload builder.
 *
 * `editorKey` remounts `SprintDialog` on every open, which is how the draft is
 * seeded without an effect syncing props into state. It changes only while the
 * dialog is closed, so the close path keeps one instance alive and the browser
 * still restores focus to whatever opened it.
 */
export function SprintsPanel({
  sprints: initial,
  today,
}: {
  sprints: SprintRecord[];
  /** The app's pinned today. See the note in `demo-projects.ts`. */
  today: string;
}) {
  const [sprints, setSprints] = useState(initial);
  const [editing, setEditing] = useState<SprintRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [transition, setTransition] = useState<SprintTransition>("START");
  const [pending, setPending] = useState<SprintRecord | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<SprintRecord | null>(
    null,
  );

  const active = activeSprint(sprints);
  const groups = groupByState(sprints);

  function openEditor(sprint: SprintRecord | null) {
    setEditing(sprint);
    setEditorKey((key) => key + 1);
    setEditorOpen(true);
  }

  function confirmTransition(sprint: SprintRecord, kind: SprintTransition) {
    setTransition(kind);
    setPending(sprint);
  }

  function save(draft: SprintDraft) {
    /* Editing keeps the id — it is on screen and printed in the accessible
       name of the card's menu. Creating takes the next in sequence. */
    const id = editing?.id ?? nextSprintId(sprints);
    setSprints((current) =>
      upsertSprint(current, sprintFromDraft(draft, { id, base: editing })),
    );
  }

  function applyTransition() {
    const id = pending?.id ?? "";
    /* Both helpers refuse a transition the sprint is not eligible for, so this
       cannot produce two active sprints even if the menu let it through. */
    setSprints((current) =>
      transition === "START" ? startSprint(current, id) : completeSprint(current, id),
    );
    setPending(null);
  }

  return (
    <section>
      <SprintsToolbar
        count={sprints.length}
        activeName={active?.name}
        onNewSprint={() => openEditor(null)}
      />

      {groups.length === 0 ? (
        <SprintsEmpty />
      ) : (
        groups.map((group) => (
          <SprintGroup
            key={group.state}
            state={group.state}
            sprints={group.sprints}
            today={today}
            active={active}
            onEdit={openEditor}
            onStart={(sprint) => confirmTransition(sprint, "START")}
            onComplete={(sprint) => confirmTransition(sprint, "COMPLETE")}
            onDelete={setPendingDeletion}
          />
        ))
      )}

      <SprintTransitionDialog
        sprint={pending}
        transition={transition}
        onOpenChange={() => setPending(null)}
        onConfirm={applyTransition}
      />

      <DeleteSprintDialog
        sprint={pendingDeletion}
        onOpenChange={() => setPendingDeletion(null)}
        onConfirm={() => {
          setSprints((current) => removeSprint(current, pendingDeletion?.id ?? ""));
          setPendingDeletion(null);
        }}
      />

      <SprintDialog
        key={editorKey}
        open={editorOpen}
        sprint={editing}
        blankDraft={emptyDraft(nextSprintName(sprints), today)}
        onOpenChange={setEditorOpen}
        onSave={save}
      />
    </section>
  );
}
