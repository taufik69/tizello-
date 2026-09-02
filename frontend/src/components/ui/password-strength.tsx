import { STRENGTH_LABELS } from "@/lib/validation/auth";

/*
 * Four segments, filled from a score the caller computes. Pure render, so it
 * stays a Server Component even though its only caller is a client leaf.
 *
 * Advisory only — it never blocks submission. And it is never colour-only: the
 * word next to it is the actual signal, announced politely so a screen-reader
 * user gets the same feedback a sighted one does.
 */
const FILL = ["bg-danger", "bg-warning", "bg-brand-500", "bg-success"] as const;

export function PasswordStrength({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(score, 4));
  const fill = clamped > 0 ? FILL[clamped - 1] : "bg-border";

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={[
              "h-1 flex-1 rounded-xs transition-colors duration-100 ease-standard",
              index < clamped ? fill : "bg-surface-sunken",
            ].join(" ")}
          />
        ))}
      </div>
      <p aria-live="polite" className="mt-1 text-2xs text-text-subtle">
        Password strength: {STRENGTH_LABELS[clamped]}
      </p>
    </div>
  );
}
