# Upload

File storage for project `FILES` properties — `src/modules/upload/`.

The bytes go to disk under `config.upload.dir`; the database holds only
metadata, inside the project's `properties` map. That is why this module has no
Prisma at all, and why a later move to S3 replaces `readFile` / `unlink` in
`upload.service.js` and nothing else.

---

## Two read paths

The upload directory is served **twice**, on purpose, and the difference is who
may read a file.

| Path | Guard | Who can read |
|---|---|---|
| `GET /api/v1/uploads/:name` | `authGuard` | any signed-in user |
| `GET /static/:name` | none | **anyone with the URL** |

### Why the public one exists

A browser cannot send this app's session with an `<img src>`. The cookies are
`httpOnly` on the **web client's** origin, so a request to this API is
cross-origin and arrives with nothing — the authenticated route answers `401`
however CORS is configured. Rendering an attachment therefore meant proxying
every byte through the Next server, which held the cookie jar.

`app.use('/static', express.static(config.upload.dir))` in `src/app.js` removes
that hop. The web client points `NEXT_PUBLIC_UPLOADS_URL` at it and the browser
loads files directly.

### What that costs

**Every uploaded file is public.** `express.static` runs before any guard, so
possession of a URL is the whole authorization check — including for files
attached to a private project, and including after the person who uploaded it
loses access to that project. Stored names are UUIDs, so they are unguessable,
but unguessable is obscurity, not access control: a URL that leaks through a
pasted link, a `Referer` header or a browser history sync grants permanent
access, and the only revocation is deleting the file.

This was an explicit operator decision. To reverse it, delete the `/static`
mount from `src/app.js` and point the client back at a same-origin proxy in
front of `GET /api/v1/uploads/:name`.

### What still holds

- **Only files this server wrote are in the directory**, named `<uuid>.<ext>`
  where the extension comes from the MIME allowlist in
  `shared/middlewares/upload.js` — never from the uploaded filename. So there
  is no stored HTML or SVG for the static handler to serve as a document, and
  no client-supplied path component for it to resolve.
- `Cross-Origin-Resource-Policy: cross-origin` is set per response. It is
  required, not cosmetic: `helmet()` defaults it to `same-origin`, which makes
  the browser discard every one of these responses when another origin loads
  them.
- `X-Content-Type-Options: nosniff` is set, so a stored `.txt` cannot be
  re-read by the browser as HTML.
- **No `Content-Security-Policy`.** `sandbox` was set here at first and removed:
  a sandboxed document cannot start the browser's built-in PDF viewer, so
  opening an attachment in a tab downloaded it rather than showing it. The case
  it hedged against is already closed by the MIME allowlist (no HTML, no SVG)
  and by `nosniff`.
- `index: false` and `dotfiles: 'deny'`: the mount cannot list the directory or
  return a stray dotfile.
- `Cache-Control: public, max-age=31536000, immutable`. Correct rather than
  aggressive, because a stored name is content-addressed and never reused.
- A miss falls through to the app's own 404 handler, so a missing file answers
  with the standard JSON envelope rather than the static handler's HTML.

---

## 1. `POST /api/v1/uploads`

`multipart/form-data`, one file in the field `file`. Any signed-in user —
`authGuard`. `uploadLimiter`.

Not workspace-scoped, deliberately: a file is uploaded **before** it is
attached to anything (the user picks it in a drawer that may never be saved),
so there is no project to scope it to and scoping it to a workspace would be a
permission check on a resource the request has not named.

| Rule | Value | Enforced by |
|---|---|---|
| Max size | `UPLOAD_MAX_BYTES`, default 10 MB | multer, **before** the write |
| Types | 13 MIME types, allowlisted | multer `fileFilter` |
| Stored name | `<uuid>.<ext>` from the allowlist | `diskStorage.filename` |

No SVG and no video. An SVG is an XML document that can carry script, and
serving one from this origin would be a stored-XSS primitive.

**`201`**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "File uploaded",
  "data": {
    "file": {
      "id": "63fa692c-1701-42bd-a6cf-ef1c2559d36b",
      "name": "dot.png",
      "storedName": "63fa692c-1701-42bd-a6cf-ef1c2559d36b.png",
      "url": "/uploads/63fa692c-1701-42bd-a6cf-ef1c2559d36b.png",
      "size": 69,
      "mime": "image/png"
    }
  }
}
```

`name` is what the user recognises, kept for display and for the download's
`Content-Disposition`; it never touches the filesystem. `url` is the
**authenticated** path — a client using the static mount builds its own URL
from `storedName`.

This object is exactly what a `FILES` property value holds, and
`shared/constants/propertyTypes.js` validates every field of it on the way
into a project, including that `url === "/uploads/" + storedName`. A client
that could set an arbitrary `url` could make the app render an image from
anywhere.

**Errors**

| Status | When |
|---|---|
| `400` | No file in the request |
| `401` | Not signed in |
| `413` | Over `UPLOAD_MAX_BYTES` — "Files must be 10 MB or smaller" |
| `415` | Type not on the allowlist — "That file type is not allowed" |
| `429` | `uploadLimiter` |

The limiter is mounted **before** multer, so a rejected request has not written
a file first.

---

## 2. `GET /api/v1/uploads/:name`

The authenticated read. `authGuard`, `apiLimiter`. `res.sendFile` with
`Content-Disposition: inline` and `X-Content-Type-Options: nosniff`.

`:name` is matched against `/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i` before it is
joined onto the upload directory, so traversal is impossible by construction
rather than by careful joining. Anything else is a `404`.

**Any authenticated user may fetch any stored file.** That is a documented
limit, not an oversight: per-file ownership needs a files *table*, and the
metadata currently lives inside a project's JSON where no index can reach it.

---

## Open questions

1. **Orphans are never collected.** A file uploaded into a drawer somebody then
   cancels stays on disk, referenced by nothing. Deleting it would need the
   server to prove no project references it — a scan of every project's JSON on
   every abandoned upload. A sweep job is the eventual answer.
2. **Removing a file from a property detaches it; it does not delete the
   bytes**, for the same reason.
3. **No per-file authorization**, and with the static mount, no authorization
   at all on the public path. Both need a files table.
