import {
  AttachmentIcon,
  ChecklistIcon,
  ClockIcon,
  CommentIcon,
} from "@/components/ui/icons";
import type { Card } from "@/types/board";

const DAY_MS = 86_400_000;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

/** Overdue reads as danger, due within 48h as warning, otherwise neutral. */
function dueTone(dueDate: string) {
  const remaining = new Date(dueDate).getTime() - Date.now();
  if (remaining < 0) return "bg-danger-subtle text-danger";
  if (remaining < 2 * DAY_MS) return "bg-warning-subtle text-warning";
  return "text-text-subtle";
}

function Badge({
  children,
  className = "text-text-subtle",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs px-1 py-0.5 text-2xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function CardMeta({ card }: { card: Card }) {
  const { dueDate, checklist, commentCount, attachmentCount } = card;
  const hasMeta =
    dueDate || checklist || commentCount || attachmentCount;

  if (!hasMeta) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {dueDate && (
        <Badge className={dueTone(dueDate)}>
          <ClockIcon className="size-3" />
          <span>Due {dateFormat.format(new Date(dueDate))}</span>
        </Badge>
      )}
      {checklist && (
        <Badge
          className={
            checklist.done === checklist.total
              ? "bg-success-subtle text-success"
              : "text-text-subtle"
          }
        >
          <ChecklistIcon className="size-3" />
          <span>
            {checklist.done}/{checklist.total}
            <span className="sr-only"> checklist items complete</span>
          </span>
        </Badge>
      )}
      {commentCount ? (
        <Badge>
          <CommentIcon className="size-3" />
          <span>
            {commentCount}
            <span className="sr-only"> comments</span>
          </span>
        </Badge>
      ) : null}
      {attachmentCount ? (
        <Badge>
          <AttachmentIcon className="size-3" />
          <span>
            {attachmentCount}
            <span className="sr-only"> attachments</span>
          </span>
        </Badge>
      ) : null}
    </div>
  );
}
