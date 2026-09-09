"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AUTH_BUTTON } from "@/components/auth/auth-submit";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/lib/actions/invitation-actions";
import { inviteErrorCopy } from "@/lib/invite-error-copy";
import { toast } from "sonner";

/*
 * Accept and decline, for someone who is already signed in.
 *
 * Both call Server Actions now. Two things about that are worth stating,
 * because they are the parts a reader would otherwise "fix":
 *
 * 1. **Accepting is idempotent on the API** — a second accept returns `200`
 *    with the same membership, not a conflict. So a double-click needs no
 *    guard beyond the disabled state, and there is no "already accepted"
 *    branch to render: success covers both.
 * 2. **Declining does not undo.** The local "changed your mind" affordance that
 *    used to sit under the declined state is gone: `declinedAt` is terminal
 *    server-side and the link 404s immediately afterwards, so offering a way
 *    back would promise something the API will refuse.
 *
 * `AUTH_BUTTON` is the established full-width treatment on these screens, so
 * the primary is that string on a real `<button>` rather than a restyled
 * `Button`. There is no form here, so it is `type="button"`, not a submit.
 */
const DECLINE =
  "h-10 w-full rounded-sm border border-border bg-surface text-sm font-semibold text-text transition-colors duration-100 ease-standard hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-60";

export function InviteAcceptActions({
  token,
  accountEmail,
  workspaceId,
  workspaceName,
}: {
  token: string;
  accountEmail: string;
  workspaceId: string;
  workspaceName: string;
}) {
  const [state, setState] = useState<"idle" | "accepted" | "declined">("idle");
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);

      if (!result.ok) {
        toast.error(inviteErrorCopy(result.code));
        return;
      }

      setState("accepted");
      toast.success("You have joined " + workspaceName + ".");
    });
  }

  function decline() {
    startTransition(async () => {
      const result = await declineInvitationAction(token);

      if (!result.ok) {
        toast.error(inviteErrorCopy(result.code));
        return;
      }

      setState("declined");
    });
  }

  if (state === "accepted") {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-text-muted">
          You have joined {workspaceName}. It is in your workspace list now.
        </p>
        <Link
          href={`/workspaces/${workspaceId}`}
          /* `truncate px-4`: the label carries a workspace name, and a long
             one would otherwise wrap out of a fixed 40px button. */
          className={`${AUTH_BUTTON} flex items-center justify-center truncate px-4`}
        >
          Go to {workspaceName}
        </Link>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div className="mt-6">
        <p className="text-sm text-text-muted">
          Invitation declined. {workspaceName} will not appear in your
          workspaces, and nobody there is told.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={accept}
        disabled={isPending}
        className={AUTH_BUTTON}
      >
        {isPending ? "Working…" : "Accept Invitation"}
      </button>

      <button
        type="button"
        onClick={decline}
        disabled={isPending}
        className={DECLINE}
      >
        Decline
      </button>

      {/* Which account this lands on. Accepting into the wrong one is the
          mistake this screen exists to prevent — and the API enforces it too,
          refusing with INVITE_EMAIL_MISMATCH if the addresses differ. */}
      <p className="text-center text-2xs text-text-subtle">
        Accepting as {accountEmail}.{" "}
        <Link
          href="/sign-in"
          className="rounded-xs font-semibold text-text-brand underline-offset-4 hover:underline"
        >
          Use a different account
        </Link>
      </p>
    </div>
  );
}
