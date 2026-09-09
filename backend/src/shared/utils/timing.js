/**
 * Constant-time padding for endpoints that must not reveal whether an account
 * exists.
 *
 * `/resend-verification`, `/login/request-code` and `/forgot-password` all
 * answer `202` whether or not the address is real. That hides the answer in the
 * *status* and leaks it in the *clock*: the unknown address returns after one
 * indexed SELECT, the real one after a bcrypt hash, a token insert and a queue
 * push. Eight milliseconds versus ninety is a reliable oracle, and it undoes
 * the entire point of the uniform status.
 *
 * `withMinimumDuration` runs the work and then waits until a fixed floor has
 * elapsed, so every call takes the same observable time regardless of which
 * branch ran. The floor must sit above the slow path's typical cost — set it
 * below and the slow path overshoots it, which restores the oracle while
 * looking like the fix is in place.
 *
 * This is deliberately not a general-purpose sleep: padding is only correct
 * where the *duration itself* is the thing being hidden.
 *
 * See .claude/specs/auth/auth.sprint2.md §2.4 and auth.sprint4.md §4.1
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The floor, in milliseconds. 250ms comfortably exceeds a bcrypt(12) hash plus
 * a couple of round trips to Postgres and Redis on this hardware, and is short
 * enough that a human reads the response as instant.
 */
const ENUMERATION_SAFE_MS = 250;

/**
 * Awaits `work()` and returns its result no sooner than `floorMs` after the
 * call started.
 *
 * The rejection path is padded too, and that matters: an unpadded throw would
 * return fast and mark exactly the requests that hit an error branch. The
 * caller still sees the original error.
 */
const withMinimumDuration = async (work, floorMs = ENUMERATION_SAFE_MS) => {
  const startedAt = Date.now();

  try {
    return await work();
  } finally {
    const remaining = floorMs - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
  }
};

export { withMinimumDuration, ENUMERATION_SAFE_MS, sleep };
