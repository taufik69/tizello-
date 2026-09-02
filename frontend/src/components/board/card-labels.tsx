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

export function CardLabels({ labels }: { labels: LabelColor[] }) {
  if (labels.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <li key={label} className={`h-1.5 w-10 rounded-full ${LABEL_CLASS[label]}`}>
          {/* Colour alone never carries meaning. */}
          <span className="sr-only">{label} label</span>
        </li>
      ))}
    </ul>
  );
}
