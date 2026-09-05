# Code comments

## Multi-line file headers

**Every shared utility, middleware, and module file — plus any non-trivial
function — gets a multi-line comment header** stating what it is responsible
for, how it is meant to be used, and which skill or doc governs it.

```js
/**
 * <what this file is responsible for, in one line>
 *
 * <how it is used, and the constraint that is easy to get wrong — the thing
 * a reader would otherwise "simplify" away.>
 *
 * See .claude/skills/<skill>/SKILL.md
 *      and docs/api/<module>.md
 */
```

## What a header is for

Not a restatement of the code — the code is right there. A header records the
**why**: the alternative that was rejected, the constraint that is not visible
locally, the reason a line that looks redundant is load-bearing.

Good: *"Express identifies an error handler by its four-argument signature, so
the unused `next` is load-bearing — remove it and this silently stops running."*

Useless: *"This is the error handler."*

## Cross-references

Every header points at the skill or doc that owns its rules, so a reader lands
on the full reasoning from any file:

| File | Points at |
|---|---|
| `shared/utils/apiResponse.js`, `AppError.js` | [api-response](../skills/api-response/SKILL.md) |
| `shared/middlewares/error.middleware.js`, `shared/utils/asyncHandler.js` | [module-consistency](../skills/module-consistency/SKILL.md), [error-handling.md](./error-handling.md) |
| `modules/<module>/*.js` | [module-consistency](../skills/module-consistency/SKILL.md), `docs/api/<module>.md` |

Docs point back at files by path. Neither is discoverable from the other
otherwise.
