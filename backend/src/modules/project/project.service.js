/**
 * Project business rules. Throws `AppError` on failure; never touches
 * `req`/`res`/Prisma directly, so every function here is callable from a
 * controller or, later, another service.
 *
 * **Authorization is not this file's job.** `loadMembership`,
 * `requirePermission` and — for everything project-scoped —
 * `shared/middlewares/project.js` have already run by the time any function
 * below executes. This file trusts the project and membership it is handed and
 * does not re-derive or re-check a role.
 *
 * See .claude/plan/project.md and docs/api/project.md
 */

import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';
import { deriveKey } from '../../shared/utils/projectKey.js';
import repository from './project.repository.js';
import propertyRepository from './project-property.repository.js';
import propertyService from './project-property.service.js';
import dto from './project.dto.js';

const notFound = () =>
  new AppError(httpStatus.NOT_FOUND, 'Project not found', AUTH_CODES.NOT_FOUND);

/** The caller's effective role in a row the repository loaded with their membership. */
const viewerRoleFor = (row, userId) =>
  row.ownerId === userId ? 'OWNER' : (row.members?.[0]?.role ?? null);

/**
 * `POST /workspaces/:workspaceId/projects`.
 *
 * The two key paths are not the same operation and are deliberately not merged
 * (plan §2.2): a DERIVED key may be suffixed silently, because the server chose
 * it and a suffix is the expected behaviour; a SUPPLIED key that collides is a
 * `409`, because renaming what somebody typed is hostile.
 */
const createProject = async (payload, workspaceId, user) => {
  const { key: suppliedKey, properties, ...rest } = payload;

  /* Validated against the workspace's live definitions before the insert, so a
     create carrying a bad value fails without writing a project. */
  const merged = properties
    ? await propertyService.mergeProperties(workspaceId, {}, properties)
    : undefined;

  const data = {
    ...rest,
    ...(merged ? { properties: merged } : {}),
    description: rest.description ?? null,
    icon: rest.icon ?? null,
    color: rest.color ?? null,
    startDate: rest.startDate ?? null,
    endDate: rest.endDate ?? null,
    workspaceId,
    ownerId: user.id,
  };

  const definitions = await propertyRepository.findPropertiesForWorkspace(workspaceId);

  if (!suppliedKey) {
    const project = await repository.createProjectWithDerivedKey(data, deriveKey(data.name));
    return dto.toProject(project, 'OWNER', definitions);
  }

  try {
    const project = await repository.createProjectWithKey(data, suppliedKey);
    return dto.toProject(project, 'OWNER', definitions);
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new AppError(
        httpStatus.CONFLICT,
        `Key "${suppliedKey}" is already used by another project in this workspace`,
        AUTH_CODES.CONFLICT
      );
    }
    throw error;
  }
};

/** `GET /workspaces/:workspaceId/projects`. Scoped to the workspace the caller is a member of. */
const listProjects = async (workspaceId, userId, query) => {
  const { page, limit } = query;

  /* One definition query for the whole page, not one per row: every project in
     a workspace shares the same schema. */
  const [{ rows, total }, definitions] = await Promise.all([
    repository.findProjectsForWorkspace(workspaceId, userId, query),
    propertyRepository.findPropertiesForWorkspace(workspaceId),
  ]);

  const projects = rows.map((row) =>
    dto.toProject(row, viewerRoleFor(row, userId), definitions)
  );

  return { projects, page, limit, total };
};

/**
 * `GET /projects/:projectId`. `loadProject` already fetched the row and
 * resolved the caller's effective role, so this is shaping — there is no second
 * query to make and no membership left to check.
 */
const getProject = async (project, projectRole) => {
  const definitions = await propertyRepository.findPropertiesForWorkspace(project.workspaceId);

  return dto.toProject(project, projectRole, definitions);
};

/**
 * `PATCH /projects/:projectId`.
 *
 * The validator already rejected an empty body, already excluded `key`, and
 * already compared the two dates against each other. What it could not do is
 * compare a patch that moves ONE date against the one already stored — its
 * `Joi.ref` only sees the request — so that comparison lives here, where the
 * row is in hand.
 */
const updateProject = async (project, patch, projectRole) => {
  const { properties, ...columns } = patch;

  const startDate = 'startDate' in columns ? columns.startDate : project.startDate;
  const endDate = 'endDate' in columns ? columns.endDate : project.endDate;

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new AppError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'endDate cannot be before startDate',
      AUTH_CODES.VALIDATION_ERROR
    );
  }

  /* A partial map merged over the stored one — `null` on a key deletes it,
     which is what "remove this property row" sends. Validated against the
     workspace's live definitions, so a stale client gets a 422 rather than a
     silently discarded save. */
  const merged = properties
    ? await propertyService.mergeProperties(project.workspaceId, project.properties, properties)
    : undefined;

  const updated = await repository.updateProject(project.id, {
    ...columns,
    ...(merged ? { properties: merged } : {}),
  });

  const definitions = await propertyRepository.findPropertiesForWorkspace(project.workspaceId);

  return dto.toProject(updated, projectRole, definitions);
};

