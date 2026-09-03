"use client";

import { useId, useState } from "react";
import { InviteRoleChoice } from "@/components/members/invite-role-choice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { normaliseEmail, validateEmail } from "@/lib/validation/auth";
import type { InvitableRole } from "@/types/workspace";

/*
 * Modelled on `CreateEntityDialog`: same dialog anatomy, same client-side-only
 * validation, same reset-and-close on success. `validateEmail` is the shared
 * rule from `lib/validation/auth.ts` — a second address regex would drift.
 *
 * Nothing is sent. The parent turns a submit into a PENDING invitation and
 * switches to the Pending tab — nobody joins the roster until they accept; see
 * the note in `members-panel.tsx`.
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  workspaceName,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  onInvite: (email: string, role: InvitableRole) => void;
}) {
  const titleId = useId();
  const roleName = useId();
  const [role, setRole] = useState<InvitableRole>("MEMBER");
  const [error, setError] = useState<string | undefined>();

  function close() {
    setError(undefined);
    setRole("MEMBER");
    onOpenChange(false);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const entered = new FormData(form).get("email");
    const email = typeof entered === "string" ? entered : "";

    /* Empty and malformed are the same message on purpose — "Enter a valid
       email address" answers both without telling an attacker which. */
    const message = validateEmail(email);
    if (message) {
      setError(message);
      return;
    }

    onInvite(normaliseEmail(email), role);
    form.reset();
    close();
  }

  return (
    <Dialog open={open} onOpenChange={close} aria-labelledby={titleId}>
      {/* noValidate: the browser's bubble would pre-empt the inline error. */}
      <form onSubmit={onSubmit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>Invite member</DialogTitle>
            <DialogDescription>
              They will get an email inviting them to {workspaceName}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <TextField
              label="Email address"
              name="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="off"
              error={error}
              validate={validateEmail}
              /* A submit error outranks the field's own, so it has to be
                 cleared by hand once the user starts fixing it. */
              onValueChange={() => setError(undefined)}
            />

            <InviteRoleChoice name={roleName} value={role} onChange={setRole} />
          </div>

          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
