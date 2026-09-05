import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/roles";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * The current user's standing in a workspace. Only ownership earns the brand
 * tint — an "Member" chip on every other card would be noise, so it renders
 * quietly in the default variant.
 */
export function RoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <Badge variant={role === "OWNER" ? "brand" : "default"}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}
