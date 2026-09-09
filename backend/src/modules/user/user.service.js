/**
 * Profile business rules — the account's own name, nickname, phone and avatar.
 *
 * **The caller can only ever act on themselves.** There is no `userId`
 * parameter anywhere below that is not `req.user.id`: every route is
 * `/api/v1/users/me`, so there is no id in a path to get wrong, no admin
 * override to gate, and no way to address another row. An "edit any user"
 * capability would need a permission model this app does not have — workspace
 * roles govern workspaces, not accounts.
 *
 * **What is NOT here is deliberate.** Email is not editable: it is the login
 * identity, the address an invitation is bound to, and the subject of
 * `emailVerifiedAt`. Changing it means re-proving the new address while the old
 * one stays live until that succeeds — a flow with its own tokens and its own
 * failure states, not a field on this form. The validator refuses the key
 * rather than dropping it, so a client is told.
 *
 * See docs/api/user.md
 */

import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';
import uploadService from '../upload/upload.service.js';
import repository from './user.repository.js';
import dto from './user.dto.js';

const notFound = () =>
  new AppError(httpStatus.NOT_FOUND, 'Account not found', AUTH_CODES.NOT_FOUND);

const getProfile = async ({ userId }) => {
  const user = await repository.findById(userId);

  // Reachable: `authGuard` proves the token, not that the row still exists. A
  // session outliving its user — deleted account, restored database — must not
  // become a 500 on a page load.
  if (!user) throw notFound();

  return { profile: dto.toProfile(user) };
};

/**
 * Applies a partial update.
 *
 * The write set is rebuilt field by field from the validated body rather than
 * spread from it. Two reasons, and the second is the one that bites:
 *
 * 1. The body cannot introduce a column the schema did not name — mass
 *    assignment on the one table where it is worst.
 * 2. **`undefined` and `null` mean different things.** An omitted field must
 *    leave the stored value alone; an explicit `null` must clear it. Prisma
 *    already treats `undefined` as "no change", so passing the body through
 *    would work — until a caller sends `{"nickname": undefined}` as JSON, which
 *    is not expressible, or a future refactor swaps in `?? null` and silently
 *    turns every partial update into a full overwrite.
 */
const FIELDS = ['name', 'nickname', 'phone', 'avatarUrl'];

/**
 * Deletes the file a replaced avatar pointed at.
 *
 * `docs/api/upload.md` lists orphan collection as an open question, and for a
 * project's `FILES` property it genuinely is: the metadata lives inside a
 * project's JSON, so proving no row still references a file means scanning
 * every project on every write. **An avatar is not that case.** It is one
 * column on one row, the previous value is in hand before the update, and
 * exactly one user could have referenced it — so the proof is free, and
 * skipping it would leave a dead file on disk for every photo anyone ever
 * changes.
 *
 * Best-effort and deliberately silent. The write has already committed by the
 * time this runs; failing the request now would report an error for something
 * that succeeded, and the worst case of a missed unlink is one orphaned file —
 * the state the whole system is in today.
 *
 * `removeStored` re-validates the name against the shape the upload middleware
 * generates and throws a 404 for anything else, so a hand-written `avatarUrl`
 * that got past the validator still cannot point `unlink` somewhere else.
 */
const removeReplacedAvatar = async (previousUrl, nextUrl, log) => {
  if (!previousUrl || previousUrl === nextUrl) return;

  try {
    await uploadService.removeStored(previousUrl.replace(/^\/uploads\//, ''));
  } catch (error) {
    log?.warn?.({ err: error, avatarUrl: previousUrl }, 'failed to delete replaced avatar');
  }
};

const updateProfile = async ({ userId, input, log }) => {
  const data = {};

  for (const field of FIELDS) {
    if (Object.hasOwn(input, field)) data[field] = input[field];
  }

  // The validator's `.min(1)` already refuses an empty body; this covers a
  // caller reaching the service directly — from a script or a worker — which is
  // the same reason `invitation.service.js` re-checks the OWNER role.
  if (Object.keys(data).length === 0) {
    throw new AppError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'Send at least one field to update',
      AUTH_CODES.VALIDATION_ERROR
    );
  }

  const user = await repository.findById(userId);
  if (!user) throw notFound();

  const updated = await repository.update(userId, data);

  // After the write, not before: a failed update must not have deleted the
  // photo the row still points at.
  if (Object.hasOwn(data, 'avatarUrl')) {
    await removeReplacedAvatar(user.avatarUrl, updated.avatarUrl, log);
  }

  return { profile: dto.toProfile(updated) };
};

export default { getProfile, updateProfile };
export { getProfile, updateProfile };
