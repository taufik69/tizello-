/**
 * Joi's per-field `details` array (from the API's `shared/middlewares/validate.js`)
 * → the `{ field: message }` map `TextField` and `TextArea` read.
 *
 * Shared rather than copied into each `lib/<module>.ts`: every module's
 * validation failure has the same shape because one middleware produces all of
 * them, and three copies of this narrowing is three places for a guard to be
 * dropped. `unknown` in, because `details` is whatever the wire sent.
 */
export function fieldErrorsFrom(details: unknown): Record<string, string> | undefined {
  if (!Array.isArray(details)) return undefined;

  const errors: Record<string, string> = {};
  for (const entry of details) {
    if (
      entry &&
      typeof entry === "object" &&
      "field" in entry &&
      "message" in entry &&
      typeof entry.field === "string" &&
      typeof entry.message === "string"
    ) {
      errors[entry.field] = entry.message;
    }
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}
