import type { BlockingProject } from "@/lib/members";

/*
 * Copy for the member endpoints' error codes, as a plain module — the same
 * arrangement, for the same reason, as `invite-error-copy.ts`: every export of a
 * `"use server"` file becomes a server action, so a lookup table living beside
 * the actions would cost a network round-trip to read a constant.
 *
 * The API returns `data.code` and the UI supplies the words, so no
 * server-authored sentence ever reaches the page.
 *
 * **`VALIDATION_ERROR` is doing four jobs here, and the copy cannot tell them
 * apart.** `member.md` §2 and §3 answer `422 VALIDATION_ERROR` for all of: the
 * target is the owner, the target is you, the target is the last owner, and
 * `role: "OWNER"`. The distinguishing sentence is in the `message`, which this
 * app does not render by rule. That is survivable precisely because every one of
 * the four is already refused in the UI — the owner's controls are locked, your
 * own row's controls are locked, and OWNER is not selectable — so reaching this
 * code means something bypassed the client, and a generic sentence is the right
 * answer to that. Do not "fix" it by rendering `message`.
 */

const MEMBER_ERROR_COPY: Record<string, string> = {
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That member is no longer in this workspace.",
  VALIDATION_ERROR: "That change isn't allowed.",
  CONFLICT: "That member still owns projects here.",
  UNAUTHORIZED: "Your session expired. Sign in again.",
  TOKEN_EXPIRED: "Your session expired. Sign in again.",
  RATE_LIMITED: "Too many changes at once. Try again in a moment.",
  SERVER_ERROR: "Something went wrong. Try again.",
};

/** Falls back to the generic sentence, so an unmapped code still renders. */
export function memberErrorCopy(code: string): string {
  return MEMBER_ERROR_COPY[code] ?? MEMBER_ERROR_COPY.SERVER_ERROR;
}

/**
 * The `409`'s sentence, naming the projects that block the removal.
 *
 * Capped at three names. A member who owns eleven projects would otherwise
 * produce a toast nobody reads to the end, and the count carries the rest.
 */
export function removalBlockedCopy(
  memberName: string,
  projects: BlockingProject[],
): string {
  const names = projects.slice(0, 3).map((project) => project.name);
  const rest = projects.length - names.length;
  const list = rest > 0 ? `${names.join(", ")} and ${rest} more` : names.join(", ");

  return `${memberName} owns ${list}. Transfer or delete ${projects.length === 1 ? "it" : "them"} first.`;
}
