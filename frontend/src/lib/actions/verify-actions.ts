"use server";

import { redirect } from "next/navigation";
import { resendRegistrationCode, verifyRegistrationCode } from "@/lib/auth-tokens";
import { BOARD_HOME } from "@/lib/session-cookie";
import { normaliseEmail, validateCode, validateEmail } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

/**
 * `POST /verify-registration-code`. Redeeming the code both verifies the
 * address and signs the user in — same as `codeSignIn` in auth-actions.ts —
 * so success is a `redirect()`, never a rendered "verified" state.
 */
export async function verifyRegistrationCodeAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const code = String(formData.get("code") ?? "");

  const codeError = validateCode(code);
  if (codeError) return { fieldErrors: { code: codeError } };

  const result = await verifyRegistrationCode({ email, code });
  if (!result.ok) return { code: result.code };

  redirect(BOARD_HOME);
}

/**
 * Fires on Resend. Returns nothing: a 202 for every address, known or not, is
 * the whole point — see `requestSignInCodeAction` in auth-actions.ts for the
 * identical shape on the login-code flow.
 */
export async function resendRegistrationCodeAction(email: string): Promise<void> {
  if (validateEmail(email)) return;
  await resendRegistrationCode(normaliseEmail(email));
}

/**
 * Shown when `/verify-email` is reached without knowing which address to send
 * to — most commonly, someone whose account still isn't verified tries to log
 * in and follows "Resend code" from `AuthAlert`, which has no address in hand.
 * Collects one, sends the code, and lands them on the same code-entry screen
 * `signUpAction` redirects to.
 */
export async function requestRegistrationCodeAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const emailError = validateEmail(email);
  if (emailError) return { fieldErrors: { email: emailError } };

  await resendRegistrationCode(email);
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
