"use server";

import { redirect } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/auth-tokens";
import {
  normaliseEmail,
  validateConfirm,
  validateEmail,
  validatePassword,
} from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

/**
 * "Can't log in?" — spec §6.3. `done: true` renders the confirmation, and it
 * renders whether or not the address exists. Anything conditional here is an
 * enumeration oracle, so there is no branch to leak one.
 */
export async function forgotPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const emailError = validateEmail(email);
  if (emailError) return { fieldErrors: { email: emailError } };

  await requestPasswordReset(email);
  return { done: true };
}

/**
 * Setting a new password from `?token=`. On success the user is sent to
 * `/sign-in?reset=1` rather than signed in: possession of a link is not proof
 * of identity strong enough for a session (spec §6.4).
 */
export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: Record<string, string> = {};
  const passwordError = validatePassword(password);
  const confirmError = validateConfirm(password, confirm);
  if (passwordError) errors.password = passwordError;
  if (confirmError) errors.confirm = confirmError;
  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  const result = await resetPassword({ token, password });
  if (!result.ok) return { code: result.code };

  redirect("/sign-in?reset=1");
}

/** Resend of the recovery link, from the confirmation view's countdown button. */
export async function resendRecoveryAction(email: string): Promise<void> {
  if (validateEmail(email)) return;
  await requestPasswordReset(normaliseEmail(email));
}
