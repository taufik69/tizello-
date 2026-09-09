/**
 * The user module's response shapes.
 *
 * `toProfile` is a whitelist, not a blacklist — it names the fields that may
 * leave, rather than deleting the ones that may not. A `delete row.passwordHash`
 * approach leaks every column added to the model afterwards, silently, in the
 * commit that adds it. Same rule `auth.dto.js` states, and this file is its
 * superset: everything `toUser` returns, plus the three profile fields.
 *
 * **The two are deliberately NOT merged.** `toUser` is the session shape — the
 * five fields every authenticated response carries — and widening it would put
 * a phone number into every sign-in, refresh and session response. A profile is
 * read on one screen; it does not belong in the payload the whole app carries.
 *
 * `emailVerified` becomes a boolean here for the same reason it does in
 * `auth.dto.js`: a client only ever branches on whether it is set, and the raw
 * timestamp says exactly when an account was proved, which has no client use.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/user.md
 */

const toProfile = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  nickname: row.nickname,
  phone: row.phone,
  avatarUrl: row.avatarUrl,
  emailVerified: row.emailVerifiedAt !== null && row.emailVerifiedAt !== undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export default { toProfile };
export { toProfile };
