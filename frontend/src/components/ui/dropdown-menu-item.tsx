"use client";

import Link from "next/link";
import { useDropdownMenu } from "@/components/ui/dropdown-menu-context";
import { cn } from "@/lib/cn";

/* Roving tabindex: only the menu itself is in the tab order, and the arrow keys
   move focus between items. The 2px ring still comes from the base layer; the
   tint here is the additional highlight, not a replacement for it. */
const ITEM =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-100 ease-standard";

/*
 * A destructive item is a VARIANT, not a red `<span>` inside a normal one.
 *
 * The red used to be pushed onto a child, because `cn` is a plain join and a
 * `text-danger` alongside the base's `text-text-muted` leaves two colour
 * utilities of equal specificity with stylesheet order picking the winner.
 * Inheritance dodged the ambiguity — and cost the row its highlight: hovering
 * "Delete project" tinted the fill neutral and pulled the label to
 * `text-text`, so the one entry that needs to look dangerous was the one that
 * stopped being red under the cursor.
 *
 * `text-danger` on `bg-danger-subtle` measures 4.57:1 in light and 5.10:1 in
 * dark (DESIGN-SYSTEM.md) — AA at this size, which the 11px chips it is
 * tabulated beside are not, so this pair is safe here and not there.
 */
const TONE = {
  default:
    "text-text-muted hover:bg-surface-hover hover:text-text focus:bg-surface-hover focus:text-text",
  danger:
    "text-danger hover:bg-danger-subtle hover:text-danger focus:bg-danger-subtle focus:text-danger",
} as const;

export type DropdownMenuItemProps = {
  children: React.ReactNode;
  className?: string;
  /** `danger` for an irreversible action — see `TONE` above. */
  variant?: keyof typeof TONE;
  /** Drawn in the leading slot at a fixed width, so every label in the menu starts on one line. */
  icon?: React.ReactNode;
  /** Renders the item as a link. Navigation stays a real `<a>`. */
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  "aria-current"?: React.AriaAttributes["aria-current"];
};

export function DropdownMenuItem({
  children,
  className,
  variant = "default",
  icon,
  href,
  onSelect,
  disabled,
  "aria-current": ariaCurrent,
}: DropdownMenuItemProps) {
  const { setOpen, closeAndRefocus } = useDropdownMenu();
  const shared = {
    role: "menuitem" as const,
    tabIndex: -1,
    className: cn(ITEM, TONE[variant], disabled && "opacity-60", className),
    "aria-current": ariaCurrent,
    /* On both branches: the dim is cosmetic, this is what actually takes the
       item out of the arrow-key ring (MENU_ITEM_SELECTOR filters on it). */
    "aria-disabled": disabled || undefined,
  };

  /* Only wrapped when there IS an icon. The item is already a flex row, so a
     caller that renders its own icon-plus-label as children relies on being a
     direct child of it — for the `gap-2` between them, and for the `ml-auto`
     that pushes a trailing hint to the far edge. Wrapping unconditionally
     would quietly break both. */
  const body = icon ? (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </>
  ) : (
    children
  );

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
        {body}
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
      {body}
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
