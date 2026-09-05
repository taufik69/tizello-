/**
 * <module> service — business logic ONLY.
 *
 * Calls the repository, applies the module's rules, composes DTOs, and
 * throws AppError for every expected failure. It never sees `req` or `res`
 * and must never be given them: the moment a service can send a response, it
 * can no longer be called from a worker, a script, or another service, and
 * the same failure gets shaped two different ways.
 *
 * Throw AppError, not a generic Error. A generic Error is treated as a bug by
 * the global handler and becomes a 500 — correct for a bug, wrong for "that
 * task doesn't exist".
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and docs/api/<module>.md
 */

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
  // constraint, cross-entity checks, derived fields, side effects (enqueue a
  // job, bump a cache namespace). Document the non-obvious ones in
  // docs/api/<module>.md, not just here.
  const payload = toCreatePayload(body, user);
  const row = await <module>Repository.create(payload);
  return toResponse(row);
};

const update = async (id, body, user) => {
  const existing = await <module>Repository.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, '<Module> not found');
  }

  // TODO: which fields are immutable, which state transitions are legal, and
  // who may make them.
  const payload = toUpdatePayload(body, user);
  const row = await <module>Repository.update(id, payload);
  return toResponse(row);
};

const remove = async (id) => {
  const existing = await <module>Repository.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, '<Module> not found');
  }

  // TODO: cascade and cleanup rules — related rows, queued jobs, cached
  // entries.
  await <module>Repository.remove(id);
  return { id };
};

export default { list, getById, create, update, remove };
