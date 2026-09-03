import { StatusDot } from "@/components/projects/status-dot";
import { ChevronDownIcon } from "@/components/ui/icons";
import { STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectStatus } from "@/types/project";

/*
 * A group heading: the collapse chevron, a status pill and the count.
 *
 * The chevron is a glyph, NOT a button. Collapsing is not built, and a control
 * that looks pressable and does nothing is worse than no control — so it is
 * `aria-hidden` decoration and nothing here is in the tab order.
 *
 * The row this sits on stays `bg-surface`: `StatusDot`'s green is 2.59:1 on
 * `surface-sunken` and 3.06:1 on `surface`, so tinting the header would drop
 * the dot below the 3:1 an indicator needs.
 */
export function StatusGroupHeader({
  status,
  count,
}: {
  status: ProjectStatus;
  count: number;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <ChevronDownIcon className="size-3.5 shrink-0 text-text-subtle" />
      <StatusDot status={status} />
      <span className="text-xs font-semibold text-text">
        {STATUS_LABEL[status]}
      </span>
      <span className="text-2xs tabular-nums text-text-subtle">{count}</span>
    </span>
  );
}
