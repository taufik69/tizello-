/**
 * HTTP edge of the property-definition module: read `req`, call the service,
 * respond via `ApiResponse`. No business logic, no Prisma, no `try/catch` —
 * `asyncHandler` at the routes layer forwards a rejection to the error
 * middleware.
 *
 * See .claude/skills/api-response/SKILL.md and docs/api/project-property.md
 */

import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import service from './project-property.service.js';

const list = async (req, res) => {
  const properties = await service.listProperties(req.params.workspaceId);

  return ApiResponse.success(res, httpStatus.OK, 'Properties fetched', { properties });
};

const create = async (req, res) => {
  const property = await service.createProperty(req.params.workspaceId, req.body);

  return ApiResponse.success(res, httpStatus.CREATED, 'Property created', { property });
};

const update = async (req, res) => {
  const property = await service.updateProperty(
    req.params.workspaceId,
    req.params.propertyId,
    req.body
  );

  return ApiResponse.success(res, httpStatus.OK, 'Property updated', { property });
};

const remove = async (req, res) => {
  await service.deleteProperty(req.params.workspaceId, req.params.propertyId);

  return ApiResponse.success(res, httpStatus.OK, 'Property deleted', null);
};

export default { list, create, update, remove };
