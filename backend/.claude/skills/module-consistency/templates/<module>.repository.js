/**
 * <module> repository — ALL database access for this module, and nothing
 * else.
 *
 * This is the only file in the module allowed to import `prisma`. It answers
 * "which rows", never "what should happen": no AppError, no HTTP status
 * codes, no req/res, no business rules. A `null` from here is a fact, and it
 * is the service's job to decide that a missing row means 404.
 *
 * Keeping every query behind this boundary is what makes a module's data
 * access reviewable in one file, and what stops a controller from quietly
 * growing a Prisma call.
 *
 * See .claude/skills/module-consistency/SKILL.md
 */

import prisma from '../../config/db.js';

/** Builds the Prisma `where` clause from parsed list-query params. */
const buildWhere = ({ search }) => {
  const where = {};

  if (search !== undefined) {
    // TODO: point this at the module's real searchable column(s).
    where.name = { contains: search, mode: 'insensitive' };
  }

  return where;
};

/**
 * Translates the `sort` query param into a Prisma orderBy. A leading `-`
 * means descending (`-createdAt`), matching common REST convention. Defaults
 * to newest first so list order is never left to the database.
 */
const buildOrderBy = (sort) => {
  if (!sort) return { createdAt: 'desc' };

  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.startsWith('-') ? sort.slice(1) : sort;

  return { [field]: direction };
};

const findMany = async ({ page = 1, limit = 20, search, sort }) => {
  const where = buildWhere({ search });

  // One round trip for both the page and its count — running them
  // sequentially doubles the latency of every list endpoint.
  const [rows, total] = await Promise.all([
    prisma.<module>.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.<module>.count({ where }),
  ]);

  return { rows, total };
};

const findById = (id) => prisma.<module>.findUnique({ where: { id } });

const create = (data) => prisma.<module>.create({ data });

const update = (id, data) => prisma.<module>.update({ where: { id }, data });

const remove = (id) => prisma.<module>.delete({ where: { id } });

export default { findMany, findById, create, update, remove };
