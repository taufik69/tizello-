/**
 * <module> validators — Joi schemas for this module's bodies and query
 * strings.
 *
 * Validation answers "is this a well-formed request", nothing more. It is not
 * "is this allowed" (that is permission middleware) and not "does this make
 * sense for the domain" (that is the service).
 *
 * NORMALIZATION HAPPENS HERE. Schemas coerce and clean — trim, lowercase,
 * cast numeric strings, strip a country prefix — and validate() writes the
 * cleaned value back onto req[target]. So every layer below this file sees
 * exactly one form of every value, and a service never has to wonder whether
 * an email arrived uppercased. A value that cannot be normalized is a 400,
 * never a silent lookup miss further down.
 *
 * These schemas are consumed by validate() in <module>.routes.js and are
 * never called directly.
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and docs/api/<module>.md
 */

import Joi from 'joi';

/**
 * Shared list-query contract. page/limit are coerced and defaulted here so
 * the repository can treat them as numbers without re-parsing.
 */
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().min(1).max(200),
  sort: Joi.string().trim().max(50),
});

const create<Module>Schema = Joi.object({
  // TODO: the module's real create rules. Note `.trim()` — the normalized
  // value is what gets written back to req.body and stored.
  name: Joi.string().trim().min(1).max(200).required(),
});

/**
 * `.min(1)` makes an empty PATCH a 400 rather than a silent no-op that
 * answers 200 and changes nothing.
 */
const update<Module>Schema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
}).min(1);

export { listQuerySchema, create<Module>Schema, update<Module>Schema };
