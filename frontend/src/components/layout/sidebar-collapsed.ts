"use client";

import { createContext, useContext } from "react";

/*
 * Whether the sidebar is drawing itself as a 56px icon rail.
 *
 * A CONTEXT, and the two obvious alternatives are both closed off:
 *
 * - **A render prop** (`children: (collapsed) => ReactNode`) cannot cross the
 *   RSC boundary. `SidebarFrame` is a Client Component — it has to be, the
 *   preference lives in `localStorage` — and `AppShell` above it is a Server
 *   Component, so a function passed down is "Functions are not valid as a
 *   child of Client Components" at runtime.
 * - **Two pre-rendered trees**, one expanded and one railed, would serialise
 *   fine and cost the group state: `SidebarTreeItem` keeps `open` in
 *   `useState`, so swapping trees unmounts it, and every group the user had
 *   expanded would snap shut on collapse and reopen wrong.
 *
 * Context has neither problem. `SidebarFrame` renders the server-built
 * sidebar as slotted `children` inside a provider, which is the documented
 * arrangement — a Server Component subtree passes THROUGH a client provider
 * untouched, and the client leaves inside it (`SidebarItem`,
 * `SidebarSection`, `SidebarHeader`) read the value at runtime.
 *
 * The default is `false` so the mobile drawer, which renders the same tree
 * without a provider of its own, is always expanded.
 */
export const SidebarCollapsedContext = createContext(false);

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext);
}
