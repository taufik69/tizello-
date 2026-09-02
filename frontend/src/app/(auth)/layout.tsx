/**
 * The split shell. Two panels, each `min-h-dvh`; below `lg` the grid collapses
 * to one column and the aside removes itself (spec §4).
 *
 * The layout provides *only* the grid. Each page renders its own left column
 * and its own `<AuthAside variant>`, which is what lets the panel copy change
 * per route while every file here stays a Server Component — no `usePathname`,
 * no client boundary.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">{children}</div>;
}
