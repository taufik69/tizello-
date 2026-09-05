// Shapes validated request bodies into internal payloads, and Prisma rows
// into client-facing responses. The response mappers are what keep internal
// columns (password hashes, soft-delete flags, internal notes) from leaking
// just because someone added a column — a field reaches the client only if
// it is listed here.

// Builds the internal "create" payload from a validated request body.
const toCreatePayload = (body, user) => {
  const payload = {
    // TODO: map the module's real create fields.
    name: body.name,
  };

  if (user?.id) payload.createdById = user.id;

  return payload;
};

// Builds the internal "update" payload. Only fields explicitly present in
// the body are included, so a PATCH stays partial — copying every field
// unconditionally would null out anything the caller omitted.
const toUpdatePayload = (body) => {
  const payload = {};

  // TODO: map the module's real updatable fields.
  if (body.name !== undefined) payload.name = body.name;

  return payload;
};

// Shapes one Prisma row into the client-facing response.
const toResponse = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    // TODO: list the fields the client is meant to see.
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const toResponseList = (rows) => (rows ?? []).map(toResponse);

export { toCreatePayload, toUpdatePayload, toResponse, toResponseList };
