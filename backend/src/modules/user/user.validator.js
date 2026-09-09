/**
 * Joi schemas for the user module — request **shape** only.
 *
 * Three shapes here are load-bearing, and each one is a rule that cannot be
 * enforced anywhere cheaper:
 *
 * **1. `email` is absent, and its absence is the point.** The schema forbids
 * unknown keys, so a body carrying `email` is refused rather than ignored.
 * Changing an address is not a profile edit: it is the login identity, the
 * binding an invitation is checked against, and the thing `emailVerifiedAt`
 * refers to — silently dropping the field would let a client believe it had
 * succeeded. Same for `emailVerifiedAt`, `passwordHash` and `id`.
 *
 * **2. `avatarUrl` must be a path this server wrote.** It arrives from the
 * client, which got it from `POST /api/v1/uploads` — so it is client input, and
 * an unconstrained string here would let anyone store `https://evil.example/x`
 * (rendered by every member who sees this profile, leaking their IP and turning
 * a profile field into a tracking pixel) or `/uploads/../../etc/passwd`. The
 * pattern admits exactly what `shared/middlewares/upload.js` generates, and
 * only the image extensions from its allowlist — an avatar that is a `.pdf` or
 * a `.zip` renders as a broken image everywhere it appears.
 *
 * **3. Every field is nullable.** `null` clears; omitted leaves alone. Without
 * an explicit null a user could set a nickname and never remove it, and
 * "clear this" would need its own endpoint.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/user.md
 */

import Joi from 'joi';

/**
 * `/uploads/<uuid>.<ext>` for the image types only — the shape
 * `upload.service.js`'s `toUploadedFile` returns, narrowed to what can be
 * displayed as a picture.
 */
const AVATAR_PATH = /^\/uploads\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i;

// Nullable rather than optional-only: `null` is how a field is cleared, and
// `.allow(null)` is what lets it through a schema that would otherwise reject
// it as the wrong type. `.trim()` before the length check, so "   " is empty
// rather than three characters.
const name = Joi.string().trim().min(1).max(80).allow(null);

const nickname = Joi.string().trim().min(1).max(40).allow(null);

/**
 * Deliberately permissive: digits, spaces, and the `+ - ( ) .` a person writes
 * a number with. This is a display field the app never dials, so a strict E.164
 * rule would reject correctly-written local numbers (a Bangladeshi `01712-…`,
 * an extension) to buy a guarantee nothing here needs.
 */
const phone = Joi.string()
  .trim()
  .pattern(/^[0-9+\-() .]{4,32}$/)
  .message('Enter a phone number using digits and + - ( ) . only')
  .allow(null);

const avatarUrl = Joi.string()
  .trim()
  .pattern(AVATAR_PATH)
  .message('Upload the image through this app before saving it')
  .allow(null);

/**
 * `min(1)` on the object: an empty body is a request that means nothing, and
 * answering `200` to it implies a write that did not happen.
 */
const updateProfileSchema = Joi.object({
  name,
  nickname,
  phone,
  avatarUrl,
})
  .min(1)
  .messages({ 'object.min': 'Send at least one field to update' });

export { updateProfileSchema, AVATAR_PATH };
export default { updateProfileSchema };
