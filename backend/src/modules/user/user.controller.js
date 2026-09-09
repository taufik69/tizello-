/**
 * HTTP edge of the user module. No business logic — it reads the authenticated
 * id off the request, hands the body to the service, and formats the result.
 *
 * `req.user.id` rather than anything from the path or the body: `authGuard` put
 * it there from a verified token, so it is the one identity in the request that
 * a client cannot choose. Every route here is `/me`.
 *
 * See .claude/skills/api-response/SKILL.md and docs/api/user.md
 */

import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import service from './user.service.js';

const me = async (req, res) => {
  const { profile } = await service.getProfile({ userId: req.user.id });

  return ApiResponse.success(res, httpStatus.OK, 'Profile', { profile });
};

const updateMe = async (req, res) => {
  const { profile } = await service.updateProfile({
    userId: req.user.id,
    input: req.body,
    /* Carries the request id, which is the only thing tying the "failed to
       delete replaced avatar" line to the request that produced it. */
    log: req.log,
  });

  return ApiResponse.success(res, httpStatus.OK, 'Profile updated', { profile });
};

export default { me, updateMe };
export { me, updateMe };
