"use client";

import Link from "next/link";
import { useDropdownMenu } from "@/components/ui/dropdown-menu-context";
import { cn } from "@/lib/cn";

/* Roving tabindex: only the menu itself is in the tab order, and the arrow keys
   move focus between items. The 2px ring still comes from the base layer; the
   tint here is the additional highlight, not a replacement for it. */
const ITEM =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text focus:bg-surface-hover focus:text-text";

export type DropdownMenuItemProps = {
  children: React.ReactNode;
  className?: string;
  /** Renders the item as a link. Navigation stays a real `<a>`. */
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  "aria-current"?: React.AriaAttributes["aria-current"];
};

export function DropdownMenuItem({
  children,
  className,
  href,
  onSelect,
  disabled,
  "aria-current": ariaCurrent,
}: DropdownMenuItemProps) {
  const { setOpen, closeAndRefocus } = useDropdownMenu();
  const shared = {
    role: "menuitem" as const,
    tabIndex: -1,
    className: cn(ITEM, disabled && "opacity-60", className),
    "aria-current": ariaCurrent,
    /* On both branches: the dim is cosmetic, this is what actually takes the
       item out of the arrow-key ring (MENU_ITEM_SELECTOR filters on it). */
    "aria-disabled": disabled || undefined,
  };

  if (href) {
    return (
      <Link
        href={href}
        {...shared}
        onClick={(event) => {
          /* A dimmed link that still navigates is the worst of both. */
          if (disabled) {
            event.preventDefault();
            return;
          }
          setOpen(false);
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      {...shared}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        closeAndRefocus();
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-2xs font-semibold tracking-widest text-text-subtle uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
