"use server";

import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api-client";
import type { UploadedFile } from "@/types/project-property";

/*
 * File upload for a project's `FILES` property —
 * `backend/docs/api/upload.md`.
 *
 * A SERVER ACTION, and not a browser `fetch` to the API, for a reason that is
 * easy to get wrong: the session cookies are `httpOnly` on the NEXT origin
 * (`lib/session-cookie.ts`). A `fetch` from the browser to `localhost:5001`
 * is cross-origin and would carry none of them, so the API would answer `401`
 * however the CORS headers were set. Every other call in this app goes through
 * `apiCallWithRefresh`, which forwards the cookie jar from the server; this
 * does the same thing by hand because the body is `multipart/form-data` rather
 * than JSON.
 *
 * It does NOT go through `apiCall`, which sets `content-type: application/json`
 * and `JSON.stringify`s its body. Passing `FormData` to `fetch` requires
 * letting it set the content type itself — the multipart boundary is generated
 * per request, and a hand-written header cannot know it.
 */

export type UploadState =
  | { ok: true; file: UploadedFile }
  | { ok: false; message: string };

export async function uploadFileAction(formData: FormData): Promise<UploadState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a file to upload." };
  }

  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const body = new FormData();
  body.append("file", file);

  try {
    const response = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      /* No `content-type` — `fetch` sets it, with the multipart boundary. */
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      body,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      /* `413` and `415` carry a sentence written for a person ("Files must be
         10 MB or smaller", "That file type is not allowed"), so it is passed
         through rather than flattened into generic copy — those two are the
         errors a user can actually act on. */
      return {
        ok: false,
        message: payload?.message ?? "That file could not be uploaded.",
      };
    }

    return { ok: true, file: payload.data.file };
  } catch {
    return { ok: false, message: "Upload failed. Check your connection." };
  }
}
