/**
 * Step 2's header: the address from step 1, shown as static text with a way
 * back. "Change" returns to step 1 and refocuses the email field (spec §6.2).
 */
export function SignInIdentity({
  email,
  onChange,
}: {
  email: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-surface-sunken px-2.5 py-2">
      <span className="truncate text-sm text-text-muted">{email}</span>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-sm text-2xs font-semibold text-text-brand transition-colors duration-100 ease-standard hover:underline"
      >
        Change
        <span className="sr-only"> email address</span>
      </button>
    </div>
  );
}
