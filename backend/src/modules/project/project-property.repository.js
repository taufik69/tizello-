/**
 * Every Prisma call the property-definition module makes. No business rules —
 * the service decides what a request means; this file only knows how to read
 * and write the rows.
 *
 * There is no soft delete here, unlike `project.repository.js`. A definition
 * is workspace schema rather than user content: a "deleted but recoverable"
 * column would still have to be filtered out of every project response, which
 * is indistinguishable from being gone, and the values it described survive in
 * each project's Json either way (plan §2.4).
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/project-property.md
 */

import prisma from '../../config/db.js';

/** Sparse positions (10, 20, 30…) so a reorder is one UPDATE, not a renumber. */
const POSITION_STEP = 10;

const findPropertiesForWorkspace = (workspaceId) =>
  prisma.projectPropertyDef.findMany({
    where: { workspaceId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

const findProperty = (workspaceId, id) =>
  prisma.projectPropertyDef.findFirst({ where: { id, workspaceId } });

/**
 * Appends to the end of the workspace's list.
 *
 * The `max` and the insert are not in a transaction on purpose: two concurrent
 * creates landing on the same position produce a list whose order is decided by
 * the `createdAt` tiebreak in `findPropertiesForWorkspace`, which is a stable
 * and sensible answer. Serialising every property creation in a workspace to
 * avoid a cosmetic tie is the more expensive mistake.
 */
const createProperty = async (workspaceId, { name, type, options }) => {
  const last = await prisma.projectPropertyDef.aggregate({
    where: { workspaceId },
    _max: { position: true },
  });

  return prisma.projectPropertyDef.create({
    data: {
      workspaceId,
      name,
      type,
      options: options ?? null,
      position: (last._max.position ?? 0) + POSITION_STEP,
    },
  });
};

const updateProperty = (id, patch) =>
  prisma.projectPropertyDef.update({ where: { id }, data: patch });

const deleteProperty = (id) => prisma.projectPropertyDef.delete({ where: { id } });

export default {
  findPropertiesForWorkspace,
  findProperty,
  createProperty,
  updateProperty,
  deleteProperty,
};
