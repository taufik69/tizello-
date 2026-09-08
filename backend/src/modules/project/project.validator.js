/**
 * Joi schemas for the project module — request **shape** only. Whether a
 * project exists, and whether the caller may act on it, is the service's and
 * `shared/middlewares/project.js`'s job, not this file's.
 *
 * Two rules here that look like business logic but are not:
 *
 * - `endDate` must not precede `startDate`. That is a relationship between two
 *   fields of one request, which is shape — putting it in the service means
 *   every caller of that service re-checks it.
 * - `role` on the member schemas accepts MANAGER and COLLABORATOR only.
 *   Ownership moves through the transfer endpoint alone (plan §2.4), so OWNER
 *   is not a value any request may carry.
 *
 * `key` appears in create and in no update schema: it is immutable after
 * create, because every task id already written into a commit message or a
 * bookmark carries it (plan §2.2).
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/project.md
 */

import Joi from 'joi';

const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'BACKLOG',
  'COMPLETED',
  'CANCELLED',
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
// OWNER is absent on purpose — see the header.
const ASSIGNABLE_PROJECT_ROLES = ['MANAGER', 'COLLABORATOR'];

const name = Joi.string().trim().min(2).max(100);
// Uppercase alphanumeric, 2-5, first character a letter. Matched here rather
// than uppercased for the caller: a key is displayed on every task, and
// quietly rewriting what someone typed is the same hostility as suffixing it.
const key = Joi.string()
  .trim()
  .pattern(/^[A-Z][A-Z0-9]{1,4}$/)
  .messages({
    'string.pattern.base':
      'Key must be 2-5 characters, uppercase letters and digits, starting with a letter',
  });
const description = Joi.string().trim().max(2000).allow(null);
const status = Joi.string().valid(...PROJECT_STATUSES);
const priority = Joi.string().valid(...PRIORITIES);
const icon = Joi.string().trim().max(8).allow(null);
const color = Joi.string()
  .pattern(/^#[0-9a-fA-F]{6}$/)
  .allow(null);
const startDate = Joi.date().iso().allow(null);
// The `min(ref)` version, for CREATE only. `Joi.ref` resolves against the
// request, and on a create both dates are always in it — either both sent, or
// `startDate` absent and this rule inert.
const createEndDate = Joi.date()
  .iso()
  .min(Joi.ref('startDate'))
  .allow(null)
  .messages({ 'date.min': 'endDate cannot be before startDate' });
// The PATCH version carries no ref at all. With one, `{"endDate": "…"}` — a
// perfectly legal patch that moves only the end — fails with
// `"endDate" date references "ref:startDate" which must have a valid date
// format`, because the ref resolves to undefined. The comparison a patch
// actually needs is against the STORED row, which only the service can see, so
// it lives there in full rather than half here and half there.
const patchEndDate = Joi.date().iso().allow(null);

const createProjectSchema = Joi.object({
  name: name.required(),
  key: key.optional(),
  description: description.optional(),
  status: status.default('PLANNING'),
  priority: priority.default('MEDIUM'),
  icon: icon.optional(),
  color: color.optional(),
  startDate: startDate.optional(),
  endDate: createEndDate.optional(),
});

// `.min(1)` at the object level rejects `{}` outright — an empty PATCH is a
// caller mistake, not a no-op success. Same rule as the workspace module.
//
// No date comparison here at all — see `patchEndDate` above. Every
// start-vs-end check on a PATCH is the service's, because only it can see the
// half of the pair that is already stored.
const updateProjectSchema = Joi.object({
  name: name.optional(),
  description: description.optional(),
  status: status.optional(),
  priority: priority.optional(),
  icon: icon.optional(),
  color: color.optional(),
  startDate: startDate.optional(),
  endDate: patchEndDate.optional(),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

const archiveProjectSchema = Joi.object({
  isArchived: Joi.boolean().required(),
});

const listProjectsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: status.optional(),
  priority: priority.optional(),
  includeArchived: Joi.boolean().default(false),
  q: Joi.string().trim().max(100).optional(),
  mine: Joi.boolean().default(false),
});

const addProjectMemberSchema = Joi.object({
  userId: Joi.string().trim().required(),
  role: Joi.string()
    .valid(...ASSIGNABLE_PROJECT_ROLES)
    .default('COLLABORATOR'),
});

const updateProjectMemberSchema = Joi.object({
  role: Joi.string()
    .valid(...ASSIGNABLE_PROJECT_ROLES)
    .required(),
});

const listMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const transferOwnershipSchema = Joi.object({
  userId: Joi.string().trim().required(),
});

export {
  createProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  listProjectsQuerySchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  listMembersQuerySchema,
  transferOwnershipSchema,
};
