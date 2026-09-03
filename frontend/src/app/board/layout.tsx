import { AppShell } from "@/components/layout/app-shell";

/**
 * The same shell as `/workspaces`, applied to every board route. The board
 * keeps its own horizontal scroll inside the content column; this layout adds
 * no clipping of its own.
 */
export default function BoardLayout({ children }: LayoutProps<"/board">) {
  return <AppShell>{children}</AppShell>;
}
