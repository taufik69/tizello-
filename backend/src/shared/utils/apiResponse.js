// Shared response helper. Builds the standard response shape
// { success, statusCode, message, data } so no controller — and not the
// centralized error middleware either — hand-rolls res.json(...) with an
// inline object.

class ApiResponse {
  // `extra` is an optional object merged as sibling top-level keys (e.g.
  // `{ fromCached: true }` on cached GET endpoints). Omit it and the call
  // site behaves exactly as before.
  static success(res, statusCode, message, data = null, extra = {}) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      ...extra,
    });
  }

  static error(res, statusCode, message, data = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data,
    });
  }

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
