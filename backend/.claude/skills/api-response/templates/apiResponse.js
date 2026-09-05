/**
 * Shared response helper — the ONLY place in the app that builds a response
 * body. Every controller, and the centralized error middleware, send through
 * these three methods so the envelope is identical on every endpoint:
 *
 *   { success, statusCode, message, data }
 *
 * The point is not brevity, it is that a client can parse one shape. A single
 * hand-rolled `res.json({ ... })` somewhere makes that false for the whole API,
 * which is why calling res.json directly is a review-stopper.
 *
 * See .claude/skills/api-response/SKILL.md
 *
 * Lands at: src/shared/utils/apiResponse.js
 */

class ApiResponse {
  /**
   * 2xx responses carrying a single resource (or null).
   *
   * `extra` is an optional object merged as sibling TOP-LEVEL keys — not
   * nested under `data` — e.g. `{ fromCached: true }` on cache-pattern GET
   * endpoints. Omitting it leaves every existing call site byte-identical,
   * which is what makes it safe to add to one endpoint without touching the
   * rest.
   */
  static success(res, statusCode, message, data = null, extra = {}) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      ...extra,
    });
  }

  /**
   * Failure responses. Called almost exclusively by the centralized error
   * middleware — a controller that calls this directly is usually a service
   * that should have thrown AppError instead.
   *
   * `data` carries structured detail (e.g. the { field, message } pairs from
   * validation), never a stack trace or a raw driver error.
   */
  static error(res, statusCode, message, data = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data,
    });
  }

  /**
   * List endpoints. Identical to success() plus a `pagination` block, so a
   * client can tell a page of results from a single resource by shape alone
   * rather than by knowing which URL it called.
   *
   * `total` is the count of ALL matching rows, not the length of `data` —
   * totalPages is derived from it.
   */
  static paginated(res, statusCode, message, data, page, limit, total, extra = {}) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...extra,
    });
  }
}

export { ApiResponse };
export default ApiResponse;
