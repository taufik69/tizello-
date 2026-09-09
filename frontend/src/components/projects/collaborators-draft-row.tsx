"use client";

import { useRef, useState } from "react";
import { PropertyRow } from "@/components/projects/property-row";
import { PersonChip, PersonOption } from "@/components/projects/person-chip";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import type { WorkspaceMemberRow } from "@/lib/workspaces";

/**
 * The Collaborators row on the CREATE drawer.
 *
 * `CollaboratorsRow` next door writes immediately, because on an existing
 * project a collaborator is a row in another table and holding it behind Save
 * would mean a collaborator who exists only in a form. A project that does not
 * exist yet has the opposite problem: there is no `projectId` to post a member
 * to, so the picks are STAGED here and `CreateProjectDrawer` posts them the
 * moment `POST /projects` comes back with an id.
 *
 * That is two requests where one would be nicer, and it is what the API
 * offers: `POST /workspaces/:id/projects` takes no member list
 * (`backend/docs/api/project.md` §1), so the alternative is not sending them
 * at all. A failure to add someone is reported without failing the create —
 * the project exists by then, and rolling it back to undo one invite would
 * lose the rest of the form.
 *
 * The signed-in user is never offered: creating a project makes them its
 * OWNER, and `POST /members` answers `409` for the owner.
 */
const PANEL_HEIGHT = 300;

export function CollaboratorsDraftRow({
  workspaceMembers,
  currentUserId,
  selected,
  onChange,
}: {
  workspaceMembers: WorkspaceMemberRow[];
  currentUserId?: string;
  /** Staged user ids, in the order they were picked. */
  selected: string[];
  onChange: (userIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const position = useMenuPopover({
    open,
    triggerRef,
    panelRef,
    height: PANEL_HEIGHT,
    onDismiss: () => {
      setOpen(false);
      triggerRef.current?.focus();
    },
  });

  const pool = workspaceMembers.filter((member) => member.userId !== currentUserId);
  const available = pool.filter((member) => !selected.includes(member.userId));
  const nameOf = (userId: string) => {
    const member = pool.find((entry) => entry.userId === userId);
    return member?.user?.name ?? member?.user?.email ?? userId;
  };

  return (
    <PropertyRow label="Collaborators" icon="people">
      <div className="rounded-sm border border-transparent px-2.5 py-1.5 transition-colors duration-100 ease-standard hover:bg-surface-hover">
        <ul className="flex flex-wrap items-center gap-1.5">
          {selected.map((userId) => (
            <PersonChip
              key={userId}
              name={nameOf(userId)}
              onRemove={() => onChange(selected.filter((entry) => entry !== userId))}
            />
          ))}

          <li>
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              disabled={available.length === 0}
              onClick={() => setOpen((value) => !value)}
              className="rounded-xs px-1.5 py-0.5 text-2xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text disabled:opacity-50"
            >
              {selected.length === 0
                ? pool.length === 0
                  ? "Nobody else in this workspace yet"
                  : "Add someone"
                : "+ Add"}
            </button>
          </li>
        </ul>

        {/* Said once, up front, rather than as a surprise after Create: these
            are invites that go out when the project does. */}
        {selected.length > 0 && (
          <p className="mt-1 text-2xs text-text-subtle">
            Added to the project as soon as it is created. You will be its owner.
          </p>
        )}
      </div>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="menu"
          aria-label="Add a collaborator"
          className="fixed inset-auto m-0 max-h-72 w-64 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left }}
        >
          {available.map((member) => (
            <PersonOption
              key={member.userId}
              name={member.user?.name ?? member.user?.email ?? member.userId}
              onSelect={() => {
                onChange([...selected, member.userId]);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </PropertyRow>
  );
}
