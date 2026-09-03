/**
 * Simulates the latency of a real query so `loading.tsx` and `<Suspense>`
 * fallbacks are observable rather than theoretical.
 *
 * The fixture modules that read data share this one shim so the delay is tuned
 * in a single place. `auth-fixtures.ts` deliberately keeps its own randomised
 * 200–400ms version — auth is the one flow where a variable, slower response is
 * the point.
 */
export const settle = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 120));
