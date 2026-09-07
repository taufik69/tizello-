import { AccountMenuTrigger } from "@/components/layout/account-menu-trigger";
import { getSession } from "@/lib/auth";

/**
 * Replaces `SidebarAccount`, which pinned this to the sidebar's bottom edge —
 * now it sits in `ContentStrip`, beside `ThemeToggle`, per the reference
 * layout. `getSession()` resolves the real cookie rather than reading the
 * `demo-data.ts` fixture `SidebarAccount` used, since a name shown next to a
 * sign-out control has to be the account that control actually signs out.
 */
export async function AccountMenu() {
  const user = await getSession();
  if (!user) return null;

  return <AccountMenuTrigger name={user.name} />;
}
