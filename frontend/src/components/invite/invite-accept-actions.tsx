"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTH_BUTTON } from "@/components/auth/auth-submit";

/*
 * Accept and decline, for someone who is already signed in.
 *
 * NEITHER SENDS ANYTHING. There is no membership endpoint and no Server Action
 * behind this screen; both buttons swap the block for a plain confirmation so
 * the click has a visible result. When `POST /invitations/:token/accept` lands,
 * accept becomes one action call and a redirect, and decline becomes a second.
 *
 * `AUTH_BUTTON` is the established full-width treatment on these screens, so
 * the primary is that string on a real `<button>` rather than a restyled
 * `Button`. There is no form here, so it is `type="button"`, not a submit.
 */
const DECLINE =
  "h-10 w-full rounded-sm border border-border bg-surface text-sm font-semibold text-text transition-colors duration-100 ease-standard hover:bg-surface-hover";

const UNDO =
  "rounded-xs text-2xs font-medium text-text-subtle underline-offset-4 transition-colors duration-100 ease-standard hover:text-text-muted hover:underline";

export function InviteAcceptActions({
  accountEmail,
  workspaceId,
  workspaceName,
}: {
  accountEmail: string;
  workspaceId: string;
  workspaceName: string;
}) {
  const [state, setState] = useState<"idle" | "accepted" | "declined">("idle");

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
      <div className="mt-6 space-y-4">
        <p className="text-sm text-text-muted">
          Invitation declined. {workspaceName} will not appear in your
          workspaces, and nobody there is told.
        </p>
        <button type="button" onClick={() => setState("idle")} className={UNDO}>
          Changed your mind? Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={() => setState("accepted")}
        className={AUTH_BUTTON}
      >
        Accept Invitation
      </button>

      <button
        type="button"
        onClick={() => setState("declined")}
        className={DECLINE}
      >
        Decline
      </button>

      {/* Which account this lands on. Accepting into the wrong one is the
          mistake this screen exists to prevent. */}
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
