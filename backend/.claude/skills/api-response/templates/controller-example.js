/**
 * Reference controller — how the ApiResponse / AppError contract looks in
 * practice. Copy the SHAPE, not the file: a real controller lives at
 * src/modules/<module>/<module>.controller.js.
 *
 * A controller is a translation layer and nothing else: read `req`, call the
 * service, hand the result to ApiResponse. It has no business rules, no Prisma
 * access, and no try/catch — asyncHandler (wired in the routes file) forwards
 * a rejected promise to the error middleware, which owns every failure
 * response in the app.
 *
 * Note what is absent below: no `res.json(...)`, no status-code arithmetic, no
 * error shaping. That absence is the convention.
 *
 * See .claude/skills/api-response/SKILL.md
 */

import taskService from './task.service.js';
import ApiResponse from '../../shared/utils/apiResponse.js';
import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';

/**
 * GET /api/v1/tasks — a page of results, so ApiResponse.paginated.
 *
 * `total` comes from the service as the count of ALL matching rows; the helper
 * derives totalPages from it. `fromCached` is passed through `extra`, landing
 * as a sibling top-level key rather than inside `data`.
 */
const list = async (req, res) => {
  const { page, limit, search, sort } = req.query;

  const { data, total, fromCached } = await taskService.list({ page, limit, search, sort });

  return ApiResponse.paginated(res, httpStatus.OK, 'Tasks fetched successfully', data, page, limit, total, {
    fromCached,
  });
};

/**
 * GET /api/v1/tasks/:id — a single resource, so ApiResponse.success with 200.
 *
 * The not-found case is NOT handled here: taskService.getById throws
 * AppError(404) and the error middleware turns it into the standard envelope.
 * A `if (!task) return res.status(404)...` here would be the same decision made
 * in two places, in two shapes.
 */
const getById = async (req, res) => {
  const task = await taskService.getById(req.params.id);
  return ApiResponse.success(res, httpStatus.OK, 'Task fetched successfully', task);
};

/**
 * POST /api/v1/tasks — a resource was created, so 201, not 200.
 */
const create = async (req, res) => {
  const task = await taskService.create(req.body, req.user);
  return ApiResponse.success(res, httpStatus.CREATED, 'Task created successfully', task);
};

/**
 * The rare case where a controller throws: a precondition that is genuinely
 * about the HTTP request rather than the domain — here, a file that Multer
 * puts on `req.file`, which never reaches the service or a Joi body schema.
 * Anything that needs domain knowledge to decide belongs in the service.
 */
const importFromFile = async (req, res) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Validation failed', [
      { field: 'file', message: 'An import file is required' },
    ]);
  }

  const result = await taskService.importFromFile(req.file, req.user);
  return ApiResponse.success(res, httpStatus.CREATED, 'Tasks imported successfully', result);
};

export default { list, getById, create, importFromFile };
