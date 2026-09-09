/**
 * <module> controller — HTTP translation ONLY.
 *
 * Reads what it needs off `req`, calls the service, hands the result to
 * ApiResponse. That is the entire job. It holds no business rules, touches no
 * database, and contains no try/catch: asyncHandler (wired in
 * <module>.routes.js) forwards any rejection to the global error handler,
 * which owns every failure response in the app.
 *
 * If you find yourself writing an `if` here that decides something about the
 * domain, it belongs in <module>.service.js.
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and .claude/skills/api-response/SKILL.md
 *      and docs/api/<module>.md
 */

import <module>Service from './<module>.service.js';
import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';

const list = async (req, res) => {
  const { page, limit, search, sort } = req.query;

  const { data, total } = await <module>Service.list({ page, limit, search, sort });

  return ApiResponse.paginated(
    res,
    httpStatus.OK,
    '<Module>s fetched successfully',
    data,
    page,
    limit,
    total
  );
};

const getById = async (req, res) => {
  // No not-found check here — the service throws AppError(404) and the global
  // handler shapes it. Deciding it in both places means two shapes to keep in
  // sync, and only one of them gets updated.
  const <module> = await <module>Service.getById(req.params.id);
  return ApiResponse.success(res, httpStatus.OK, '<Module> fetched successfully', <module>);
};

const create = async (req, res) => {
  const <module> = await <module>Service.create(req.body, req.user);
  return ApiResponse.success(res, httpStatus.CREATED, '<Module> created successfully', <module>);
};

const update = async (req, res) => {
  const <module> = await <module>Service.update(req.params.id, req.body, req.user);
  return ApiResponse.success(res, httpStatus.OK, '<Module> updated successfully', <module>);
};

const remove = async (req, res) => {
  const result = await <module>Service.remove(req.params.id, req.user);
  return ApiResponse.success(res, httpStatus.OK, '<Module> deleted successfully', result);
};

export default { list, getById, create, update, remove };
