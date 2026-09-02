import { Section } from "./section";

const RADII = [
  ["rounded-xs", "xs · 3px"], ["rounded-sm", "sm · 4px"],
  ["rounded-md", "md · 8px"], ["rounded-lg", "lg · 12px"],
  ["rounded-xl", "xl · 16px"],
];

const ELEVATION = [
  ["shadow-card", "card"], ["shadow-raised", "raised"],
  ["shadow-overlay", "overlay"], ["shadow-modal", "modal"],
];

export function Buttons() {
  return (
    <Section title="Buttons">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-5">
        <button className="rounded-sm bg-brand-500 px-3 py-1.5 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400">
          Create board
        </button>
        <button className="rounded-sm bg-surface-sunken px-3 py-1.5 text-sm font-medium text-text transition-colors duration-100 ease-standard hover:bg-border">
          Secondary
        </button>
        <button className="rounded-sm border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors duration-100 ease-standard hover:bg-surface-hover">
          Outline
        </button>
        <button className="rounded-sm px-3 py-1.5 text-sm font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover">
          Ghost
        </button>
        <button className="rounded-sm px-3 py-1.5 text-sm font-semibold text-danger transition-colors duration-100 ease-standard hover:bg-danger-subtle">
          Delete
        </button>
      </div>
    </Section>
  );
}

export function RadiusAndElevation() {
  return (
    <Section title="Radius & elevation">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-wrap items-end gap-4 rounded-md border border-border bg-surface p-5">
          {RADII.map(([cls, note]) => (
            <div key={note} className="space-y-1.5 text-center">
              <div className={`size-14 bg-surface-sunken ${cls}`} />
              <span className="font-mono text-2xs text-text-subtle">{note}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-5 rounded-md bg-canvas p-5">
          {ELEVATION.map(([cls, note]) => (
            <div key={note} className="space-y-1.5 text-center">
              <div className={`size-14 rounded-md bg-surface ${cls}`} />
              <span className="font-mono text-2xs text-text-subtle">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
