"use server";

import { redirect } from "next/navigation";
import {
  endSession,
  login,
  register,
  requestLoginCode,
  startSession,
  verifyLoginCode,
} from "@/lib/auth";
import { BOARD_HOME } from "@/lib/session-cookie";
import {
  normaliseEmail,
  safeNextPath,
  validateCode,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation/auth";
import { AUTH_ERROR_COPY, type AuthFormState, type User } from "@/types/auth";

/*
 * Every field is re-validated here. The client-side rules in
 * `lib/validation/auth.ts` are a convenience; this is the control (spec §7).
 * `redirect()` throws, so it is always the last statement on a success path.
 */

const field = (name: string, message: string): AuthFormState => ({
  fieldErrors: { [name]: message },
});

/** Either a credential that checked out, or the state to render instead. */
type StepResult = { user: User } | { state: AuthFormState };

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  const result = await register({ name, email, password });
  if (!result.ok) {
    if (result.code === "EMAIL_TAKEN") {
      return field("email", AUTH_ERROR_COPY.EMAIL_TAKEN);
    }
    if (result.code === "WEAK_PASSWORD") {
      return field("password", AUTH_ERROR_COPY.WEAK_PASSWORD);
    }
    return { code: result.code };
  }

  /* Unverified accounts do not get a session — verification is a wall (§15). */
  redirect(`/verify-email?pending=1&email=${encodeURIComponent(email)}`);
}

/**
 * Step 2 of sign-in, both modes. Step 1 never reaches here: it validates the
 * email's shape in the browser and advances, so there is no unauthenticated
 * endpoint that reveals whether an address is registered (spec §6.2).
 */
export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const mode = formData.get("mode") === "password" ? "password" : "code";
  const remember = formData.get("remember") === "on";
  const next = safeNextPath(String(formData.get("next") ?? "")) ?? BOARD_HOME;

  const emailError = validateEmail(email);
  if (emailError) return field("email", emailError);

  const result = await (mode === "password"
    ? passwordSignIn(email, String(formData.get("password") ?? ""))
    : codeSignIn(email, String(formData.get("code") ?? "")));

  if ("state" in result) return result.state;
  await startSession(result.user, remember);
  redirect(next);
}

async function passwordSignIn(email: string, password: string): Promise<StepResult> {
  if (password.length === 0) {
    return { state: field("password", "Enter your password.") };
  }
  const result = await login({ email, password });
  return result.ok ? { user: result.user } : { state: { code: result.code } };
}

async function codeSignIn(email: string, code: string): Promise<StepResult> {
  const codeError = validateCode(code);
  if (codeError) return { state: field("code", codeError) };
  const result = await verifyLoginCode({ email, code });
  return result.ok ? { user: result.user } : { state: { code: result.code } };
}

/**
 * Fires when step 2 opens in code mode, and again on Resend. Returns nothing:
 * a 202 for every address, known or not, is the whole point.
 */
export async function requestSignInCodeAction(email: string): Promise<void> {
  if (validateEmail(email)) return;
  await requestLoginCode(email);
}

/** A POST, never a link — a GET that mutates is CSRF-able and gets prefetched. */
export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/sign-in");
}
