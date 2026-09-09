/**
 * Every Prisma call the user module makes. No business rules — the service
 * decides what a request means; this file only knows how to read and write the
 * row.
 *
 * There is no `select` here, unlike `member.repository.js`: these two functions
 * only ever load the caller's OWN row, and `user.dto.js` is what decides what
 * leaves. A `select` would still be the safer habit, but it would also have to
 * be kept in step with the DTO by hand, and the DTO is the whitelist that the
 * controller actually returns through.
 *
 * See docs/api/user.md and .claude/skills/module-consistency/SKILL.md
 */

import prisma from '../../config/db.js';

const findById = (id) => prisma.user.findUnique({ where: { id } });

/**
 * Applies a partial update.
 *
 * `data` is built by the service from the validated body, never passed through
 * from the request: a raw body here would let a caller write `passwordHash` or
 * `emailVerifiedAt` — mass assignment, on the one table where it is worst.
 */
const update = (id, data) => prisma.user.update({ where: { id }, data });

export default { findById, update };
export { findById, update };
