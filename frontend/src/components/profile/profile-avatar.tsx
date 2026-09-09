"use client";

import { useRef, useTransition } from "react";
import { saveAvatarAction } from "@/lib/actions/profile-actions";
import { uploadFileAction } from "@/lib/actions/upload-actions";
import { formatBytes, MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { profileErrorCopy } from "@/types/profile";
import { toast } from "sonner";

/*
 * The photo, and the two controls that change it.
 *
 * **Two requests, deliberately.** The file goes to `POST /uploads` first and
 * the returned path goes to `PATCH /users/me` second — the API has no
 * multipart profile endpoint, and giving it one would duplicate the upload
 * middleware's type allowlist and generated filenames.
 *
 * **It saves on pick, with no Save button.** Choosing a photo is a complete
 * gesture; making it a pending edit means a user who picks one and navigates
 * away has silently discarded it. That is also why this is not a field on
 * `ProfileForm`: a failed upload must not take the half-typed name with it.
 *
 * **It draws the controls, not the photo.** The disc itself is rendered by
 * `ProfileIdentityCard`, a Server Component, so the only JavaScript this column
 * ships is the upload handler. The cost is that the new photo does not appear
 * until the router refreshes — which `saveAvatarAction`'s `revalidatePath`
 * triggers, and which is also what updates the account menu in the top strip.
 * A local preview here would show the change twice, from two sources, and they
 * would disagree for the moment between them.
 */
const BUTTON =
  "rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors duration-100 ease-standard hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-60";

export function ProfileAvatar({ hasPhoto }: { hasPhoto: boolean }) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function apply(file: File) {
    /* Checked BEFORE the action, not inside it. `uploadFileAction` is a Server
       Action, and Next rejects an oversized body rather than returning from
       it — the promise throws, and a throw inside `startTransition` with
       nothing to catch it lands on `error.tsx`. So a 12 MB photo would replace
       this page with "Your profile didn't load" instead of saying what was
       wrong. `lib/upload-limits.ts` has the full reasoning. */
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `${formatBytes(file.size)} is too big — photos must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.`,
      );
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.append("file", file);

      const uploaded = await uploadFileAction(body);

      if (!uploaded.ok) {
        toast.error(uploaded.message);
        return;
      }

      /* The API's own allowlist admits PDFs and spreadsheets — it serves every
         kind of project attachment. The file picker below asks for images, but
         `accept` is a hint a determined user can step around, and the profile
         validator would answer 400 rather than say why. */
      if (!uploaded.file.mime.startsWith("image/")) {
        toast.error("Choose an image file.");
        return;
      }

      const saved = await saveAvatarAction(uploaded.file.url);

      if (!saved.ok) {
        toast.error(profileErrorCopy(saved.code));
        /* The uploaded file is now an orphan: it is on disk and no row points
           at it. Nothing cleans it up, because the API has no endpoint to
           delete an upload by name — `removeStored` exists but is only reached
           through the profile write that just failed. It is one file per
           failed save, which is the same class of leak
           `backend/docs/api/upload.md` already tracks as an open question. */
        return;
      }

      toast.success("Photo updated.");
    });
  }

  function remove() {
    startTransition(async () => {
      const saved = await saveAvatarAction(null);

      if (!saved.ok) {
        toast.error(profileErrorCopy(saved.code));
        return;
      }

      toast.success("Photo removed.");
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${BUTTON} flex-1`}
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Working…" : hasPhoto ? "Change photo" : "Upload photo"}
        </button>

        {hasPhoto && (
          <button type="button" className={BUTTON} disabled={isPending} onClick={remove}>
            Remove
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-2xs text-text-subtle">
        PNG, JPEG, WebP or GIF, up to {formatBytes(MAX_UPLOAD_BYTES)}.
      </p>

      {/* Hidden rather than styled: a file input cannot be restyled to match
          the buttons above, and every browser draws its own. The visible
          control is the button that clicks this one. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          /* Cleared so picking the SAME file twice fires change again — after a
             failed save, re-choosing the same photo is the obvious retry. */
          event.target.value = "";
          if (file) apply(file);
        }}
      />
    </div>
  );
}
