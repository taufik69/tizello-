// Thin HTTP translation layer: read req, call the service, send res through
// ApiResponse. No Prisma access and no business logic — if a rule needs
// deciding, it belongs in <module>.service.js.

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
