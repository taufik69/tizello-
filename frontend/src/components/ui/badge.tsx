import { cn } from "@/lib/cn";

/* Complete class strings, never interpolation. `brand-100 / brand-800` is the
   sanctioned tinted-surface pair from DESIGN-SYSTEM.md's contrast table; both
   are brand primitives, so the chip is identical in light and dark. */
const VARIANT = {
  default: "bg-surface-sunken text-text-muted",
  outline: "border border-border text-text-muted",
  brand: "bg-brand-100 text-brand-800",
} as const;

export type BadgeVariant = keyof typeof VARIANT;

export function Badge({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-xs px-1.5 py-0.5 text-2xs font-semibold whitespace-nowrap",
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}
