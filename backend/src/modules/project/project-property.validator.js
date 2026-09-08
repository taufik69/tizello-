/**
 * Joi schemas for property DEFINITIONS — request shape only. Whether the
 * caller may edit a workspace's schema is `requirePermission`'s job, and
 * whether a project's VALUE fits its type is
 * `shared/constants/propertyTypes.js`'s.
 *
 * `type` appears in create and in no update schema: it is immutable after
 * create, because changing TEXT to NUMBER has to answer what happens to every
 * project whose value is "about a week" (plan §2.3).
 *
 * `options` is validated as absent-or-empty for every type but SELECT and
 * MULTI_SELECT rather than ignored — a TEXT property carrying six colour
 * swatches nobody renders is a lie the next reader has to disprove (§2.6).
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/project-property.md
 */

import Joi from 'joi';

import { OPTION_TYPES, PROPERTY_TYPE_NAMES } from '../../shared/constants/propertyTypes.js';

const MAX_OPTIONS = 50;

const name = Joi.string().trim().min(1).max(60);

// `id` is client-supplied so a rename of `label` does not orphan every value
// that used it — the value stores the id, never the label.
const option = Joi.object({
  id: Joi.string().trim().min(1).max(40).required(),
  label: Joi.string().trim().min(1).max(60).required(),
  color: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

const options = Joi.array().items(option).max(MAX_OPTIONS).unique('id');

/*
 * `Joi.when` on the sibling `type` is what ties the two together. Written as a
 * schema rule rather than a service check because it is a relationship between
 * two fields of one request, which is shape.
 */
const createPropertySchema = Joi.object({
  name: name.required(),
  type: Joi.string()
    .valid(...PROPERTY_TYPE_NAMES)
    .required(),
  options: Joi.when('type', {
    is: Joi.valid(...OPTION_TYPES),
    then: options.default([]),
    otherwise: options.max(0).default(null).messages({
      'array.max': 'Only Select and Multi-select properties can have options',
    }),
  }),
});

/*
 * No `type` here (§2.3), and `.min(1)` rejects `{}` outright — an empty PATCH
 * is a caller mistake, not a no-op success. Same rule as every sibling module.
 *
 * `options` cannot be checked against `type` on an update, because `type` is
 * not in the request; the service compares it against the STORED type, which
 * is the only place that knows it.
 */
const updatePropertySchema = Joi.object({
  name: name.optional(),
  options: options.optional(),
  position: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

export { createPropertySchema, updatePropertySchema };