/**
 * `PATCH /projects/:projectId/archive`. Reversible, both directions through
 * the same endpoint.
 *
 * Archiving deliberately does NOT touch `status`: they are independent axes,
 * which is exactly why `ProjectStatus` has no ARCHIVED member (plan §2.1).
 * Writing one from the other would reintroduce the ambiguity the enum was
 * trimmed to avoid.
 */
const setArchived = async (project, isArchived, projectRole) => {
  const updated = await repository.setArchived(project.id, isArchived);
  const definitions = await propertyRepository.findPropertiesForWorkspace(project.workspaceId);

  return dto.toProject(updated, projectRole, definitions);
};

/**
 * `DELETE /projects/:projectId`. Soft: sets `deletedAt`, never a hard delete,
 * and never touches `ProjectMember` rows — a purge policy is an open question
 * in docs/api/project.md, not something this endpoint decides.
 *
 * A second delete of the same project is a `404`, not an idempotent `200`:
 * every read in the repository filters `deletedAt: null`, so the row is gone
 * as far as this API is concerned, and `loadProject` returns 404 before this
 * ever runs.
 */
const deleteProject = (project) => repository.softDeleteProject(project.id);

const conflict = (message) => new AppError(httpStatus.CONFLICT, message, AUTH_CODES.CONFLICT);

const unprocessable = (message) =>
  new AppError(httpStatus.UNPROCESSABLE_ENTITY, message, AUTH_CODES.VALIDATION_ERROR);

/**
 * Ownership moves through `transferOwnership` and nowhere else (plan §2.4), so
 * both member-mutating endpoints refuse to touch the owner. The validator
 * already blocks `OWNER` as an incoming *value*; this blocks the owner as a
 * *target*, which is the other half of the same rule.
 */
const rejectIfOwner = (project, userId) => {
  if (project.ownerId === userId) {
    throw conflict('Ownership changes go through the transfer endpoint');
  }
};

/** `GET /projects/:projectId/members`. */
const listMembers = async (projectId, { page, limit }) => {
  const { rows, total } = await repository.findProjectMembers(projectId, { page, limit });

  return { members: rows.map(dto.toProjectMember), page, limit, total };
};

/**
 * `POST /projects/:projectId/members`.
 *
 * The workspace check is not a nicety: a project member with no membership in
 * the project's workspace cannot reach the project at all — `loadProject`
 * 404s them — so the row would describe access that does not exist.
 */
const addMember = async (project, { userId, role }) => {
  const membership = await repository.findWorkspaceMembership(project.workspaceId, userId);

  if (!membership) {
    throw unprocessable('That user is not a member of this workspace');
  }

  try {
    const member = await repository.addProjectMember(project.id, userId, role);
    return dto.toProjectMember(member);
  } catch (error) {
    if (error?.code === 'P2002') throw conflict('That user is already on this project');
    throw error;
  }
};

/** `PATCH /projects/:projectId/members/:userId`. */
const updateMemberRole = async (project, userId, role) => {
  rejectIfOwner(project, userId);

  const existing = await repository.findProjectMember(project.id, userId);
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Project member not found', AUTH_CODES.NOT_FOUND);

  const member = await repository.updateProjectMemberRole(project.id, userId, role);

  return dto.toProjectMember(member);
};

/**
 * `DELETE /projects/:projectId/members/:userId`.
 *
 * Removing yourself as a plain member is allowed; removing yourself as the
 * owner is the `rejectIfOwner` case above — a project with no owner is not a
 * state this API can produce.
 */
const removeMember = async (project, userId) => {
  rejectIfOwner(project, userId);

  const existing = await repository.findProjectMember(project.id, userId);
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Project member not found', AUTH_CODES.NOT_FOUND);

  await repository.removeProjectMember(project.id, userId);
};

/**
 * `PATCH /projects/:projectId/transfer-ownership`.
 *
 * `requireProjectOwner` at the route already proved the caller may do this, so
 * there is no role check here — only the two things about the TARGET that the
 * middleware cannot know.
 */
const transferOwnership = async (project, toUserId, projectRole) => {
  if (project.ownerId === toUserId) {
    throw unprocessable('That user already owns this project');
  }

  const membership = await repository.findWorkspaceMembership(project.workspaceId, toUserId);
  if (!membership) {
    throw unprocessable('That user is not a member of this workspace');
  }

  const updated = await repository.transferOwnership(project.id, project.ownerId, toUserId);
  const definitions = await propertyRepository.findPropertiesForWorkspace(project.workspaceId);

  return dto.toProject(updated, projectRole, definitions);
};

export default {
  notFound,
  viewerRoleFor,
  createProject,
  listProjects,
  getProject,
  updateProject,
  setArchived,
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  transferOwnership,
};
