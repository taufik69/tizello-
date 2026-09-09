/**
 * Joi schemas for the workspace module — request **shape** only. Whether a
 * workspace exists, whether the caller may act on it: that is the service's
 * and the permission middleware's job, not this file's.
 *
 * `slug` appears in no schema here — it is server-generated
 * (`shared/utils/slug.js`) and immutable. A client cannot set or change it
 * by construction, not by convention.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/workspace.md
 */

import Joi from 'joi';

const name = Joi.string().trim().min(2).max(80);
const description = Joi.string().trim().max(500).allow(null);
const icon = Joi.string().trim().max(8).allow(null);
const color = Joi.string()
  .pattern(/^#[0-9a-fA-F]{6}$/)
  .allow(null);

const createWorkspaceSchema = Joi.object({
  name: name.required(),
  description: description.optional(),
  icon: icon.optional(),
  color: color.optional(),
});

// `.min(1)` at the object level rejects `{}` outright — an empty PATCH is a
// caller mistake, not a no-op success (docs/api/workspace.md §4).
const updateWorkspaceSchema = Joi.object({
  name: name.optional(),
  description: description.optional(),
  icon: icon.optional(),
  color: color.optional(),
  settings: Joi.object().unknown(true).optional(),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

const archiveWorkspaceSchema = Joi.object({
  isArchived: Joi.boolean().required(),
});

const listWorkspacesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  includeArchived: Joi.boolean().default(false),
});

export {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  archiveWorkspaceSchema,
  listWorkspacesQuerySchema,
};
