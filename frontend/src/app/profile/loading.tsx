/**
 * The streaming fallback for `/profile`, which awaits `GET /users/me`.
 *
 * Shaped like what replaces it — the same three-column grid at the same
 * breakpoint, the same card geometry, the same shared height — so the page
 * settles rather than jumps when the data lands. `animate-pulse` on
 * `surface-sunken` is the treatment the rest of the app uses.
 */
function Line({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-surface-sunken ${className}`} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-surface p-6">
      <Line className="h-3 w-16" />
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

export default function ProfileLoading() {
  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <Line className="h-5 w-24" />
      <Line className="mt-6 h-7 w-40" />
      <Line className="mt-2 h-4 w-64" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr_1fr]">
        <Card>
          <div className="flex flex-col items-center">
            <div className="size-20 animate-pulse rounded-full bg-surface-sunken" />
            <Line className="mt-4 h-5 w-28" />
            <Line className="mt-2 h-4 w-20" />
          </div>
          <div className="mt-auto pt-6">
            <Line className="h-9 w-full" />
          </div>
        </Card>

        <Card>
          <div className="flex flex-1 flex-col gap-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="space-y-2">
                <Line className="h-3 w-20" />
                <Line className="h-9 w-full" />
              </div>
            ))}
            <div className="mt-auto flex justify-end border-t border-border pt-4">
              <Line className="h-9 w-28" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="divide-y divide-border">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="py-3 first:pt-0">
                <Line className="h-2.5 w-16" />
                <Line className="mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
          <Line className="mt-auto h-6 w-full" />
        </Card>
      </div>
    </main>
  );
}
