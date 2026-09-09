/**
 * The one place the file-size caps are written down.
 *
 * There are TWO limits on the path a file takes, they are enforced by
 * different things, and the outer one silently being the smaller of the two is
 * what made picking any real photo blow up the whole page:
 *
 * 1. **Next's Server Action body limit.** `uploadFileAction` is a Server
 *    Action, so the browser posts the file to NEXT, not to the API. Next caps
 *    an action's request body at **1 MB by default** and REJECTS the call
 *    rather than returning from it — the promise throws, and a throw inside
 *    `startTransition` with nothing to catch it lands on the nearest
 *    `error.tsx`. That is why a 2 MB image produced "The projects didn't load"
 *    instead of a message about the file: the action never ran, so the
 *    `try/catch` inside it never saw anything, and no file was ever written.
 *
 * 2. **The API's own cap** — `UPLOAD_MAX_BYTES`, 10 MB, enforced by multer
 *    before the bytes are written (`backend/src/shared/middlewares/upload.js`).
 *    This is the real rule, and it answers `413` with a sentence written for a
 *    person.
 *
 * So the Next limit is set ABOVE the API's rather than equal to it. Multipart
 * framing adds a few hundred bytes to a body, and a 10 MB file that Next
 * rejected at exactly 10 MB would fail as a crash instead of as the API's
 * "Files must be 10 MB or smaller" — the rule stated by the layer that owns
 * it. The headroom is what keeps the authoritative refusal authoritative.
 */

/** Mirrors `UPLOAD_MAX_BYTES` in `backend/.env`. The API enforces it; this is what lets the picker say so first. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Read by `next.config.ts`. Deliberately larger than `MAX_UPLOAD_BYTES` — see above. */
export const SERVER_ACTION_BODY_LIMIT = "12mb";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
