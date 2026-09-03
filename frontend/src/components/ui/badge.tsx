import { cn } from "@/lib/cn";

/* Complete class strings, never interpolation. `brand-100 / brand-800` is the
   sanctioned tinted-surface pair from DESIGN-SYSTEM.md's contrast table; both
   are brand primitives, so the chip is identical in light and dark. */
const VARIANT = {
  default: "bg-surface-sunken text-text-muted",
  outline: "border border-border text-text-muted",
  brand: "bg-brand-100 text-brand-800",
  /* Amber fill, neutral ink — and the ink is neutral on purpose. Measured
     against the values in DESIGN-SYSTEM.md, `text-warning` on
     `bg-warning-subtle` is 3.27:1 in light (#b57f00 on #fff7e0) and 8.86:1 in
     dark. Light fails AA for 11px text, so the label takes `text-text-muted`
     instead: 6.03:1 light, 5.93:1 dark. The amber is carried by the fill,
     which is the part that has to be recognisable at a glance; a caller that
     wants amber ink can put it on an icon, where 3:1 is the bar. */
  warning: "bg-warning-subtle text-text-muted",
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
