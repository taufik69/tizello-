const ROLE_CARDS = ["owner", "admin", "member"];
const MATRIX_ROWS = ["a", "b", "c", "d", "e", "f"];
const MEMBER_ROWS = ["a", "b", "c", "d", "e"];

/**
 * Three blocks in the order the page renders them, at roughly the heights the
 * real ones settle at, so arriving content does not shove the page down.
 */
export default function PermissionsLoading() {
  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-sunken" />
        <div className="h-6 w-56 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROLE_CARDS.map((id) => (
          <div
            key={id}
            className="h-40 animate-pulse rounded-md border border-border bg-surface"
          />
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="space-y-px rounded-md border border-border bg-surface p-1">
          {MATRIX_ROWS.map((id) => (
            <div
              key={id}
              className="h-9 animate-pulse rounded-xs bg-surface-sunken"
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {MEMBER_ROWS.map((id) => (
          <div
            key={id}
            className="h-[4.5rem] animate-pulse rounded-md border border-border bg-surface sm:h-16"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading roles and permissions
      </span>
    </main>
  );
}
