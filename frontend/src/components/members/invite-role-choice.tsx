"use client";

import { INVITABLE_ROLES, type InvitableRole } from "@/types/workspace";

/*
 * A segmented control built on real radios rather than a div-with-onClick:
 * grouping, arrow-key navigation, Home/End and the announcement of "2 of 2"
 * all come from the browser, and there is no roving tabindex to get wrong.
 *
 * The input is `sr-only`, so the base layer's focus ring would land on a
 * hidden box. `peer-focus-visible` forwards that same 2px ring to the visible
 * segment — the one focus treatment, relocated, not a second one.
 */
const SEGMENT =
  "cursor-pointer rounded-xs px-2.5 py-1 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-checked:bg-brand-500 peer-checked:font-semibold peer-checked:text-on-brand hover:bg-surface-hover hover:text-text peer-checked:hover:bg-brand-500 peer-checked:hover:text-on-brand";

const COPY: Record<InvitableRole, { label: string; hint: string }> = {
  ADMIN: {
    label: "Admin",
    hint: "Can invite people, change roles and manage every project.",
  },
  MEMBER: {
    label: "Member",
    hint: "Can work on projects, but not change who has access.",
  },
};

export function InviteRoleChoice({
  name,
  value,
  onChange,
}: {
  /** The radio group's form name, so the three parts share one selection. */
  name: string;
  value: InvitableRole;
  onChange: (role: InvitableRole) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-text-muted">Role</legend>

      <div className="mt-1 inline-flex rounded-sm border border-border bg-surface p-0.5">
        {INVITABLE_ROLES.map((role) => (
          <label key={role} className="inline-flex">
            <input
              type="radio"
              name={name}
              value={role}
              checked={value === role}
              onChange={() => onChange(role)}
              className="peer sr-only"
            />
            <span className={SEGMENT}>{COPY[role].label}</span>
          </label>
        ))}
      </div>

      {/* Owner is absent on purpose: ownership is transferred, never invited. */}
      <p className="mt-1.5 text-2xs text-text-subtle">{COPY[value].hint}</p>
    </fieldset>
  );
}
