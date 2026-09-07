/**
 * Turns a workspace name into a URL-safe, unique slug.
 *
 * Used only by `workspace.repository.js`. Pure and Prisma-free by design —
 * `withUniqueSlug` takes the insert as a callback so the retry loop is
 * testable without a database and has no opinion on what "insert" means for
 * its caller.
 *
 * See .claude/plan/workspace.md §2.1
 */

const MAX_ATTEMPTS = 20;

/**
 * Lowercases, collapses every run of non `[a-z0-9]` characters to one `-`,
 * and trims leading/trailing `-`. A name that is all punctuation or emoji
 * collapses to nothing, so that case falls back to a fixed default rather
 * than shipping an empty slug.
 */
const generateSlug = (name) => {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'workspace';
};

/**
 * Retries `insert(candidateSlug)` against `-2`, `-3`, … suffixes when it
 * rejects with a Postgres unique-constraint violation (`P2002`).
 *
 * Deliberately not a `SELECT` for availability first: two requests choosing
 * the same base name could both see the slug as free and then both insert,
 * one of them failing anyway — the check would have proven nothing. Letting
 * the unique constraint itself decide, and retrying on its rejection, is the
 * only version of this that is actually race-free.
 *
 * `insert` must reject with a Prisma error carrying `code: 'P2002'` on a slug
 * collision — any other rejection propagates immediately, unretried.
 */
const withUniqueSlug = async (name, insert) => {
  const base = generateSlug(name);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;

    try {
      return await insert(candidate);
    } catch (error) {
      if (error?.code !== 'P2002' || attempt === MAX_ATTEMPTS - 1) throw error;
    }
  }

  // Unreachable: the loop above returns or throws on every iteration. Kept
  // so a future refactor that changes the loop shape fails loudly instead of
  // falling through to `undefined`.
  throw new Error('Slug generation exhausted its attempt budget');
};

export { generateSlug, withUniqueSlug };
