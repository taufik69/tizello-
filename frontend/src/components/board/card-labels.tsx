import type { LabelColor } from "@/types/board";

/*
 * Complete class strings, never `bg-label-${color}` — Tailwind scans source as
 * plain text and would generate none of these.
 */
const LABEL_CLASS: Record<LabelColor, string> = {
  green: "bg-label-green",
  yellow: "bg-label-yellow",
  orange: "bg-label-orange",
  red: "bg-label-red",
  purple: "bg-label-purple",
  blue: "bg-label-blue",
};

/**
 * Notion renders labels as small leading dots rather than Trello's colour bars.
 * They sit inline before the title, so `mt-1.5` optically centres them on the
 * first line of text.
 */
export function CardLabels({ labels }: { labels: LabelColor[] }) {
  if (labels.length === 0) return null;

  return (
    <span className="mt-1.5 flex shrink-0 gap-1">
      {labels.map((label) => (
        <span key={label} className={`size-1.5 rounded-full ${LABEL_CLASS[label]}`}>
          {/* Colour alone never carries meaning. */}
          <span className="sr-only">{label} label</span>
        </span>
      ))}
    </span>
  );
}
