import type { ListTone } from "@/types/board";

/*
 * Complete class strings — no interpolation. Notion tints the status chip and
 * leaves the column itself untinted, so the colour lands in one small place
 * instead of washing the whole track.
 */
const TONE_CLASS: Record<ListTone, string> = {
  neutral: "bg-surface-sunken text-text-muted",
  info: "bg-info-subtle text-info",
  warning: "bg-warning-subtle text-warning",
  success: "bg-success-subtle text-success",
};

export function ColumnPill({
  title,
  tone = "neutral",
  id,
}: {
  title: string;
  tone?: ListTone;
  id: string;
}) {
  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-xs px-1.5 py-0.5 text-2xs font-semibold ${TONE_CLASS[tone]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {title}
    </span>
  );
}
