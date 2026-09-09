/**
 * Row → response shaping for property definitions. A whitelist, like every
 * other DTO here, so a column added to the model later cannot leak by default.
 *
 * `options` is normalised to `[]` for the two types that have them and `null`
 * for the seven that do not. A client can therefore branch on the type alone
 * rather than on the type AND whether the array happens to be present.
 *
 * See docs/api/project-property.md
 */

import { OPTION_TYPES } from '../../shared/constants/propertyTypes.js';

const toProperty = (row) => ({
  id: row.id,
  workspaceId: row.workspaceId,
  name: row.name,
  type: row.type,
  options: OPTION_TYPES.includes(row.type) ? (row.options ?? []) : null,
  position: row.position,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export { toProperty };
export default { toProperty };
