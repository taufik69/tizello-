import { Section, Swatch } from "./section";

/*
 * Class names are written out in full: Tailwind scans source as plain text and
 * cannot see a class built by string interpolation.
 */
const BRAND = [
  ["bg-brand-50", "50"], ["bg-brand-100", "100"], ["bg-brand-200", "200"],
  ["bg-brand-300", "300"], ["bg-brand-400", "400"], ["bg-brand-500", "500"],
  ["bg-brand-600", "600"], ["bg-brand-700", "700"], ["bg-brand-800", "800"],
  ["bg-brand-900", "900"], ["bg-brand-950", "950"],
];

const INK = [
  ["bg-ink-0", "0"], ["bg-ink-50", "50"], ["bg-ink-100", "100"],
  ["bg-ink-200", "200"], ["bg-ink-300", "300"], ["bg-ink-400", "400"],
  ["bg-ink-500", "500"], ["bg-ink-600", "600"], ["bg-ink-700", "700"],
  ["bg-ink-800", "800"], ["bg-ink-900", "900"], ["bg-ink-950", "950"],
];

const SLATE = [
  ["bg-slate-0", "0"], ["bg-slate-50", "50"], ["bg-slate-100", "100"],
  ["bg-slate-200", "200"], ["bg-slate-300", "300"], ["bg-slate-400", "400"],
  ["bg-slate-500", "500"], ["bg-slate-600", "600"], ["bg-slate-700", "700"],
  ["bg-slate-800", "800"], ["bg-slate-900", "900"], ["bg-slate-950", "950"],
];

const STATUS = [
  ["bg-success-subtle", "text-success", "Success"],
  ["bg-warning-subtle", "text-warning", "Warning"],
  ["bg-danger-subtle", "text-danger", "Danger"],
  ["bg-info-subtle", "text-info", "Info"],
];

export function BrandPalette() {
  return (
    <Section title="Brand — fresh mint">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
        {BRAND.map(([token, step]) => (
          <Swatch key={step} token={token} step={step} />
        ))}
      </div>
      <p className="text-xs text-text-muted">
        <strong className="font-semibold text-text">Contrast rule.</strong>{" "}
        brand-500 carries deep-green ink, not white (7.1:1). Brand-coloured text
        on white uses brand-700 (5.0:1).
      </p>
    </Section>
  );
}

export function NeutralPalettes() {
  return (
    <>
      <Section title="Neutrals — light ramp (Trello's cool greys)">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
          {INK.map(([token, step]) => (
            <Swatch key={step} token={token} step={step} />
          ))}
        </div>
      </Section>

      <Section title="Neutrals — dark ramp (Trello's dark greys)">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
          {SLATE.map(([token, step]) => (
            <Swatch key={step} token={token} step={step} />
          ))}
        </div>
        <p className="text-xs text-text-muted">
          Trello&rsquo;s dark mode is not the light ramp inverted — it is a
          separate, greener set of greys. Both are always available; the semantic
          layer picks between them.
        </p>
      </Section>
    </>
  );
}

export function StatusPalette() {
  return (
    <Section title="Status">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS.map(([bg, fg, label]) => (
          <div key={label} className={`rounded-md border border-border p-4 ${bg}`}>
            <p className={`text-sm font-semibold ${fg}`}>{label}</p>
            <p className="text-xs text-text-muted">Flips with the theme</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
