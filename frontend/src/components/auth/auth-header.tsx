/**
 * The heading block above every auth form. Exactly one `<h1>` per screen lives
 * here — the illustration on the right contributes no heading (spec §13).
 */
export function AuthHeader({ heading, sub }: { heading: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-text">{heading}</h1>
      {sub && <p className="mt-1.5 text-sm text-text-muted">{sub}</p>}
    </header>
  );
}
