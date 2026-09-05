/**
 * <module> DTOs — shaping in both directions.
 *
 * Inbound: a validated request body becomes the internal payload the
 * repository writes. Outbound: a Prisma row becomes the client-facing
 * response.
 *
 * The outbound mappers are the reason a new column does not silently become
 * a public API field. A field reaches the client only if it is listed here,
 * so password hashes, soft-delete flags and internal notes stay internal by
 * default rather than by remembering.
 *
 * No validation here (that is <module>.validator.js) and no database access
 * (that is <module>.repository.js).
 *
 * See .claude/skills/module-consistency/SKILL.md
 */

/** Builds the internal "create" payload from a validated request body. */
const toCreatePayload = (body, user) => {
  const payload = {
    // TODO: map the module's real create fields.
    name: body.name,
  };

  if (user?.id) payload.createdById = user.id;

  return payload;
};

/**
 * Builds the internal "update" payload. Only fields explicitly present in the
 * body are included, so a PATCH stays partial — copying every field
 * unconditionally would null out whatever the caller omitted.
 */
const toUpdatePayload = (body) => {
  const payload = {};

  // TODO: map the module's real updatable fields.
  if (body.name !== undefined) payload.name = body.name;

  return payload;
};

/** Shapes one Prisma row into the client-facing response. */
const toResponse = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    // TODO: list the fields the client is meant to see — and only those.
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const toResponseList = (rows) => (rows ?? []).map(toResponse);

export { toCreatePayload, toUpdatePayload, toResponse, toResponseList };
