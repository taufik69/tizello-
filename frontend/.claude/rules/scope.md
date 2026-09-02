# Rule — scope

## Frontend only. Do not touch `backend/`.

The repo has two packages:

```
tizello/
  frontend/   ← all work happens here
  backend/    ← DO NOT TOUCH
```

**Never create, edit, move or delete anything under `../backend/`** — not the
source, not its `CLAUDE.md`, not its config. It is out of scope until the user
says otherwise. If a task seems to need a backend change, stop and say so
rather than reaching across.

### What this means in practice

- **Server work stays in the Next app.** Server Components, Server Actions and
  route handlers under `frontend/src/` are all fair game — "frontend only" is
  about the `backend/` package, not about avoiding server-side code.
- **A real API does not exist yet.** Anything that would call one goes behind a
  module in `src/lib/`, backed by in-memory fixtures — the way
  `src/lib/boards.ts` already works. Keep the function signatures shaped like
  the eventual API so swapping the body is the whole migration.
- **Write the contract down.** When a feature implies backend endpoints, record
  the expected request and response shape in the feature's spec under
  `.claude/specs/`. That document is the handoff; do not implement it.
- **No database, ORM, or auth-server dependencies** in `frontend/package.json`.

### Reviewing your own work

Before finishing, `git status` should show changes under `frontend/` only. A
staged path starting with `backend/` is a mistake — unstage it and say so.
