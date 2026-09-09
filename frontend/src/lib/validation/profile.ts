/*
 * Client-side rules for the profile form. A convenience — the API's Joi schema
 * in `backend/src/modules/user/user.validator.js` is the control, and these
 * mirror it so a mistake is caught before a round-trip rather than after one.
 *
 * Every field here is OPTIONAL, which is what separates these from
 * `validation/auth.ts`: an empty name is a name being cleared, not a name that
 * failed validation. Only a value that is present and wrong is an error.
 */

const NAME_MAX = 80;
const NICKNAME_MAX = 40;
const PHONE_MIN = 4;
const PHONE_MAX = 32;

/** Digits and the punctuation a person writes a number with. Mirrors the API. */
const PHONE_SHAPE = /^[0-9+\-() .]+$/;

export function validateProfileName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  return trimmed.length > NAME_MAX ? `Keep this under ${NAME_MAX} characters.` : null;
}

export function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  return trimmed.length > NICKNAME_MAX
    ? `Keep this under ${NICKNAME_MAX} characters.`
    : null;
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.length < PHONE_MIN || trimmed.length > PHONE_MAX) {
    return "Enter a phone number between 4 and 32 characters.";
  }

  return PHONE_SHAPE.test(trimmed)
    ? null
    : "Use digits and + - ( ) . only.";
}

/**
 * A form field's value as the API wants it: the trimmed string, or `null` to
 * clear.
 *
 * The empty string is never sent. The API accepts `null` for "clear this" and
 * rejects `""` as too short — so a user emptying a field would otherwise get a
 * validation error for doing the one thing that field's empty state means.
 */
export function fieldOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();

  return trimmed.length > 0 ? trimmed : null;
}
