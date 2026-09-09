// Joi schemas for this module's request bodies and query strings. Validation
// only — "is this a well-formed request", not "is this allowed" (permission
// middleware) or "does this make sense" (service). Schemas are consumed by
// validate() in <module>.routes.js and never called directly.

import Joi from 'joi';

// Shared list-query contract: page/limit are coerced and defaulted here, so
// the repository can treat them as numbers without re-parsing.
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().min(1).max(200),
  sort: Joi.string().trim().max(50),
});

const create<Module>Schema = Joi.object({
  // TODO: the module's real create rules.
  name: Joi.string().trim().min(1).max(200).required(),
});

// `min(1)` makes an empty PATCH a 400 rather than a silent no-op that
// returns 200 and changes nothing.
const update<Module>Schema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
}).min(1);

export { listQuerySchema, create<Module>Schema, update<Module>Schema };
