# User

The account's own profile — `src/modules/user/`.

Two endpoints, both `/me`, both about the caller and nobody else.

| Method | Path | Guard | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | `authGuard` | read the caller's profile |
| `PATCH` | `/api/v1/users/me` | `authGuard` | update name, nickname, phone, avatar |

---

## Why there is no `/:id`

A profile is edited only by the person it belongs to, and the identity comes
from the verified token rather than the path. No id in a route means no id to
authorize, no IDOR to get wrong, and no admin path left unguarded by accident.

Reading *another* person's display fields already has a home:
`GET /workspaces/:workspaceId/members` returns the roster, scoped by a
membership the caller has to hold. Adding `GET /users/:id` here would be a
second, unscoped route to the same data.

There is no admin override either. Workspace roles govern **workspaces** — an
OWNER can change your role and remove you from their workspace; they cannot
rename you. Editing another account would need a system-level permission model
this app does not have.

---

## What cannot be changed here

`email`, `emailVerifiedAt`, `passwordHash` and `id` are **refused, not
ignored**: the schema forbids unknown keys, so a body carrying one answers
`400 VALIDATION_ERROR`. Silently dropping the field would let a client believe a
write succeeded.

Email specifically is not a profile field. It is the login identity, the address
an invitation is bound to (`invitation.service.js` → `assertEmailBinding`), and
the subject of `emailVerifiedAt`. Changing it means proving the new address
while the old one stays live until that succeeds — its own tokens, its own
failure states, and a decision about what happens to pending invitations
addressed to the old one. That is a flow, not a form field.

---

## Fields

| Field | Type | Rules |
|---|---|---|
| `name` | `string \| null` | 1–80 after trim |
| `nickname` | `string \| null` | 1–40 after trim |
| `phone` | `string \| null` | 4–32 chars from `0-9 + - ( ) . ` and space |
| `avatarUrl` | `string \| null` | `/uploads/<uuid>.(png\|jpg\|webp\|gif)` |

**Every field is nullable, and `null` is not the same as omitting it.** Omitted
means "leave this alone"; `null` clears it. Without an explicit null, a nickname
once set could never be removed, and "clear this" would need its own endpoint.

### `phone` is deliberately permissive

Digits and the punctuation a person writes a number with. This is a display
field the app never dials, so an E.164 rule would reject correctly-written local
numbers — a Bangladeshi `01712-345678`, an extension — to buy a guarantee
nothing here needs. Add the strict rule when something actually sends an SMS.

### `avatarUrl` must be a path this server wrote

It arrives from the client, which got it from `POST /api/v1/uploads` — so it is
client input, and an unconstrained string would accept:

- `https://evil.example/x.png` — rendered by every member who sees this profile,
  which leaks their IP and turns a profile field into a tracking pixel.
- `/uploads/../../etc/passwd` — path traversal, if anything ever resolves it.
- `/uploads/<uuid>.pdf` — a real file of ours that renders as a broken image
  everywhere an avatar appears.

The pattern admits exactly what `shared/middlewares/upload.js` generates,
narrowed to the four image extensions in its allowlist. Note what it does **not**
check: that the file exists. A row can name a deleted file, and the client
renders its fallback — the alternative is a `stat` on every profile write to
prevent a broken image.

### The replaced file is deleted

Setting a new `avatarUrl`, or clearing it, unlinks whatever the previous value
pointed at.

`docs/api/upload.md` lists orphan collection as an open question, and for a
project's `FILES` property it genuinely is: that metadata lives inside a
project's JSON, so proving no row still references a file means scanning every
project on every write. **An avatar is not that case** — one column on one row,
the previous value in hand before the update, exactly one user who could have
referenced it. The proof is free, so not doing it would leave a dead file on
disk every time anyone changes their photo.

Two details:

- **It runs after the write, not before.** A failed update must not have
  deleted the photo the row still points at.
- **It is best-effort and silent.** The write has already committed, so failing
  the request would report an error for something that succeeded. A missed
  unlink logs a warning and leaves one orphan — the state everything else is
  in today.

`removeStored` re-validates the name against the shape the upload middleware
generates and throws for anything else, so a hand-written `avatarUrl` that got
past the validator still cannot point `unlink` somewhere it should not.

### The upload is a separate request

There is no multipart body here. The client `POST`s the image to
`/api/v1/uploads` (which already has its own limiter, type allowlist and
generated filename), gets `{ file: { url } }` back, and sends that `url` as
`avatarUrl`. Two requests, and each does one thing.

Files uploaded this way are served by the **public** `/static` mount, like every
other upload — see `docs/api/upload.md` for what that costs. For an avatar it is
the intended behaviour: a browser cannot send this app's session with an
`<img src>`.

---

## Responses

Both endpoints return the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile",
  "data": {
    "profile": {
      "id": "cm…",
      "email": "you@example.com",
      "name": "Taufik Islam",
      "nickname": "Tau",
      "phone": "01712-345678",
      "avatarUrl": "/uploads/2f1c….png",
      "emailVerified": true,
      "createdAt": "2026-09-09T16:26:35.879Z",
      "updatedAt": "2026-09-09T16:31:02.114Z"
    }
  }
}
```

`emailVerified` is a boolean, not the stored timestamp — same rule as
`auth.dto.js`: a client only branches on whether it is set, and the raw value
says exactly when an account was proved.

**`toProfile` is not `toUser`.** `toUser` is the session shape every
authenticated response carries; widening it would put a phone number into every
sign-in, refresh and session response. A profile is read on one screen.

### Errors

| Status | `code` | When |
|---|---|---|
| `400` | `VALIDATION_ERROR` | unknown key, bad shape, or empty body |
| `401` | `TOKEN_INVALID` | no session |
| `404` | `NOT_FOUND` | the token is valid but the row is gone |
| `422` | `VALIDATION_ERROR` | empty write set reaching the service directly |

`404` is reachable: `authGuard` proves the token, not that the user still
exists. A session outliving its row — deleted account, restored database — must
not become a 500 on a page load.
