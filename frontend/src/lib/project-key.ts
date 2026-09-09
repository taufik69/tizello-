/**
 * The task-ID prefix a project name implies — "Tizello Web App" → `TWA`.
 *
 * A DELIBERATE MIRROR of `backend/src/shared/utils/projectKey.js`'s
 * `deriveKey`, character for character. The server is still the one that
 * decides: the Key row is left out of the create request whenever the user has
 * not typed one (`create-project-submit.ts`), so a collision is silently
 * suffixed there rather than coming back as a `409` for a value nobody chose.
 *
 * This copy exists only so the field can SHOW that decision while the name is
 * being typed. Two implementations that must agree is a real cost; the
 * alternative — a round trip per keystroke to an endpoint that does not exist
 * — is a worse one.
 *
 * The single divergence: an empty name derives to `""` rather than to the
 * server's `PROJ` fallback, because "" is what the placeholder is for. A name
 * that is all punctuation or emoji still falls back, exactly as the server
 * does, so what the field shows is what the project gets.
 */
const MIN_LENGTH = 2;
const MAX_LENGTH = 5;
const FALLBACK = "PROJ";

export function deriveProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return name.trim() ? FALLBACK : "";

  const candidate =
    words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join("");

  const key = candidate.slice(0, MAX_LENGTH);

  return key.length >= MIN_LENGTH ? key : FALLBACK;
}
