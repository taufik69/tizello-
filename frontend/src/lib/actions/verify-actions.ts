"use server";

import { requestVerificationEmail } from "@/lib/auth-tokens";
import { normaliseEmail, validateEmail } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

/**
 * `POST /resend-verification`. Like every other unauthenticated send, it
 * reports the same thing for a known and an unknown address (spec §9).
 */
export async function resendVerificationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const emailError = validateEmail(email);
  if (emailError) return { fieldErrors: { email: emailError } };

  await requestVerificationEmail(email);
  return { done: true };
}

/**
 * The same send, called directly rather than through a form — the Resend
 * button already holds the address and has nothing to collect. Invoking a
 * Server Action is still a POST.
 */
export async function resendVerificationEmailAction(email: string): Promise<void> {
  if (validateEmail(email)) return;
  await requestVerificationEmail(normaliseEmail(email));
}
