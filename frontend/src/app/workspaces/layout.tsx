import { AppShell } from "@/components/layout/app-shell";

/**
 * Wraps `/workspaces` and `/workspaces/[workspaceId]` — and their `loading`,
 * `error` and `not-found` states — in the app shell. The pages below render
 * page content only; none of them knows the sidebar exists.
 */
export default function WorkspacesLayout({ children }: LayoutProps<"/workspaces">) {
  return <AppShell>{children}</AppShell>;
}
