---
name: module-consistency
description: MUST BE USED when building, editing, or reviewing any backend feature module — adding a module, adding an endpoint to one, touching a controller/service/repository/routes/dto/validator, or writing error handling. Enforces the 6-file module layout, the route → asyncHandler(controller) → service → AppError → global handler flow, and the known-vs-unknown error rules. Every module must look and behave the same; check any module you touch against the new-module checklist here.
---

# Module consistency

Every feature module in `src/modules/<module>/` has the same six files, the
same layering, and the same error path. Sameness is the feature: a reviewer
should be able to open any module and know where each kind of code lives
without reading it first.

Skeletons for all six, plus `asyncHandler.js`, `AppError.js` and
`error.middleware.js`, are in `templates/`. Copy them and replace `<module>`
(singular camelCase — `task`) and `<Module>` (PascalCase — `Task`).

**Related skills — do not duplicate them, point at them:**

| Skill | Owns |
|---|---|
| [api-response](../api-response/SKILL.md) | the `{ success, statusCode, message, data }` envelope and the `ApiResponse` helper |
| [api-contract-doc](../api-contract-doc/SKILL.md) | `docs/api/<module>.md` — structure, depth, the reasoning a module must record |
| [backend-scaffold](../backend-scaffold/SKILL.md) | creating the tree in the first place |

This skill owns the **layering and the error path**.

---

## The six files

| File | Owns | Never |
|---|---|---|
| `<module>.controller.js` | read `req`, call the service, respond via `ApiResponse`; every async handler wrapped in `asyncHandler` | business logic, database access, `try/catch` |
| `<module>.service.js` | business logic, orchestration; throws `AppError` on failure | `req`, `res`, Prisma, sending anything |
| `<module>.repository.js` | all Prisma/database access | HTTP concepts, `AppError`, business rules |
| `<module>.routes.js` | endpoints, guards, validators, rate limiters | logic of any kind, inline handlers |
| `<module>.dto.js` | request → payload, row → response shaping | validation, database access |
| `<module>.validator.js` | input validation **and normalization**; normalized values written back to `req.body` | authorization, business rules |

A layer calls only the one below it: **controller → service → repository.** A
controller that imports `prisma`, or a service that touches `res`, is the
mistake this split exists to prevent.

All six are present in every module, even when one is nearly empty. A missing
`dto.js` is how response shaping ends up inlined in a controller three months
later.

---

## Request → response flow

```
route
  → asyncHandler(controller)
      → controller calls service
          → service throws AppError on failure
      → asyncHandler catches the rejection, calls next(err)
  → global error handler (mounted LAST)
      → ApiResponse.error(res, statusCode, message)
```

The success path is the same minus the throw: the service returns, the
controller hands the result to `ApiResponse.success` / `.paginated`.

Nothing short-circuits this. A controller that catches and responds, or a
service that sends, breaks the single place where responses are shaped — and
the two paths drift immediately.

---

## Error handling rules

- **`asyncHandler` wraps every async controller**, wired at the routes layer.
  An unwrapped async controller that throws produces an unhandled rejection
  and a hung request: the error never reaches the handler, so nothing is
  logged and nothing is returned. **No `try/catch` in controllers.**
- **Services throw `AppError(statusCode, message)`** — never a generic
  `Error` for an expected failure, and never a response. A generic `Error` is
  treated as a bug and becomes a 500; correct for a bug, wrong for "that task
  doesn't exist".
- **The global handler has the 4-arg signature** `(err, req, res, next)` and
  is **mounted LAST in `app.js`**, after all routes and middleware. Express
  identifies an error handler by that arity — drop the unused `next` and it
  silently becomes ordinary middleware that never runs.
- **Known vs unknown is the handler's whole job:**

  | | Response |
  |---|---|
  | `instanceof AppError` (operational) | `ApiResponse.error(res, err.statusCode, err.message)` — we chose both |
  | anything else | log the real error server-side; respond generic `500 "Internal server error"` |

  Never leak a Prisma message, a driver error, or a stack trace to a client:
  they disclose schema, file paths and library versions. Stack traces appear
  in development only, and only as an extra field.
- **All responses go through `ApiResponse`.** Controllers never hand-roll
  `res.json()`. See [api-response](../api-response/SKILL.md).
- **Every file carries a multi-line comment header** stating its
  responsibility and cross-referencing the relevant skill or doc. The
  templates already have theirs — keep them.

### Canonical paths

So imports match across modules:

```
src/shared/utils/asyncHandler.js
src/shared/utils/AppError.js
src/shared/utils/apiResponse.js
src/shared/constants/httpStatus.js
src/shared/middlewares/error.middleware.js
src/shared/middlewares/validate.js
src/shared/middlewares/auth.js
src/shared/middlewares/permission.js
src/shared/middlewares/rateLimiter.js
```

---

## New-module checklist

- [ ] All **six files** present, each with the responsibility above and a
      multi-line header.
- [ ] `asyncHandler` on **every** async controller in `routes.js`.
- [ ] **No `res`, no `req`, no Prisma** anywhere in the service.
- [ ] **No `prisma` import** outside `repository.js`.
- [ ] Expected failures throw **`AppError`**, not a generic `Error`.
- [ ] Validator **normalizes** (trim/lowercase/coerce) so lower layers see one
      form of every value.
- [ ] Routes wired into **`src/routes/index.js`** — never into `app.js`.
- [ ] Responses go through **`ApiResponse`**; status codes come from
      `httpStatus`, not bare integers.
- [ ] **`docs/api/<module>.md`** exists and is current — see
      [api-contract-doc](../api-contract-doc/SKILL.md).

Run the checklist against any module you touch, not only new ones.

---

## Wrong vs right

**Service sending a response**

```js
// ✗ WRONG — the service owns a res it should never have seen. It can no
//   longer be called from a worker or another service, and this failure is
//   now shaped differently from every other failure in the app.
const create = async (body, res) => {
  if (await repo.existsByName(body.name)) {
    return res.status(409).json({ error: 'Already exists' });
  }
};

// ✓ RIGHT — throw; the global handler shapes it, once, for everyone.
const create = async (body) => {
  if (await repo.existsByName(body.name)) {
    throw new AppError(httpStatus.CONFLICT, 'A task with this name already exists');
  }
};
```

**Controller with inline try/catch**

```js
// ✗ WRONG — catches what asyncHandler exists to forward, invents a second
//   error shape, and leaks err.message (which may be a Prisma error) on a 500.
const getById = async (req, res) => {
  try {
    const task = await taskService.getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✓ RIGHT — no try/catch, no not-found branch, no res.json. The service
//   throws AppError(404); asyncHandler forwards; the handler responds.
const getById = async (req, res) => {
  const task = await taskService.getById(req.params.id);
  return ApiResponse.success(res, httpStatus.OK, 'Task fetched successfully', task);
};
```

```js
// routes.js — and the wrapper that makes the above safe:
router.get('/:id', authGuard, asyncHandler(taskController.getById));
// ✗ router.get('/:id', authGuard, taskController.getById);  // hangs on throw
```

**Other frequent breaks**

```js
// ✗ Prisma in a controller or service — repository.js owns every query.
const task = await prisma.task.findUnique({ where: { id } });

// ✗ Generic Error for an expected failure — becomes a 500.
throw new Error('Task not found');

// ✗ Bare status integer instead of an httpStatus constant.
throw new AppError(404, 'Task not found');

// ✗ Mounting a module router in app.js instead of routes/index.js.
app.use('/api/v1/tasks', taskRoutes);
```
