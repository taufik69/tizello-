import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function TopBar() {
  return (
    <header className="flex h-topbar shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <nav className="flex items-center gap-4">
        <Link href="/board/sprint-4" className="text-sm font-semibold text-text">
          Tizello
        </Link>
        <Link
          href="/board/backlog"
          className="text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:text-text"
        >
          Backlog
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:text-text"
        >
          Design system
        </Link>
      </nav>
      <ThemeToggle />
    </header>
  );
}
