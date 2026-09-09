/**
 * Wraps an async route handler so a rejected promise is forwarded to
 * next(err) instead of being swallowed.
 *
 * This is what makes "no try/catch in controllers" a real rule rather than an
 * aspiration: an unwrapped async controller that throws produces an
 * unhandled rejection and a request that hangs until the client times out —
 * the error never reaches the global handler, so nothing is logged and
 * nothing is returned.
 *
 * Every async controller in every module goes through this, wired at the
 * routes layer: asyncHandler(<module>Controller.list).
 *
 * See .claude/skills/module-consistency/SKILL.md
 *
 * Lands at: src/shared/utils/asyncHandler.js
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler };
export default asyncHandler;
