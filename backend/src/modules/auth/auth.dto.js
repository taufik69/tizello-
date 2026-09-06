/**
 * Row → response shaping for the auth module. The only place a `User` row is
 * allowed to become JSON.
 *
 * `toUser` is a whitelist, not a blacklist — it names the five fields that may
 * leave, rather than deleting the ones that may not. A `delete row.passwordHash`
 * approach leaks every column added to the model afterwards, silently, in the
 * commit that adds it. This shape mirrors `User` in `frontend/src/types/auth.ts`.
 *
 * Note what `emailVerifiedAt` becomes: a boolean. The *timestamp* is an internal
 * fact worth keeping for audit; a client only ever branches on whether it is
 * set, and shipping the raw value tells anyone who can read a response exactly
 * when an account was proved — a detail with no client use and a small
 * fingerprinting value.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/auth.md
 */

const toUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  emailVerified: row.emailVerifiedAt !== null && row.emailVerifiedAt !== undefined,
  createdAt: row.createdAt,
});

export default { toUser };
export { toUser };
