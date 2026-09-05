// Every Prisma query for the <module> module lives here. No business logic,
// no AppError, no req/res — this layer answers "what rows", not "what should
// happen". It is the only file in the module allowed to import prisma.

import prisma from '../../config/db.js';

// Builds the Prisma `where` clause from parsed list-query params.
const buildWhere = ({ search }) => {
  const where = {};

  if (search !== undefined) {
    // TODO: point this at the module's real searchable column(s).
    where.name = { contains: search, mode: 'insensitive' };
  }

  return where;
};

// Translates the `sort` query param into a Prisma orderBy. A leading `-`
// means descending (e.g. `-createdAt`), matching common REST convention.
// Defaults to newest first.
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
