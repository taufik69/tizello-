/** The "— or —" rule between the email form and the social grid. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-2xs text-text-subtle">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
