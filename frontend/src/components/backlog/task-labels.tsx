import { LABEL_DOT } from "@/components/backlog/backlog-tone";
import { BADGE_BASE } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { BacklogLabel } from "@/types/backlog";

/*
 * A task's tags. Each is a neutral chip with a coloured dot, not a coloured
 * chip: the six label hues are mid-tone and carry no ink that clears AA in both
 * themes, so the colour goes on the 6px disc — where 3:1 is the bar and it is
 * decoration next to a word anyway.
 */
const MAX_SHOWN = 2;
const CHIP = "bg-surface-sunken text-text-muted";

export function TaskLabels({ labels }: { labels: BacklogLabel[] }) {
  if (labels.length === 0) return null;

  const shown = labels.slice(0, MAX_SHOWN);
  const overflow = labels.length - shown.length;

  return (
    <span className="flex min-w-0 items-center gap-1">
      {shown.map((label) => (
        <span key={label.id} className={cn(BADGE_BASE, CHIP, "max-w-28")}>
          <span
            aria-hidden="true"
            className={cn("size-1.5 shrink-0 rounded-full", LABEL_DOT[label.color])}
          />
          <span className="truncate">{label.name}</span>
        </span>
      ))}

      {overflow > 0 && (
        <span className={cn(BADGE_BASE, CHIP)}>
          <span aria-hidden="true">+{overflow}</span>
          <span className="sr-only">
            and {overflow} more: {labels.slice(MAX_SHOWN).map((l) => l.name).join(", ")}
          </span>
        </span>
      )}
    </span>
  );
}
