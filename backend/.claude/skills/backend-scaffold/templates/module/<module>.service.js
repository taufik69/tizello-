// Business logic for the <module> module. Calls the repository, applies the
// rules, composes DTOs. Never touches req/res, never calls Prisma directly.
// Throws AppError for known failure cases and lets the centralized error
// middleware turn them into responses.

import <module>Repository from './<module>.repository.js';
import { toCreatePayload, toUpdatePayload, toResponse, toResponseList } from './<module>.dto.js';
import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';

const list = async ({ page, limit, search, sort }) => {
  const { rows, total } = await <module>Repository.findMany({ page, limit, search, sort });
  return { data: toResponseList(rows), total };
};

const getById = async (id) => {
  const row = await <module>Repository.findById(id);

  if (!row) {
    throw new AppError(httpStatus.NOT_FOUND, '<Module> not found');
  }

  return toResponse(row);
};

const create = async (body, user) => {
  // TODO: business rules for creating a <module> — uniqueness beyond the DB
  // constraint, cross-entity checks, derived fields, side effects (queue a
  // job, bump a cache namespace).
  const payload = toCreatePayload(body, user);
  const row = await <module>Repository.create(payload);
  return toResponse(row);
};

const update = async (id, body, user) => {
  const existing = await <module>Repository.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, '<Module> not found');
  }

  // TODO: business rules for updating a <module> — which fields are
  // immutable, which transitions are legal, who may make them.
  const payload = toUpdatePayload(body, user);
  const row = await <module>Repository.update(id, payload);
  return toResponse(row);
};

const remove = async (id) => {
  const existing = await <module>Repository.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, '<Module> not found');
  }

  // TODO: cascade/cleanup rules — related rows, queued jobs, cached entries.
  await <module>Repository.remove(id);
  return { id };
};

export default { list, getById, create, update, remove };
