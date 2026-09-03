import { STATE_CHIP } from "@/components/sprints/sprint-tone";
import { BADGE_BASE } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { SPRINT_STATE_LABEL } from "@/lib/sprint-groups";
import type { SprintState } from "@/types/sprint";

/**
 * The state chip. Text, not a colour alone — the fill is recognition, the word
 * is the meaning, and anyone who cannot separate plum from blue still reads the
 * card correctly. Same bargain as `ProjectStatusBadge`, which is the chip this
 * one is deliberately identical to in geometry.
 */
export function SprintStateBadge({ state }: { state: SprintState }) {
  return (
    <span className={cn(BADGE_BASE, STATE_CHIP[state])}>
      {SPRINT_STATE_LABEL[state]}
    </span>
  );
}
