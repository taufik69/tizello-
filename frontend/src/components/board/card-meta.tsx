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

/**
 * Overdue reads danger, due within 48h warning, otherwise muted. Colour only —
 * no chip fill. Notion's card meta is quiet text, and a row of tinted pills
 * fights the card's own hairline border for attention.
 */
function dueTone(dueDate: string) {
  const remaining = new Date(dueDate).getTime() - Date.now();
  if (remaining < 0) return "text-danger";
  if (remaining < 2 * DAY_MS) return "text-warning";
  return "text-text-subtle";
}

function Item({
  children,
  className = "text-text-subtle",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-2xs ${className}`}>
      {children}
    </span>
  );
}

export function CardMeta({ card }: { card: Card }) {
  const { dueDate, checklist, commentCount, attachmentCount } = card;

  if (!dueDate && !checklist && !commentCount && !attachmentCount) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {dueDate && (
        <Item className={dueTone(dueDate)}>
          <ClockIcon className="size-3" />
          <span>{dateFormat.format(new Date(dueDate))}</span>
        </Item>
      )}
      {checklist && (
        <Item
          className={
            checklist.done === checklist.total
              ? "text-success"
              : "text-text-subtle"
          }
        >
          <ChecklistIcon className="size-3" />
          <span>
            {checklist.done}/{checklist.total}
            <span className="sr-only"> checklist items complete</span>
          </span>
        </Item>
      )}
      {commentCount ? (
        <Item>
          <CommentIcon className="size-3" />
          <span>
            {commentCount}
            <span className="sr-only"> comments</span>
          </span>
        </Item>
      ) : null}
      {attachmentCount ? (
        <Item>
          <AttachmentIcon className="size-3" />
          <span>
            {attachmentCount}
            <span className="sr-only"> attachments</span>
          </span>
        </Item>
      ) : null}
    </div>
  );
}
