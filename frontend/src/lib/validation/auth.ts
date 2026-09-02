/**
 * Field rules shared by the client leaves and the Server Actions.
 *
 * Two layers, one source of truth: the client layer is a convenience, the
 * server layer is the control. Every rule here is re-run in the action
 * regardless of what the browser did. See spec §7.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const CODE_LENGTH = 6;

/** Deliberately loose. The only authority on an address is a mail round-trip. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    return "Enter your name.";
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX) {
    return "Enter a valid email address.";
  }
  return EMAIL_SHAPE.test(trimmed) ? null : "Enter a valid email address.";
}

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) return "Use at least 8 characters.";
  if (value.length > PASSWORD_MAX) return "Use fewer than 128 characters.";
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  return password === confirm ? null : "Passwords don't match.";
}

export function validateCode(value: string): string | null {
  return /^\d{6}$/.test(value) ? null : "Enter the 6-digit code.";
}

/** Addresses are lowercased before they leave the browser, and again server-side. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

/**
 * Advisory only — it never blocks submission. Length does most of the work
 * because it genuinely does; the character-class points are a nudge, not a
 * policy. No dependency: a zxcvbn-grade estimator is 400KB of client bundle
 * for a meter.
 */
export function passwordScore(value: string): number {
  if (value.length < PASSWORD_MIN) return 0;
  let score = 1;
  if (value.length >= 12) score += 1;
  if (value.length >= 16) score += 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(value),
  ).length;
  if (classes >= 3) score += 1;
  return Math.min(score, 4);
}

/**
 * `?next=` is attacker-controlled. Only a same-origin absolute path survives:
 * anything with a scheme, and the `//host` protocol-relative form, is dropped.
 * Spec §14 tests `?next=https://evil.example` explicitly.
 */
export function safeNextPath(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || value.includes("://")) return null;
  return value;
}
