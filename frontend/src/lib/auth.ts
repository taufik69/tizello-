import { cookies } from "next/headers";
import {
  addUser,
  consumeCode,
  findUserByEmail,
  findUserById,
  isCommonPassword,
  issueCode,
  settle,
  toUser,
} from "@/lib/auth-fixtures";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-cookie";
import { normaliseEmail } from "@/lib/validation/auth";
import type { AuthErrorCode, User } from "@/types/auth";

/*
 * The whole auth surface. Every function here stands in for one endpoint from
 * spec §9 and keeps that endpoint's signature, so replacing the fixture body
 * with `fetch` is a change to this file and nothing else.
 *
 * This is the one module in `src/lib/` outside `lib/actions/` that imports
 * `next/*`: spec §10 puts the session cookie read here so a Server Component
 * can `await getSession()` directly. Password recovery and email verification
 * live next door in `auth-tokens.ts` — one file would blow the 150-line cap.
 */

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; code: AuthErrorCode };

/* --- session ------------------------------------------------------------ */

/** `GET /session`. Returns null rather than throwing — callers branch on it. */
export async function getSession(): Promise<User | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const stored = findUserById(id);
  return stored ? toUser(stored) : null;
}

/**
 * httpOnly so the token is never readable by JS, SameSite=Lax so a cross-site
 * POST cannot ride it. "Remember me" is the only thing that decides whether the
 * cookie outlives the browser session.
 */
export async function startSession(user: User, remember: boolean): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/* --- credentials -------------------------------------------------------- */

/** `POST /register`. The account starts unverified; §15 treats that as a wall. */
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = normaliseEmail(input.email);
  if (findUserByEmail(email)) return settle({ ok: false, code: "EMAIL_TAKEN" });
  if (isCommonPassword(input.password)) {
    return settle({ ok: false, code: "WEAK_PASSWORD" });
  }
  const created = addUser(input.name.trim(), email, input.password);
  return settle({ ok: true, user: toUser(created) });
}

/**
 * `POST /login`. A wrong password and an unknown address return the *same*
 * code and take the same time — splitting them would turn this into an
 * enumeration oracle (spec §8).
 */
export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const stored = findUserByEmail(normaliseEmail(input.email));
  if (!stored || stored.password !== input.password) {
    return settle({ ok: false, code: "INVALID_CREDENTIALS" });
  }
  if (!stored.emailVerified) {
    return settle({ ok: false, code: "EMAIL_NOT_VERIFIED" });
  }
  return settle({ ok: true, user: toUser(stored) });
}

/**
 * `POST /login/request-code`. Always resolves, known address or not, and pads
 * to the same delay as everything else — the response must carry no signal.
 */
export async function requestLoginCode(rawEmail: string): Promise<void> {
  const email = normaliseEmail(rawEmail);
  if (findUserByEmail(email)) issueCode(email);
  return settle(undefined);
}

/** `POST /login/verify-code`. Single-use; a used or stale code is burned. */
export async function verifyLoginCode(input: {
  email: string;
  code: string;
}): Promise<AuthResult> {
  const email = normaliseEmail(input.email);
  const state = consumeCode(email, input.code);
  if (state === "expired") return settle({ ok: false, code: "CODE_EXPIRED" });

  const stored = findUserByEmail(email);
  if (state === "invalid" || !stored) {
    return settle({ ok: false, code: "CODE_INVALID" });
  }
  if (!stored.emailVerified) {
    return settle({ ok: false, code: "EMAIL_NOT_VERIFIED" });
  }
  return settle({ ok: true, user: toUser(stored) });
}
