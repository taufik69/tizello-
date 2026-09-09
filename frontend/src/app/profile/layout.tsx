import { AppShell } from "@/components/layout/app-shell";

/**
 * Wraps `/profile` — and its `loading` and `error` states — in the app shell,
 * the same way `workspaces/layout.tsx` wraps that section. The page below
 * renders page content only and does not know the sidebar exists.
 */
export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return <AppShell>{children}</AppShell>;
}
