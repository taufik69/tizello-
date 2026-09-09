/**
 * Every Prisma call the project module makes. No business rules live here —
 * the service decides what a request means; this file only knows how to read
 * and write the rows.
 *
 * `deletedAt: null` is unconditional on every read below. There is no flag to
 * see a soft-deleted project through this repository — the same rule
 * `workspace.repository.js` states, for the same reason: an `includeDeleted`
 * parameter that only one future purge job should ever pass `true` is a
 * parameter every other caller can pass by accident.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/project.md
 */

import prisma from '../../config/db.js';
import { withUniqueKey } from '../../shared/utils/projectKey.js';

// Loaded with every project the caller can act on: the caller's own
// ProjectMember row (so the service can read their role without a second
// query) and nothing else. `members: { where: { userId } }` returns an array of
// at most one — the compound unique guarantees it.
const withViewerMembership = (userId) => ({
  members: { where: { userId } },
});

/**
 * The transaction both create paths share: the project, plus its OWNER
 * `ProjectMember` row. A project whose `ownerId` has no matching OWNER member
 * row is an invariant violation, never a valid intermediate state (plan §2.4),
 * so the two writes commit together or not at all.
 */
const insertProject = (data, key) =>
  prisma.$transaction(async (tx) => {
    const project = await tx.project.create({ data: { ...data, key } });

    await tx.projectMember.create({
      data: { projectId: project.id, userId: data.ownerId, role: 'OWNER' },
    });

    return project;
  });

/**
 * Create with a key the CLIENT supplied. No retry: a `P2002` propagates to the
 * service, which turns it into a `409`. Silently renaming a value somebody
 * typed is the behaviour plan §2.2 rejects.
 */
const createProjectWithKey = (data, key) => insertProject(data, key);

/**
 * Create with a key DERIVED from the name. Here the suffix retry is expected
 * behaviour rather than a surprise, so `withUniqueKey` wraps the whole
 * transaction — not just the project insert. A `P2002` has to roll the member
 * insert back too, or a retried attempt leaves an orphaned row pointing at a
 * project that was never created. `createWorkspaceWithOwner` documents the same
 * trap.
 */
const createProjectWithDerivedKey = (data, base) =>
  withUniqueKey(base, (key) => insertProject(data, key));

/** One project, with the caller's own membership row attached. Never a soft-deleted row. */
const findProjectForViewer = (id, userId) =>
  prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: withViewerMembership(userId),
  });

/**
 * Every project in a workspace, newest first, paginated. `deletedAt` is
 * excluded unconditionally; `isArchived` only when `includeArchived` is false.
 *
 * `q` searches name AND key because a key is what people actually type — "TIZ"
 * has to find the project even though the word appears nowhere in its name.
 * `mine` is owner-or-member, not owner alone: a collaborator's "my projects"
 * that omits the projects they collaborate on is answering a different
 * question.
 */
const findProjectsForWorkspace = async (
  workspaceId,
  userId,
  { page, limit, status, priority, includeArchived, q, mine }
) => {
  const where = {
    workspaceId,
    deletedAt: null,
    ...(includeArchived ? {} : { isArchived: false }),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(mine ? { AND: [{ OR: [{ ownerId: userId }, { members: { some: { userId } } }] }] } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: withViewerMembership(userId),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { rows, total };
};

const updateProject = (id, patch) => prisma.project.update({ where: { id }, data: patch });

const setArchived = (id, isArchived) =>
  prisma.project.update({ where: { id }, data: { isArchived } });

// Never touches ProjectMember rows — a real purge policy is tracked as an open
// question in docs/api/project.md, not implemented here.
const softDeleteProject = (id) =>
  prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

const findProjectMember = (projectId, userId) =>
  prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });

/**
 * The project's roster, owner first. `user` is selected down to three fields —
 * a member list must never be a route to `passwordHash` or `emailVerifiedAt`,
 * and a `select` is what guarantees that at the query rather than trusting the
 * DTO to remember.
 *
 * Ordered by `role` then `createdAt`: the enum is declared OWNER, MANAGER,
 * COLLABORATOR, and Postgres orders an enum by declaration order, so this is
 * most-privileged first without a CASE expression.
 */
const findProjectMembers = async (projectId, { page, limit }) => {
  const where = { projectId };

  const [rows, total] = await Promise.all([
    prisma.projectMember.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.projectMember.count({ where }),
  ]);

  return { rows, total };
};

const addProjectMember = (projectId, userId, role) =>
  prisma.projectMember.create({
    data: { projectId, userId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

const updateProjectMemberRole = (projectId, userId, role) =>
  prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

const removeProjectMember = (projectId, userId) =>
  prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });

/** Is this user in the workspace at all? The guard behind adding a project member. */
const findWorkspaceMembership = (workspaceId, userId) =>
  prisma.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } });

/**
 * Moves ownership in ONE transaction: the column, the new owner's member row,
 * and the old owner's demotion.
 *
 * Three writes, one commit, and that is the whole point. Between any two of
 * them the project has an `ownerId` whose member row says something else —
 * precisely the invariant violation plan §2.4 exists to prevent. `upsert` on
 * the incoming side because the new owner may or may not already be a member.
 */
const transferOwnership = (projectId, fromUserId, toUserId) =>
  prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: projectId },
      data: { ownerId: toUserId },
    });

    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: toUserId } },
      update: { role: 'OWNER' },
      create: { projectId, userId: toUserId, role: 'OWNER' },
    });

    // The outgoing owner keeps write access rather than silently losing all
    // of it — an ex-owner dropped to nothing is a support ticket, not a
    // feature. `upsert` guards the case where the mirror row is somehow
    // missing.
    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: fromUserId } },
      update: { role: 'MANAGER' },
      create: { projectId, userId: fromUserId, role: 'MANAGER' },
    });

    return project;
  });

export default {
  createProjectWithKey,
  createProjectWithDerivedKey,
  findProjectForViewer,
  findProjectsForWorkspace,
  updateProject,
  setArchived,
  softDeleteProject,
  findProjectMember,
  findProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  findWorkspaceMembership,
  transferOwnership,
};
