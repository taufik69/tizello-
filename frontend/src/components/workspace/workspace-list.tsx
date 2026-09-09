import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkspaceListRow } from "@/components/workspace/workspace-list-row";
import type { Workspace } from "@/types/workspace";

/**
 * Feature 2's list view — the same workspaces the grid draws, one per row.
 *
 * No create tile here, unlike `WorkspaceGrid`: a table's last row is a record,
 * not an action, and a "create" row that scrolls away with the data is a worse
 * affordance than the button the page header already carries in this view.
 *
 * The empty state is the table's own row rather than a separate component. A
 * table with a header and no body reads as broken, and the two ways to arrive
 * here — no workspaces at all, or none archived — need different sentences.
 */
export function WorkspaceList({
  workspaces,
  archived,
}: {
  workspaces: Workspace[];
  archived: boolean;
}) {
  return (
    <section className="mt-4 rounded-md border border-border bg-surface">
      <h2 className="sr-only">Your workspaces</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-3">Workspace</TableHead>
            <TableHead>Your role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {workspaces.length === 0 ? (
            <TableRow className="border-b-0">
              <TableCell colSpan={6} className="px-3 py-8 text-center text-sm text-text-muted">
                {archived
                  ? "Nothing archived. Archived workspaces show up here."
                  : "No workspaces yet. Create one to get started."}
              </TableCell>
            </TableRow>
          ) : (
            workspaces.map((workspace) => (
              <WorkspaceListRow key={workspace.id} workspace={workspace} />
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
