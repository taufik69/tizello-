---
name: api-response
description: MUST BE USED when writing any API controller, endpoint response, or error handling in this repo — any time a route sends a body, a service reports a failure, or error/validation middleware is written or edited. Defines the one response envelope { success, statusCode, message, data }, the ApiResponse helper (success / error / paginated), the AppError class services throw, and the status codes to use. NEVER hand-roll res.json(...) with an inline object — read this first and go through ApiResponse.
---

# API response contract

One envelope for every endpoint in the app. A client parses one shape; a
single hand-rolled `res.json({ ... })` makes that false for the whole API.

Templates in `templates/` are the canonical implementations — copy them, do
not retype them from memory.

## The two rules

1. **Controllers never call `res.json` / `res.send` / `res.status(...).json`.**
   Every response goes through `ApiResponse`.
2. **Services never touch `res`. They `throw new AppError(...)`.**
   The centralized error middleware is the only place an error becomes a
   response.

Everything below follows from those two.

---

## The envelope

### Success — `ApiResponse.success(res, statusCode, message, data = null, extra = {})`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task fetched successfully",
  "data": { "id": "clx...", "title": "Ship the sprint board" }
}
```

### Error — `ApiResponse.error(res, statusCode, message, data = null)`

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": [{ "field": "title", "message": "\"title\" is required" }]
}
```

`data` carries structured detail — never a stack trace or a raw driver error.
In development only, the error middleware additionally nests
`{ details, stack }` there as a debugging aid.

### Paginated — `ApiResponse.paginated(res, statusCode, message, data, page, limit, total, extra = {})`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks fetched successfully",
  "data": [{ "id": "clx..." }],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

`total` is the count of **all** matching rows, not `data.length` — `totalPages`
is derived from it as `Math.ceil(total / limit)`.

### `extra`

An optional object merged as sibling **top-level** keys, not nested under
`data`:

```js
ApiResponse.success(res, httpStatus.OK, 'Tasks fetched', tasks, { fromCached: true });
// → { success, statusCode, message, data, fromCached: true }
```

Omitting it leaves every existing call site byte-identical, which is what makes
it safe to add to one endpoint without touching the rest. Use it for response
metadata (`fromCached`), never for payload fields — those belong in `data`.

---

## Files

| File | Responsibility |
|---|---|
| `src/shared/utils/apiResponse.js` | The `ApiResponse` class. The only file that builds a response body. |
| `src/shared/utils/AppError.js` | The `AppError` class. Thrown by services. |
| `src/shared/middlewares/error.middleware.js` | Centralized handler + 404 catch-all. The only file that turns an error into a response. |
| `src/shared/constants/httpStatus.js` | Status-code constants. |

Templates: `apiResponse.js`, `AppError.js`, `error.middleware.js` (lands as
`src/shared/middlewares/error.middleware.js`), and `controller-example.js`
(reference only — copy the shape, not the file).

> **Naming:** file and class are both `AppError` — `import AppError from
> '../utils/AppError.js'`. Middleware lives in `shared/middlewares/` (plural),
> matching the sibling skills and `electrogadet_v2`.

Every file that participates in this contract carries a multi-line comment
header stating its responsibility and pointing back here
(`See .claude/skills/api-response/SKILL.md`). The templates already have theirs
— keep them when copying, and write one for any new file that joins the
contract.

---

## Status codes

Use `httpStatus` constants, never a bare integer.

| Code | Constant | Use for |
|---|---|---|
| 200 | `OK` | Successful read, update, delete |
| 201 | `CREATED` | A resource was created |
| 204 | `NO_CONTENT` | Success with no body (rare — prefer 200 + envelope) |
| 400 | `BAD_REQUEST` | Validation failure, malformed request |
| 401 | `UNAUTHORIZED` | Missing / invalid / expired credentials |
| 403 | `FORBIDDEN` | Authenticated, but not permitted |
| 404 | `NOT_FOUND` | Resource does not exist, or caller may not know it does |
| 409 | `CONFLICT` | Uniqueness violation, illegal state transition |
| 422 | `UNPROCESSABLE_ENTITY` | Well-formed but semantically rejected |
| 429 | `TOO_MANY_REQUESTS` | Rate limited |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected — never thrown deliberately |

401 vs 403: *who are you* vs *I know who you are and no*. Prefer **404 over
403** when confirming a resource exists is itself a leak — e.g. a workspace the
caller is not a member of.

---

## Correct

```js
// task.controller.js — reads req, calls the service, responds. Nothing else.
import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';

const getById = async (req, res) => {
  const task = await taskService.getById(req.params.id);
  return ApiResponse.success(res, httpStatus.OK, 'Task fetched successfully', task);
};

const create = async (req, res) => {
  const task = await taskService.create(req.body, req.user);
  return ApiResponse.success(res, httpStatus.CREATED, 'Task created successfully', task);
};
```

```js
// task.service.js — throws, never responds. It has no res and must not get one.
import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';

const getById = async (id) => {
  const row = await taskRepository.findById(id);

  if (!row) {
    throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
  }

  return toResponse(row);
};
```

Note there is **no try/catch** in the controller. `asyncHandler` (wired in the
routes file) forwards the rejection to the error middleware, which produces the
404 envelope.

## Wrong — do NOT do any of this

```js
// ✗ Inline object: a second response shape, invented at one call site.
res.json({ task });
res.status(200).json({ ok: true, task });
res.status(404).send('Not found');

// ✗ Controller shaping an error. The middleware owns every failure response,
//   and this one is missing `success` and `statusCode` entirely.
const getById = async (req, res) => {
  const task = await taskService.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
};

// ✗ Service touching res. Now the rule "services throw" is false, and this
//   service can never be called from a worker or another service.
const create = async (body, res) => {
  if (!body.title) return res.status(400).json({ message: 'title required' });
};

// ✗ Bare status integers instead of httpStatus constants.
return ApiResponse.success(res, 201, 'Created', task);

// ✗ Swallowing the error and inventing a response.
try {
  const task = await taskService.getById(id);
  return ApiResponse.success(res, httpStatus.OK, 'ok', task);
} catch (err) {
  return res.status(500).json({ message: err.message }); // leaks internals
}

// ✗ Pagination metadata smuggled into `data` instead of using paginated().
return ApiResponse.success(res, httpStatus.OK, 'Tasks fetched', { tasks, total, page });
```

---

## Review checklist

- No `res.json` / `res.send` outside `apiResponse.js` — `/health` is the one
  documented exception, because uptime probes read its raw keys.
- No `statusCode` written as a bare integer.
- Every async controller wrapped in `asyncHandler`.
- Services import `AppError`, not `ApiResponse`.
- `errorHandler` mounted last in `app.js`, after `notFound`.
- New files in the contract carry the multi-line header pointing back here.
