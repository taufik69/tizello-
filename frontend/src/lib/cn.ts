/**
 * Joins class names, dropping anything falsy. Deliberately NOT a conflict-aware
 * merge (no `tailwind-merge` — this package adds no dependencies), so every
 * primitive below keeps its base classes free of properties a caller is likely
 * to override. Where an override is expected, the base simply does not set it.
 */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
