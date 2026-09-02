import Link from "next/link";

export default function BoardNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-xl font-semibold text-text">Board not found</h1>
        <p className="text-sm text-text-muted">
          It may have been deleted, or the link is wrong.
        </p>
        <Link
          href="/board/sprint-4"
          className="inline-block rounded-sm bg-brand-500 px-3 py-1.5 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400"
        >
          Go to the sprint board
        </Link>
      </div>
    </main>
  );
}
