"use client";

/*
 * Segment error boundary. Must be a Client Component — React needs to attach it
 * on the client to catch render errors and expose `reset`.
 */
export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-xl font-semibold text-text">
          This board didn&rsquo;t load
        </h1>
        <p className="text-sm text-text-muted">
          Something failed while fetching the lists. Trying again usually works.
        </p>
        {error.digest && (
          <p className="font-mono text-2xs text-text-subtle">
            Reference: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-brand-500 px-3 py-1.5 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
