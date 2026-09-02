import type { User } from "@/types/auth";

/*
 * In-memory stand-in for the auth database, same pattern as `src/lib/boards.ts`.
 * Module state: edits survive navigation within a dev session and reset on
 * restart. Nothing outside `src/lib/auth*.ts` reads this file — swapping it for
 * real `fetch` calls is the whole migration.
 *
 * Behaviour is pinned by spec §10.
 */

export type StoredUser = User & { password: string | null };

let nextId = 3;

export const users: StoredUser[] = [
  {
    id: "u-1",
    name: "Alex Rahman",
    email: "alex@tizello.dev",
    emailVerified: true,
    createdAt: "2026-03-11T09:24:00.000Z",
    password: "password123",
  },
  {
    /* Seeded unverified so the EMAIL_NOT_VERIFIED branch is reachable. */
    id: "u-2",
    name: "Priya Das",
    email: "priya@tizello.dev",
    emailVerified: false,
    createdAt: "2026-08-29T16:02:00.000Z",
    password: "password123",
  },
];

/**
 * Server-side only. A real backend checks a list of millions; eight entries are
 * enough to prove the WEAK_PASSWORD path renders. `password123` is left off on
 * purpose — it is the seeded fixture credential.
 */
const COMMON_PASSWORDS = [
  "password",
  "12345678",
  "qwertyuiop",
  "letmein123",
  "iloveyou11",
  "111111111",
  "football22",
  "adminadmin",
];

export function isCommonPassword(value: string): boolean {
  return COMMON_PASSWORDS.includes(value.toLowerCase());
}

/** Every call sleeps 200–400ms so loading states are real rather than theoretical. */
export function settle<T>(value: T): Promise<T> {
  const delay = 200 + Math.round(Math.random() * 200);
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

/**
 * Strips the password before anything leaves this module. Written out field by
 * field rather than as a rest-spread so a secret added to StoredUser later
 * cannot leak by default.
 */
export function toUser(stored: StoredUser): User {
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    emailVerified: stored.emailVerified,
    createdAt: stored.createdAt,
  };
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.find((user) => user.email === email);
}

export function findUserById(id: string): StoredUser | undefined {
  return users.find((user) => user.id === id);
}

export function addUser(name: string, email: string, password: string): StoredUser {
  const created: StoredUser = {
    id: `u-${nextId++}`,
    name,
    email,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    password,
  };
  users.push(created);
  return created;
}

/**
 * Spec §10: any 32-character hex string is a valid token, and the literal
 * `expired` is expired. That is enough to render all three token states without
 * inventing a token format the backend then has to match.
 */
export type TokenState = "valid" | "expired" | "invalid";

export function readToken(token: string | undefined): TokenState {
  if (!token) return "invalid";
  if (token === "expired") return "expired";
  return /^[0-9a-f]{32}$/i.test(token) ? "valid" : "invalid";
}

/**
 * Login codes, keyed by email. The fixture "sends" one by logging it to the
 * server console. It also accepts the literal `000000` — see the acceptance
 * check in spec §14: that literal must be gone before any real deployment.
 */
export const DEV_CODE = "000000";

const codes = new Map<string, { code: string; expiresAt: number }>();
const CODE_TTL_MS = 10 * 60 * 1000;

export function issueCode(email: string): void {
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  codes.set(email, { code, expiresAt: Date.now() + CODE_TTL_MS });
  console.info(`[auth fixture] login code for ${email}: ${code}`);
}

/** Single-use: a correct code is burned whether or not the caller succeeds. */
export function consumeCode(email: string, candidate: string): TokenState {
  if (candidate === DEV_CODE) return "valid";
  const issued = codes.get(email);
  if (!issued || issued.code !== candidate) return "invalid";
  codes.delete(email);
  return issued.expiresAt < Date.now() ? "expired" : "valid";
}
