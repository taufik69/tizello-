/**
 * Turns a project name into its task-ID prefix — "Tizello Web App" → `TWA`,
 * which is what makes a task `TWA-1`.
 *
 * Used only by `project.repository.js`. Pure and Prisma-free by design, the
 * same bargain `slug.js` strikes: `withUniqueKey` takes the insert as a
 * callback, so the retry loop is testable without a database.
 *
 * The one place this deliberately diverges from `slug.js`: a workspace slug is
 * never accepted from a client, so suffixing it on collision surprises nobody.
 * A project key IS client-supplied when given, and silently renaming a value
 * somebody typed is hostile — so `project.service.js` sends a supplied key
 * straight to the insert and turns its `P2002` into a `409`, and only a DERIVED
 * key goes through `withUniqueKey` below.
 *
 * See .claude/plan/project.md §2.2
 */

const MAX_ATTEMPTS = 20;
const MIN_LENGTH = 2;
const MAX_LENGTH = 5;
const FALLBACK = 'PROJ';

/**
 * Initials for a multi-word name, the first three characters for a single
 * word. Anything left with fewer than two usable characters — a name that is
 * all punctuation or emoji — falls back to a fixed default rather than
 * shipping a one-character prefix nobody can read.
 */
const deriveKey = (name) => {
  const words = String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return FALLBACK;

  const candidate =
    words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join('');

  const key = candidate.slice(0, MAX_LENGTH);

  return key.length >= MIN_LENGTH ? key : FALLBACK;
};

/**
 * Retries `insert(candidateKey)` against `KEY2`, `KEY3`, … when it rejects
 * with a Postgres unique-constraint violation (`P2002`) — here the compound
 * `(workspaceId, key)` constraint, since two workspaces may both want `WEB`.
 *
 * Not a `SELECT` for availability first, for the reason `slug.js` spells out:
 * two requests can both see the key as free and both insert, so the check
 * proves nothing. Letting the constraint decide is the only race-free version.
 *
 * The suffix eats into the BASE rather than extending past `MAX_LENGTH` —
 * `ABCDE` retried becomes `ABCD2`, never `ABCDE2` — because the column is a
 * display prefix with a length rule, and a retry must not be the one thing
 * that breaks it.
 *
 * `insert` must reject with a Prisma error carrying `code: 'P2002'` on a key
 * collision; any other rejection propagates immediately, unretried.
 */
const withUniqueKey = async (base, insert) => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const suffix = attempt === 0 ? '' : String(attempt + 1);
    const candidate = `${base.slice(0, MAX_LENGTH - suffix.length)}${suffix}`;

    try {
      return await insert(candidate);
    } catch (error) {
      if (error?.code !== 'P2002' || attempt === MAX_ATTEMPTS - 1) throw error;
    }
  }

  // Unreachable: the loop returns or throws on every iteration. Kept so a
  // refactor that changes its shape fails loudly rather than resolving
  // `undefined`.
  throw new Error('Project key generation exhausted its attempt budget');
};

export { deriveKey, withUniqueKey };
