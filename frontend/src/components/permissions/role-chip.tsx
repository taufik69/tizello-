import { Badge } from "@/components/ui/badge";
import type { RoleDefinition } from "@/types/permissions";

/**
 * A role's name as a chip, for any role — the three built-ins and whatever a
 * workspace has since defined. `RoleBadge` cannot do this: it is keyed on the
 * `WorkspaceRole` union, which a custom role is not a member of.
 *
 * Only ownership earns the brand tint; everything else reads quietly, or the
 * chips become the loudest thing on the screen.
 */
export function RoleChip({ role }: { role: RoleDefinition }) {
  return (
    <Badge variant={role.id === "OWNER" ? "brand" : "default"}>
      {role.name}
    </Badge>
  );
}
