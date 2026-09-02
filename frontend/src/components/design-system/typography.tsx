import { Section } from "./section";

const TYPE_SCALE = [
  ["text-4xl font-semibold", "text-4xl · 48/56 — hero"],
  ["text-3xl font-semibold", "text-3xl · 36/44"],
  ["text-xl font-semibold", "text-xl · 24/32 — section"],
  ["text-lg font-semibold", "text-lg · 20/28 — list title"],
  ["text-base", "text-base · 16/24 — body"],
  ["text-sm", "text-sm · 14/20 — UI default"],
  ["text-xs", "text-xs · 12/16 — label"],
];

export function TypeScale() {
  return (
    <Section title="Typography — Inter">
      <div className="divide-y divide-border rounded-md border border-border bg-surface">
        {TYPE_SCALE.map(([cls, note]) => (
          <div
            key={note}
            className="flex flex-wrap items-baseline justify-between gap-4 px-5 py-4"
          >
            <p className={cls}>Organise anything</p>
            <span className="font-mono text-2xs text-text-subtle">{note}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
