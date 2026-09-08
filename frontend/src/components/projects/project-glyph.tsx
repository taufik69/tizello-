import { DocIcon } from "@/components/ui/table-icons";
import { cn } from "@/lib/cn";

/**
 * The small square in front of a project's name — its chosen emoji on its
 * chosen colour, falling back to the neutral page glyph when neither is set.
 *
 * One component rather than the same three-branch conditional in the table
 * cell, the board card and the workspace grid: those three drew a hard-coded
 * `DocIcon` and ignored `icon` / `color` entirely, which is why a project
 * created with both looked identical to one created with neither.
 *
 * `color` is a user-picked hex, so it is the one sanctioned exception to
 * "no `style={{}}`" in `.claude/rules/ui-components.md` — there is no finite
 * set of classes to enumerate for an arbitrary hex. `WorkspaceAvatar` makes
 * the same call for the same reason, and pairs it with the same ink:
 * `text-on-brand` is the only dark ink that is theme-invariant, and every
 * swatch in the picker is a light label hue.
 *
 * Decorative by default — the name is always rendered beside it, so an
 * `sr-only` copy would announce the project twice. `label` is for the one
 * caller where the glyph is the subject rather than an ornament: the create
 * dialog's preview, where a screen-reader user otherwise gets no signal that
 * picking an icon changed anything.
 */
const SIZE = {
  sm: "size-4 text-[0.625rem]",
  default: "size-5 text-xs",
  lg: "size-8 text-base",
} as const;

export function ProjectGlyph({
  icon,
  color,
  size = "default",
  label,
  className,
}: {
  icon?: string | null;
  color?: string | null;
  size?: keyof typeof SIZE;
  /** Announces the glyph. Omit wherever the project's name sits beside it. */
  label?: string;
  className?: string;
}) {
  /* Nothing chosen at all: the old neutral glyph, unchanged, so a project
     created before the picker existed still looks deliberate rather than
     broken. */
  if (!icon && !color) {
    return (
      <span className={cn("inline-grid shrink-0 place-items-center", SIZE[size], className)}>
        <DocIcon className="size-3.5 text-text-subtle" />
        {label && <span className="sr-only">{label}</span>}
      </span>
    );
  }

  return (
    <span
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-xs leading-none",
        SIZE[size],
        /* A colour with no icon still has to read as a swatch, so the tile is
           drawn either way; only the ink is conditional on there being a
           glyph to ink. */
        color ? "text-on-brand" : "bg-surface-sunken",
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
